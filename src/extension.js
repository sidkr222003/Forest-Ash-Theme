'use strict';

const vscode = require('vscode');
const path   = require('path');
const os     = require('os');
const fs     = require('fs');
const chroma = require('chroma-js');
const { generateThemeJson } = require('./themeGenerator');
const { STATIC_THEMES } = require('./themesList');
const { readThemeJsonByLabel, listThemeEntries } = require('./themeReading');
const {
  extractSyntaxColors,
  buildThemePreviewHtml,
  buildPaletteInspectorHtml,
  buildThemeOfWeekHtml,
} = require('./themeWebviews');

// ─── Constants ────────────────────────────────────────────────────────────────

const CUSTOM_STATE_KEY = 'forestAsh.customThemes';
const FOCUS_STATE_KEY = 'forestAsh.focusModeState';
const CONTRAST_STATE_KEY = 'forestAsh.highContrastState';
const LANGUAGE_ACCENT_STATE_KEY = 'forestAsh.languageAccentState';
const THEME_OF_WEEK_STATE_KEY = 'forestAsh.themeOfWeekState';

const ITALIC_RULE_NAME = 'Forest Ash Italic Mode';
const CONTRAST_RULE_NAME = 'Forest Ash High Contrast';
const LANGUAGE_RULE_NAME = 'Forest Ash Language Accent';

let focusDecoration = null;
let focusUpdateTimer = null;
let circadianTimer = null;
let paletteViewProvider = null;
let customThemesProvider = null;

// ─── Path helpers ─────────────────────────────────────────────────────────────

/**
 * The extension's own root directory (where package.json lives).
 * __dirname is <ext-root>/src or <ext-root> depending on entry point;
 * we resolve upward until we find package.json.
 */
function extRoot() {
  let dir = __dirname;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('Cannot locate extension root (package.json not found)');
}

/** Folder inside the extension where generated theme JSON files are written. */
function customThemesDir() {
  return path.join(extRoot(), 'themes', 'custom');
}

/** Folder used for community share exports inside the extension root. */
function shareThemesDir() {
  return path.join(extRoot(), 'share');
}

/** Absolute path for a generated theme file. */
function themeFilePath(fileName) {
  return path.join(customThemesDir(), fileName);
}

/** Relative path used in package.json (must be relative to ext root). */
function themeFileRelPath(fileName) {
  return `./themes/custom/${fileName}`;
}

// ─── package.json patching ────────────────────────────────────────────────────

/**
 * Read the extension's package.json, add (or replace) an entry for this theme
 * under contributes.themes, then write it back.
 *
 * VS Code reads package.json once per activation; to make the new entry visible
 * in the native picker the extension host must be reloaded.  We prompt for that
 * after generation.
 */
function patchPackageJson(meta) {
  const pkgPath = path.join(extRoot(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  if (!pkg.contributes)        pkg.contributes = {};
  if (!pkg.contributes.themes) pkg.contributes.themes = [];

  // Remove any existing entry with the same label so we don't accumulate dupes
  pkg.contributes.themes = pkg.contributes.themes.filter(
    t => t.label !== meta.label
  );

  pkg.contributes.themes.push({
    label:  meta.label,
    uiTheme: meta.isDark ? 'vs-dark' : 'vs',
    path:   themeFileRelPath(meta.fileName),
  });

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

/**
 * Remove a theme entry from package.json (called on delete).
 */
function unpatchPackageJson(label) {
  const pkgPath = path.join(extRoot(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  if (!pkg.contributes?.themes) return;
  const before = pkg.contributes.themes.length;
  pkg.contributes.themes = pkg.contributes.themes.filter(t => t.label !== label);
  if (pkg.contributes.themes.length !== before) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function getCustomThemes(context) {
  return context.globalState.get(CUSTOM_STATE_KEY, []);
}

function saveCustomMeta(context, meta) {
  const customs = getCustomThemes(context);
  const idx = customs.findIndex(t => t.label === meta.label);
  if (idx > -1) customs.splice(idx, 1);
  customs.push(meta);
  return context.globalState.update(CUSTOM_STATE_KEY, customs);
}

function deleteCustomMeta(context, label) {
  const customs = getCustomThemes(context);
  const idx = customs.findIndex(t => t.label === label);
  if (idx === -1) return false;

  const meta     = customs[idx];
  const filePath = themeFilePath(meta.fileName);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (_) { /* ignore */ }
  }

  unpatchPackageJson(label);

  customs.splice(idx, 1);
  context.globalState.update(CUSTOM_STATE_KEY, customs);
  return true;
}

// ─── Restore on activation ────────────────────────────────────────────────────

/**
 * On every activation, make sure every saved custom theme is represented in
 * package.json (the file could have been reverted by git, or the user could
 * have reinstalled the extension).  This is a silent, idempotent sync.
 */
function syncPackageJsonOnActivation(context) {
  const pkgPath = path.join(extRoot(), 'package.json');
  const pkg     = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.contributes)        pkg.contributes = {};
  if (!pkg.contributes.themes) pkg.contributes.themes = [];

  const customs = getCustomThemes(context);
  let dirty = false;

  for (const meta of customs) {
    // Only add if the file actually exists AND the entry is missing
    const filePath    = themeFilePath(meta.fileName);
    const alreadyIn   = pkg.contributes.themes.some(t => t.label === meta.label);
    const fileExists  = fs.existsSync(filePath);

    if (!fileExists) {
      // Theme file is gone — remove stale metadata silently
      const idx = customs.findIndex(t => t.label === meta.label);
      if (idx > -1) customs.splice(idx, 1);
      context.globalState.update(CUSTOM_STATE_KEY, customs);
      pkg.contributes.themes = pkg.contributes.themes.filter(
        t => t.label !== meta.label
      );
      dirty = true;
      continue;
    }

    if (!alreadyIn) {
      pkg.contributes.themes.push({
        label:   meta.label,
        uiTheme: meta.isDark ? 'vs-dark' : 'vs',
        path:    themeFileRelPath(meta.fileName),
      });
      dirty = true;
    }
  }

  if (dirty) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }
}

// ─── HTML escape ──────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[m]);
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

function getActiveThemeLabel() {
  return vscode.workspace.getConfiguration('workbench').get('colorTheme');
}

function toKebab(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveCustomThemeMeta(customs, input) {
  if (!input) return null;
  if (input.meta?.label) return input.meta;
  if (input.label && input.fileName) return input;
  if (input.label && Array.isArray(customs)) {
    return customs.find(t => t.label === input.label) || null;
  }
  if (typeof input === 'string' && Array.isArray(customs)) {
    return customs.find(t => t.label === input) || null;
  }
  return null;
}

class CustomThemeItem extends vscode.TreeItem {
  constructor(meta) {
    super(meta.label, vscode.TreeItemCollapsibleState.None);
    this.meta = meta;
    this.contextValue = 'forestAshCustomTheme';
    this.description = `${meta.isDark ? 'Dark' : 'Light'} · ${meta.baseColor}`;
    this.tooltip = `${meta.label}\n${meta.isDark ? 'Dark' : 'Light'} · ${meta.baseColor}`;
    this.iconPath = new vscode.ThemeIcon(meta.isDark ? 'symbol-color' : 'color-mode');
    this.command = {
      command: 'forestAsh.applyCustomTheme',
      title: 'Apply Custom Theme',
      arguments: [meta],
    };
  }
}

class CustomThemesProvider {
  constructor(context) {
    this.context = context;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element) {
    return element;
  }

  getChildren() {
    const items = getCustomThemes(this.context)
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(meta => new CustomThemeItem(meta));
    return items;
  }
}

class PaletteViewProvider {
  constructor(context) {
    this.context = context;
    this.view = null;
  }

  async resolveWebviewView(view) {
    this.view = view;
    view.webview.options = { enableScripts: true };

    view.webview.onDidReceiveMessage(async message => {
      if (message.type === 'copy' && message.value) {
        await vscode.env.clipboard.writeText(message.value);
        vscode.window.showInformationMessage(`Copied ${message.value}`);
      }
    });

    await this.refresh();
  }

  async refresh() {
    if (!this.view) return;
    const themeLabel = getActiveThemeLabel();
    const theme = await readThemeJsonByLabel(this.context, themeLabel);
    if (!theme?.colors) {
      this.view.webview.html = buildPaletteInspectorHtml(themeLabel, null, {
        emptyMessage: 'Active theme is not a Forest Ash theme.',
      });
      return;
    }

    this.view.webview.html = buildPaletteInspectorHtml(themeLabel, theme.colors);
  }

  async reveal() {
    await vscode.commands.executeCommand('workbench.view.extension.forestAshViews');
    if (typeof this.view?.show === 'function') {
      this.view.show(true);
    }
  }
}

function parseTimeToMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value || '').trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function getMinutesInTimeZone(timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const hour = Number(parts.find(part => part.type === 'hour')?.value ?? 0);
    const minute = Number(parts.find(part => part.type === 'minute')?.value ?? 0);
    return hour * 60 + minute;
  } catch (_) {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }
}

function blendOver(background, color) {
  const alpha = chroma(color).alpha();
  if (alpha >= 1) return chroma(color);
  const solid = chroma(color).alpha(1).hex();
  return chroma.mix(background, solid, alpha, 'rgb');
}

function ensureContrast(color, background, ratio, isDark) {
  let adjusted = chroma(color);
  let attempts = 0;
  while (chroma.contrast(blendOver(background, adjusted).hex(), background) < ratio && attempts < 16) {
    adjusted = isDark ? adjusted.brighten(0.35) : adjusted.darken(0.35);
    attempts += 1;
  }
  return adjusted.hex();
}

async function updateWorkbenchColors(context, overrides, stateKey) {
  const config = vscode.workspace.getConfiguration('workbench');
  const current = config.get('colorCustomizations') || {};
  const stored = context.globalState.get(stateKey);

  if (!stored) {
    const prev = {};
    Object.keys(overrides).forEach(key => {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        prev[key] = current[key];
      }
    });
    await context.globalState.update(stateKey, { prev, keys: Object.keys(overrides) });
  }

  const next = { ...current, ...overrides };
  await config.update('colorCustomizations', next, vscode.ConfigurationTarget.Global);
}

async function restoreWorkbenchColors(context, stateKey) {
  const config = vscode.workspace.getConfiguration('workbench');
  const current = config.get('colorCustomizations') || {};
  const stored = context.globalState.get(stateKey);
  if (!stored) return;

  const next = { ...current };
  for (const key of stored.keys || []) {
    if (Object.prototype.hasOwnProperty.call(stored.prev || {}, key)) {
      next[key] = stored.prev[key];
    } else {
      delete next[key];
    }
  }

  await config.update('colorCustomizations', next, vscode.ConfigurationTarget.Global);
  await context.globalState.update(stateKey, null);
}

async function updateTokenColorRules(name, rules, languageKey = null) {
  const config = vscode.workspace.getConfiguration('editor');
  const customizations = config.get('tokenColorCustomizations') || {};
  const key = languageKey || 'textMateRules';

  if (languageKey) {
    customizations[languageKey] = customizations[languageKey] || {};
    const existing = customizations[languageKey].textMateRules || [];
    customizations[languageKey].textMateRules = existing.filter(rule => rule.name !== name).concat(rules);
  } else {
    const existing = customizations.textMateRules || [];
    customizations.textMateRules = existing.filter(rule => rule.name !== name).concat(rules);
  }

  await config.update('tokenColorCustomizations', customizations, vscode.ConfigurationTarget.Global);
}

async function removeNamedTokenRules(name, languageKey = null) {
  const config = vscode.workspace.getConfiguration('editor');
  const customizations = config.get('tokenColorCustomizations') || {};
  if (languageKey) {
    const rules = customizations[languageKey]?.textMateRules || [];
    customizations[languageKey] = customizations[languageKey] || {};
    customizations[languageKey].textMateRules = rules.filter(rule => rule.name !== name);
  } else {
    const rules = customizations.textMateRules || [];
    customizations.textMateRules = rules.filter(rule => rule.name !== name);
  }
  await config.update('tokenColorCustomizations', customizations, vscode.ConfigurationTarget.Global);
}

const THEME_MOODS = {
  'Forest Ash': 'Smoky evergreen, calm contrast for long sessions.',
  'Forest Ash Yoru Paper': 'Night paper tones with quiet ink glow.',
  'Forest Ash Sumi Moon': 'Muted charcoal with moonlit accents.',
  'Forest Ash Kitsune Ink': 'Deep ink shadows with sharp highlights.',
  'Forest Ash Shoji Night': 'Soft shoji panels under winter dusk.',
  'Forest Ash Aizome Dusk': 'Indigo haze, low glare, steady focus.',
  'Forest Ash Ronin Lantern': 'Lantern warmth against dark timber.',
  'Forest Ash Bamboo Midnight': 'Cool bamboo greens at midnight.',
  'Forest Ash Nebula Manga': 'Inky space dust with crisp strokes.',
  'Forest Ash Sakura Charcoal': 'Charcoal base with sakura embers.',
  'Forest Ash Kage Washi': 'Washi paper shadowed by soft ink.',
  'Forest Ash Yoru Paper Light': 'Pale paper and soft graphite edges.',
  'Forest Ash Sumi Moon Light': 'Washed moon tones, subtle contrast.',
  'Forest Ash Kitsune Ink Light': 'Light parchment with foxfire ink.',
  'Forest Ash Shoji Night Light': 'Shoji glow with airy highlights.',
  'Forest Ash Aizome Dusk Light': 'Soft indigo wash, low glare.',
  'Forest Ash Ronin Lantern Light': 'Warm lantern haze on rice paper.',
  'Forest Ash Bamboo Midnight Light': 'Bamboo tint with daylight clarity.',
  'Forest Ash Nebula Manga Light': 'Manga panels with cosmic accents.',
  'Forest Ash Sakura Charcoal Light': 'Sakura ash with crisp outlines.',
  'Forest Ash Kage Washi Light': 'Washi grain, gentle shadow detail.',
};

// ─── Commands ─────────────────────────────────────────────────────────────────

async function cmdGenerateTheme(context) {
  // Ensure the custom themes directory exists inside the extension
  const dir = customThemesDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // ── Step 1: base colour ───────────────────────────────────────────────────
  const colorInput = await vscode.window.showInputBox({
    title:       'Forest Ash Theme Generator - Step 1 of 3',
    prompt:      'Enter your base accent color as a hex value',
    placeHolder: '#4a9eff',
    validateInput(val) {
      if (!val) return null;
      if (!/^#[0-9A-Fa-f]{6}$/.test(val.trim()))
        return 'Must be a 6-digit hex color, e.g. #4a9eff';
      return null;
    },
  });
  if (!colorInput) return;
  const baseColor = colorInput.trim().toLowerCase();

  // ── Step 2: variant ───────────────────────────────────────────────────────
  const variant = await vscode.window.showQuickPick(
    [
      { label: '$(moon) Dark',  description: 'Deep, low-glare', id: 'dark'  },
      { label: '$(sun) Light',  description: 'Paper-like',      id: 'light' },
    ],
    { title: 'Forest Ash Theme Generator - Step 2 of 3' }
  );
  if (!variant) return;
  const isDark = variant.id === 'dark';

  // ── Step 3: name ──────────────────────────────────────────────────────────
  const defaultName =
    `Forest Ash Custom ${baseColor.toUpperCase()}${isDark ? '' : ' Light'}`;
  const themeName = await vscode.window.showInputBox({
    title:         'Forest Ash Theme Generator - Step 3 of 3',
    prompt:        'Theme name (must be unique)',
    value:         defaultName,
    validateInput(val) {
      if (!val?.trim()) return 'Name required';
      return null;
    },
  });
  if (!themeName) return;
  const label = themeName.trim();

  // Duplicate check
  const customs = getCustomThemes(context);
  if (customs.some(t => t.label === label)) {
    vscode.window.showErrorMessage(
      `"${label}" already exists. Choose a different name.`
    );
    return;
  }

  // ── Generate & write theme file ───────────────────────────────────────────
  const safeId    = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const timestamp = Date.now();
  const fileName  = `custom-${timestamp}-${safeId}.json`;
  const absPath   = themeFilePath(fileName);

  let themeJson;
  try {
    themeJson = generateThemeJson(label, baseColor, isDark);
    fs.writeFileSync(absPath, JSON.stringify(themeJson, null, 2), 'utf8');
  } catch (err) {
    vscode.window.showErrorMessage(`Generation failed: ${err.message}`);
    return;
  }

  // ── Patch package.json so VS Code registers the theme ─────────────────────
  try {
    const meta = {
      label,
      baseColor,
      isDark,
      variant:     isDark ? 'dark' : 'light',
      safeId,
      fileName,
      generatedAt: timestamp,
    };
    patchPackageJson(meta);
    await saveCustomMeta(context, meta);
    customThemesProvider?.refresh();
  } catch (err) {
    vscode.window.showErrorMessage(
      `Saved theme file but could not register it: ${err.message}`
    );
    return;
  }

  // ── Prompt reload so VS Code picks up the new package.json entry ──────────
  const action = await vscode.window.showInformationMessage(
    `"${label}" created. Reload window to make it appear in the theme picker (Cmd+K Cmd+T).`,
    'Reload Now',
    'Later',
  );
  if (action === 'Reload Now') {
    await vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

async function cmdApplyCustomTheme(context, themeArg = null) {
  const customs = getCustomThemes(context);
  const direct = resolveCustomThemeMeta(customs, themeArg);
  if (direct) {
    await vscode.workspace.getConfiguration('workbench').update(
      'colorTheme', direct.label, vscode.ConfigurationTarget.Global
    );
    vscode.window.showInformationMessage(`Applied: ${direct.label}`);
    return;
  }

  if (!customs.length) {
    vscode.window.showInformationMessage('No custom themes. Generate one first.');
    return;
  }

  const picked = await vscode.window.showQuickPick(
    customs.map(t => ({
      label:       t.label,
      description: `${t.isDark ? '$(moon) Dark' : '$(sun) Light'} · ${t.baseColor}`,
    })),
    { title: 'Forest Ash Apply Custom Theme', placeHolder: 'Pick a theme' }
  );
  if (!picked) return;

  await vscode.workspace.getConfiguration('workbench').update(
    'colorTheme', picked.label, vscode.ConfigurationTarget.Global
  );
  vscode.window.showInformationMessage(`Applied: ${picked.label}`);
}

async function cmdDeleteCustomTheme(context, themeArg = null) {
  const customs = getCustomThemes(context);
  const direct = resolveCustomThemeMeta(customs, themeArg);

  if (!customs.length) {
    vscode.window.showInformationMessage('No custom themes to delete.');
    return;
  }

  const picked = direct
    ? { themeData: direct }
    : await vscode.window.showQuickPick(
      customs.map(t => ({
        label:       `$(trash) ${t.label}`,
        description: `${t.isDark ? 'dark' : 'light'} · ${t.baseColor}`,
        themeData:   t,
      })),
      { title: 'Delete Custom Forest Ash Theme', placeHolder: 'Select to delete' }
    );
  if (!picked) return;

  const confirm = await vscode.window.showWarningMessage(
    `Delete "${picked.themeData.label}" permanently?`,
    { modal: true }, 'Delete'
  );
  if (confirm !== 'Delete') return;

  deleteCustomMeta(context, picked.themeData.label);
  customThemesProvider?.refresh();

  const reload = await vscode.window.showInformationMessage(
    `Deleted "${picked.themeData.label}". Reload to remove it from the theme picker.`,
    'Reload Now', 'Later'
  );
  if (reload === 'Reload Now') {
    await vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

async function cmdListCustomThemes(context) {
  const customs = getCustomThemes(context);
  if (!customs.length) {
    vscode.window.showInformationMessage('No custom themes yet.');
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    'forestAshCustoms',
    'Forest Ash Custom Themes',
    vscode.ViewColumn.One,
    { enableScripts: false }
  );

  const rows = customs.map(t => `
    <tr>
      <td><span class="swatch" style="background:${escHtml(t.baseColor)}"></span></td>
      <td><strong>${escHtml(t.label)}</strong></td>
      <td>${t.isDark ? 'Dark' : 'Light'}</td>
      <td><code>${escHtml(t.baseColor)}</code></td>
      <td>${new Date(t.generatedAt).toLocaleDateString()}</td>
    </tr>`).join('');

  panel.webview.html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<style>
  body { font-family: var(--vscode-font-family); padding: 24px; }
  h1   { font-size: 1.3em; margin-bottom: 16px; }
  table{ border-collapse: collapse; width: 100%; }
  th, td { padding: 8px 12px; border-bottom: 1px solid var(--vscode-panel-border); text-align: left; }
  th   { color: var(--vscode-descriptionForeground); font-weight: 600; }
  .swatch { display: inline-block; width: 18px; height: 18px; border-radius: 50%;
             border: 1px solid #888; vertical-align: middle; }
  code { font-family: var(--vscode-editor-font-family); }
</style></head>
<body>
  <h1>Custom Forest Ash Themes (${customs.length})</h1>
  <table>
    <thead><tr>
      <th>Colour</th><th>Name</th><th>Variant</th><th>Base Hex</th><th>Created</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body></html>`;
}

async function cmdQuickThemePicker(context) {
  const customs  = getCustomThemes(context);
  const allItems = [
    ...STATIC_THEMES.map(t => ({
      label:       t.label,
      description: t.description,
      detail:      'Built-in',
    })),
    ...customs.map(t => ({
      label:       t.label,
      description: t.isDark ? 'vs-dark' : 'vs',
      detail:      `$(star-full) Custom · ${t.baseColor}`,
    })),
  ];

  const picked = await vscode.window.showQuickPick(allItems, {
    title:       'Forest Ash Quick Theme Picker',
    placeHolder: 'Select a theme to apply',
    matchOnDetail: true,
    matchOnDescription: true,
  });
  if (!picked) return;

  await vscode.workspace.getConfiguration('workbench').update(
    'colorTheme', picked.label, vscode.ConfigurationTarget.Global
  );
  vscode.window.showInformationMessage(`Switched to: ${picked.label}`);
}

// ─── Focus Mode / Zen Palette ───────────────────────────────────────────────

function createFocusDecoration(opacity) {
  if (focusDecoration) focusDecoration.dispose();
  focusDecoration = vscode.window.createTextEditorDecorationType({
    opacity: String(opacity),
    color: new vscode.ThemeColor('editor.foreground'),
  });
}

async function findActiveSymbolRange(editor) {
  const symbols = await vscode.commands.executeCommand(
    'vscode.executeDocumentSymbolProvider',
    editor.document.uri
  );
  if (!symbols || !symbols.length) return null;

  const line = editor.selection.active.line;
  const allowed = new Set([
    vscode.SymbolKind.Function,
    vscode.SymbolKind.Method,
    vscode.SymbolKind.Constructor,
    vscode.SymbolKind.Class,
    vscode.SymbolKind.Interface,
    vscode.SymbolKind.Module,
    vscode.SymbolKind.Namespace,
    vscode.SymbolKind.Struct,
  ]);

  let best = null;
  function visit(list) {
    for (const symbol of list) {
      const range = symbol.range || symbol.location?.range;
      if (!range) continue;
      if (range.start.line <= line && range.end.line >= line) {
        if (allowed.has(symbol.kind)) {
          if (!best) {
            best = { range };
          } else {
            const bestLines = best.range.end.line - best.range.start.line;
            const nextLines = range.end.line - range.start.line;
            if (nextLines < bestLines) best = { range };
          }
        }
        if (symbol.children?.length) visit(symbol.children);
      }
    }
  }

  visit(symbols);
  return best?.range || null;
}

function buildDimRanges(document, focusRange) {
  if (!focusRange) return [];
  const ranges = [];
  const start = new vscode.Position(0, 0);
  const end = document.lineAt(document.lineCount - 1).range.end;

  if (focusRange.start.isAfter(start)) {
    ranges.push(new vscode.Range(start, focusRange.start));
  }
  if (focusRange.end.isBefore(end)) {
    ranges.push(new vscode.Range(focusRange.end, end));
  }
  return ranges;
}

async function updateFocusDecorations(context) {
  const config = vscode.workspace.getConfiguration('forestAsh');
  const enabled = config.get('focusMode.enabled', false);
  const editor = vscode.window.activeTextEditor;
  if (!editor || !focusDecoration) return;

  if (!enabled) {
    editor.setDecorations(focusDecoration, []);
    return;
  }

  const focusRange = await findActiveSymbolRange(editor);
  const ranges = buildDimRanges(editor.document, focusRange);
  editor.setDecorations(focusDecoration, ranges);
}

function scheduleFocusUpdate(context) {
  if (focusUpdateTimer) clearTimeout(focusUpdateTimer);
  focusUpdateTimer = setTimeout(() => updateFocusDecorations(context), 120);
}

async function applyFocusModeColors(context) {
  const theme = await readThemeJsonByLabel(context, getActiveThemeLabel());
  const colors = theme?.colors || {};
  const bg = colors['editor.background'] || ((theme?.type || 'dark') === 'dark' ? '#1e1e1e' : '#ffffff');
  const fg = colors['editor.foreground'] || '#cccccc';
  const accent = colors['editorCursor.foreground'] || colors['textLink.foreground'] || fg;
  const isDark = (theme?.type || 'dark') === 'dark';

  const overrides = {
    'editor.background': isDark ? chroma(bg).darken(0.2).hex() : chroma(bg).brighten(0.2).hex(),
    'editorCodeLens.foreground': chroma(fg).alpha(0.35).hex(),
    'editor.inactiveSelectionBackground': chroma(accent).alpha(isDark ? 0.10 : 0.08).hex(),
    'editorLineNumber.foreground': chroma(fg).alpha(0.35).hex(),
    'editorLineNumber.activeForeground': chroma(fg).alpha(0.70).hex(),
    'editorWhitespace.foreground': chroma(fg).alpha(0.25).hex(),
  };

  await updateWorkbenchColors(context, overrides, FOCUS_STATE_KEY);
}

async function cmdToggleFocusMode(context) {
  const config = vscode.workspace.getConfiguration('forestAsh');
  const enabled = !config.get('focusMode.enabled', false);
  await config.update('focusMode.enabled', enabled, vscode.ConfigurationTarget.Global);
  if (enabled) {
    await applyFocusModeColors(context);
    scheduleFocusUpdate(context);
  } else {
    await restoreWorkbenchColors(context, FOCUS_STATE_KEY);
    if (focusDecoration && vscode.window.activeTextEditor) {
      vscode.window.activeTextEditor.setDecorations(focusDecoration, []);
    }
  }
  vscode.window.showInformationMessage(`Focus Mode ${enabled ? 'enabled' : 'disabled'}.`);
}

// ─── Italic Mode ────────────────────────────────────────────────────────────

function getItalicScopesFromTheme(themeJson) {
  const scopes = new Set();
  for (const rule of themeJson?.tokenColors || []) {
    if (!rule.settings?.fontStyle || !rule.settings.fontStyle.includes('italic')) continue;
    const ruleScopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
    ruleScopes.filter(Boolean).forEach(scope => scopes.add(scope));
  }
  if (!scopes.size) scopes.add('comment');
  return Array.from(scopes);
}

async function applyItalicMode(context, enabled) {
  const theme = await readThemeJsonByLabel(context, getActiveThemeLabel());
  const scopes = getItalicScopesFromTheme(theme);
  const rules = [
    {
      name: ITALIC_RULE_NAME,
      scope: scopes,
      settings: { fontStyle: enabled ? 'italic' : '' },
    },
  ];
  await updateTokenColorRules(ITALIC_RULE_NAME, rules);
}

async function cmdToggleItalicMode(context) {
  const config = vscode.workspace.getConfiguration('forestAsh');
  const enabled = !config.get('italicMode.enabled', false);
  await config.update('italicMode.enabled', enabled, vscode.ConfigurationTarget.Global);
  await applyItalicMode(context, enabled);
  vscode.window.showInformationMessage(`Italic Mode ${enabled ? 'enabled' : 'disabled'}.`);
}

// ─── High Contrast Boost ─────────────────────────────────────────────────────

async function applyHighContrast(context, enabled) {
  if (!enabled) {
    await restoreWorkbenchColors(context, CONTRAST_STATE_KEY);
    await removeNamedTokenRules(CONTRAST_RULE_NAME);
    return;
  }

  const theme = await readThemeJsonByLabel(context, getActiveThemeLabel());
  if (!theme) {
    vscode.window.showWarningMessage('High Contrast Boost works on Forest Ash themes only.');
    return;
  }

  const colors = theme.colors || {};
  const background = colors['editor.background'] || '#1e1e1e';
  const isDark = chroma(background).luminance() < 0.5;

  const overrides = {};
  for (const [key, value] of Object.entries(colors)) {
    if (!value || typeof value !== 'string') continue;
    const lower = key.toLowerCase();
    const isBackground = lower.includes('background') && !lower.includes('foreground');
    if (isBackground) continue;
    overrides[key] = ensureContrast(value, background, 4.5, isDark);
  }

  await updateWorkbenchColors(context, overrides, CONTRAST_STATE_KEY);

  const tokenRules = (theme.tokenColors || [])
    .filter(rule => rule.settings?.foreground)
    .map(rule => ({
      name: CONTRAST_RULE_NAME,
      scope: rule.scope,
      settings: {
        ...rule.settings,
        foreground: ensureContrast(rule.settings.foreground, background, 4.5, isDark),
      },
    }));

  await updateTokenColorRules(CONTRAST_RULE_NAME, tokenRules);
}

async function cmdToggleHighContrast(context) {
  const config = vscode.workspace.getConfiguration('forestAsh');
  const enabled = !config.get('highContrast.enabled', false);
  await config.update('highContrast.enabled', enabled, vscode.ConfigurationTarget.Global);
  await applyHighContrast(context, enabled);
  vscode.window.showInformationMessage(`High Contrast Boost ${enabled ? 'enabled' : 'disabled'}.`);
}

// ─── Language Accent Overrides ───────────────────────────────────────────────

async function applyLanguageAccents(context) {
  const config = vscode.workspace.getConfiguration('forestAsh');
  const accents = config.get('languageAccents') || {};
  const languages = Object.keys(accents)
    .map(lang => String(lang).replace(/^\[|\]$/g, ''))
    .filter(Boolean);

  const prevLanguages = context.globalState.get(LANGUAGE_ACCENT_STATE_KEY, []);
  for (const lang of prevLanguages) {
    if (!languages.includes(lang)) {
      await removeNamedTokenRules(LANGUAGE_RULE_NAME, `[${lang}]`);
    }
  }

  for (const lang of languages) {
    const color = accents[lang] || accents[`[${lang}]`];
    if (!color) continue;
    const languageKey = `[${lang}]`;
    const rules = [
      {
        name: LANGUAGE_RULE_NAME,
        scope: [
          'keyword',
          'storage',
          'entity.name.function',
          'support.function',
          'entity.name.type',
          'support.type',
          'constant.numeric',
          'string',
        ],
        settings: { foreground: color },
      },
    ];
    await updateTokenColorRules(LANGUAGE_RULE_NAME, rules, languageKey);
  }

  await context.globalState.update(LANGUAGE_ACCENT_STATE_KEY, languages);
}

// ─── Circadian Auto-Switching ────────────────────────────────────────────────

async function applyCircadianTheme(context) {
  const config = vscode.workspace.getConfiguration('forestAsh');
  if (!config.get('circadian.enabled', false)) return;

  const dayTheme = config.get('circadian.dayTheme');
  const nightTheme = config.get('circadian.nightTheme');
  const dayStart = parseTimeToMinutes(config.get('circadian.dayStart', '07:00'));
  const nightStart = parseTimeToMinutes(config.get('circadian.nightStart', '19:00'));
  const timeZone = config.get('circadian.timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (dayStart === null || nightStart === null || !dayTheme || !nightTheme) return;

  const minutes = getMinutesInTimeZone(timeZone);
  const isDay = dayStart < nightStart
    ? minutes >= dayStart && minutes < nightStart
    : minutes >= dayStart || minutes < nightStart;

  const target = isDay ? dayTheme : nightTheme;
  if (!target || target === getActiveThemeLabel()) return;

  const entries = await listThemeEntries(context);
  const exists = entries.some(entry => entry.label === target);
  if (!exists) return;

  await vscode.workspace.getConfiguration('workbench').update(
    'colorTheme',
    target,
    vscode.ConfigurationTarget.Global
  );
}

function startCircadianScheduler(context) {
  if (circadianTimer) clearInterval(circadianTimer);
  const config = vscode.workspace.getConfiguration('forestAsh');
  if (!config.get('circadian.enabled', false)) return;

  const intervalMinutes = Math.max(1, config.get('circadian.checkIntervalMinutes', 5));
  applyCircadianTheme(context).catch(() => undefined);
  circadianTimer = setInterval(() => {
    applyCircadianTheme(context).catch(() => undefined);
  }, intervalMinutes * 60 * 1000);
}

async function cmdApplyCircadianTheme(context) {
  const enabled = vscode.workspace.getConfiguration('forestAsh').get('circadian.enabled', false);
  if (!enabled) {
    vscode.window.showInformationMessage('Circadian mode is disabled in settings.');
    return;
  }
  await applyCircadianTheme(context);
  vscode.window.showInformationMessage('Circadian theme applied.');
}

// ─── Theme Preview / Palette Inspector ───────────────────────────────────────

async function cmdPreviewThemes(context) {
  const cards = [];

  for (const theme of STATIC_THEMES) {
    const themeJson = await readThemeJsonByLabel(context, theme.label);
    if (!themeJson) continue;
    const colors = themeJson.colors || {};
    const bg = colors['editor.background'] || (themeJson.type === 'light' ? '#ffffff' : '#1e1e1e');
    const fg = colors['editor.foreground'] || '#cccccc';
    const accent = colors['textLink.foreground'] || colors['editorCursor.foreground'] || fg;
    const syntax = extractSyntaxColors(themeJson);
    cards.push({
      label: theme.label,
      bg,
      fg,
      accent,
      syntax,
      typeLabel: themeJson.type === 'light' ? 'Light' : 'Dark',
    });
  }

  const panel = vscode.window.createWebviewPanel(
    'forestAshPreview',
    'Forest Ash Theme Preview',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  panel.webview.html = buildThemePreviewHtml(cards);
  panel.webview.onDidReceiveMessage(async message => {
    if (message.type === 'applyTheme' && message.label) {
      await vscode.workspace.getConfiguration('workbench').update(
        'colorTheme',
        message.label,
        vscode.ConfigurationTarget.Global
      );
    }
  });
}

async function cmdShowPaletteInspector() {
  if (!paletteViewProvider) {
    vscode.window.showInformationMessage('Palette inspector is not available yet.');
    return;
  }
  await paletteViewProvider.reveal();
  await paletteViewProvider.refresh();
}

async function cmdExportPaletteCss(context) {
  const themeLabel = getActiveThemeLabel();
  const theme = await readThemeJsonByLabel(context, themeLabel);
  if (!theme?.colors) {
    vscode.window.showInformationMessage('Active theme is not a Forest Ash theme.');
    return;
  }

  const vars = Object.entries(theme.colors).map(([key, value]) => {
    const name = `--fa-${toKebab(key)}`;
    return `  ${name}: ${value};`;
  });

  const syntax = extractSyntaxColors(theme);
  Object.entries(syntax).forEach(([key, value]) => {
    vars.push(`  --fa-syntax-${toKebab(key)}: ${value};`);
  });

  const css = [
    `/* Forest Ash Palette: ${themeLabel} */`,
    ':root {',
    ...vars.sort(),
    '}',
    '',
  ].join('\n');

  const defaultName = `forest-ash-${toKebab(themeLabel)}.css`;
  const defaultUri = vscode.Uri.file(path.join(os.homedir(), defaultName));
  const saveUri = await vscode.window.showSaveDialog({
    defaultUri,
    filters: { 'CSS': ['css'] },
  });

  if (!saveUri) return;
  await vscode.workspace.fs.writeFile(saveUri, Buffer.from(css, 'utf8'));
  vscode.window.showInformationMessage(`Exported ${defaultName}`);
}

// ─── Theme of the Week ───────────────────────────────────────────────────────

async function cmdShowThemeOfWeek(context, force = false) {
  const config = vscode.workspace.getConfiguration('forestAsh');
  if (!config.get('themeOfWeek.enabled', true) && !force) return;

  const state = context.globalState.get(THEME_OF_WEEK_STATE_KEY, {});
  const now = Date.now();
  if (!force && state.lastShown && now - state.lastShown < 7 * 24 * 60 * 60 * 1000) return;

  const labels = STATIC_THEMES.map(theme => theme.label);
  const choices = labels.filter(label => label !== state.lastTheme);
  const label = choices[Math.floor(Math.random() * choices.length)] || labels[0];
  const mood = THEME_MOODS[label] || 'Forest Ash spotlight.';

  await context.globalState.update(THEME_OF_WEEK_STATE_KEY, {
    lastShown: now,
    lastTheme: label,
  });

  const panel = vscode.window.createWebviewPanel(
    'forestAshThemeOfWeek',
    'Forest Ash Theme of the Week',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  panel.webview.html = buildThemeOfWeekHtml({ label, mood });
  panel.webview.onDidReceiveMessage(async message => {
    if (message.type === 'applyTheme' && message.label) {
      await vscode.workspace.getConfiguration('workbench').update(
        'colorTheme',
        message.label,
        vscode.ConfigurationTarget.Global
      );
    }
  });
}

// ─── Custom Theme Sharing ────────────────────────────────────────────────────

async function cmdExportCustomTheme(context, themeArg = null) {
  const customs = getCustomThemes(context);
  const direct = resolveCustomThemeMeta(customs, themeArg);
  if (!customs.length) {
    vscode.window.showInformationMessage('No custom themes to export.');
    return;
  }

  const picked = direct
    ? { theme: direct }
    : await vscode.window.showQuickPick(
      customs.map(theme => ({
        label: theme.label,
        description: `${theme.isDark ? 'dark' : 'light'} · ${theme.baseColor}`,
        theme,
      })),
      { title: 'Export Custom Forest Ash Theme' }
    );
  if (!picked) return;

  const filePath = themeFilePath(picked.theme.fileName);
  if (!fs.existsSync(filePath)) {
    vscode.window.showErrorMessage('Theme file not found.');
    return;
  }

  const defaultName = `${toKebab(picked.theme.label)}.json`;
  const defaultUri = vscode.Uri.file(path.join(os.homedir(), defaultName));
  const saveUri = await vscode.window.showSaveDialog({
    defaultUri,
    filters: { 'JSON': ['json'] },
  });
  if (!saveUri) return;

  await vscode.workspace.fs.copy(vscode.Uri.file(filePath), saveUri, { overwrite: true });
  vscode.window.showInformationMessage(`Exported ${defaultName}`);
}

async function cmdShareCustomTheme(context, themeArg = null) {
  const customs = getCustomThemes(context);
  const direct = resolveCustomThemeMeta(customs, themeArg);
  if (!customs.length) {
    vscode.window.showInformationMessage('No custom themes to share.');
    return;
  }

  const picked = direct
    ? { theme: direct }
    : await vscode.window.showQuickPick(
      customs.map(theme => ({
        label: theme.label,
        description: `${theme.isDark ? 'dark' : 'light'} · ${theme.baseColor}`,
        theme,
      })),
      { title: 'Share Custom Forest Ash Theme' }
    );
  if (!picked) return;

  const filePath = themeFilePath(picked.theme.fileName);
  if (!fs.existsSync(filePath)) {
    vscode.window.showErrorMessage('Theme file not found.');
    return;
  }

  const shareDir = shareThemesDir();
  if (!fs.existsSync(shareDir)) fs.mkdirSync(shareDir, { recursive: true });

  const shareName = `${toKebab(picked.theme.label)}.json`;
  const sharePath = path.join(shareDir, shareName);
  fs.copyFileSync(filePath, sharePath);

  const prNote = [
    `Title: Add ${picked.theme.label} custom theme`,
    '',
    `- Variant: ${picked.theme.isDark ? 'Dark' : 'Light'}`,
    `- Base color: ${picked.theme.baseColor}`,
    '- Source: Forest Ash theme generator',
  ].join('\n');

  await vscode.env.clipboard.writeText(prNote);

  const action = await vscode.window.showInformationMessage(
    `Shared ${shareName} to the community folder and copied a PR note to your clipboard.`,
    'Open Share Folder',
    'Open Share Guide'
  );

  if (action === 'Open Share Folder') {
    await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(sharePath));
  }

  if (action === 'Open Share Guide') {
    const guideUri = vscode.Uri.file(path.join(shareDir, 'README.md'));
    try {
      const doc = await vscode.workspace.openTextDocument(guideUri);
      await vscode.window.showTextDocument(doc, { preview: true });
    } catch (_) {
      vscode.window.showInformationMessage('Share guide not found.');
    }
  }
}

async function cmdImportCustomTheme(context) {
  const picked = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { 'JSON': ['json'] },
  });
  if (!picked?.length) return;

  const data = await vscode.workspace.fs.readFile(picked[0]);
  let themeJson;
  try {
    themeJson = JSON.parse(Buffer.from(data).toString('utf8'));
  } catch (err) {
    vscode.window.showErrorMessage('Invalid theme JSON.');
    return;
  }

  if (!themeJson?.colors || !themeJson?.tokenColors) {
    vscode.window.showErrorMessage('Theme JSON missing colors or tokenColors.');
    return;
  }

  const proposedName = themeJson.name || 'Forest Ash Custom';
  const label = await vscode.window.showInputBox({
    title: 'Import Custom Theme',
    prompt: 'Theme name',
    value: proposedName,
  });
  if (!label) return;

  const variantPick = await vscode.window.showQuickPick(
    [
      { label: 'Dark', id: 'dark' },
      { label: 'Light', id: 'light' },
    ],
    { title: 'Theme Variant' }
  );
  if (!variantPick) return;

  const isDark = variantPick.id === 'dark';
  themeJson.name = label;
  themeJson.type = isDark ? 'dark' : 'light';

  const safeId = toKebab(label);
  const fileName = `custom-import-${Date.now()}-${safeId}.json`;
  const absPath = themeFilePath(fileName);
  fs.writeFileSync(absPath, JSON.stringify(themeJson, null, 2), 'utf8');

  const baseColor = themeJson.colors['textLink.foreground']
    || themeJson.colors['editorCursor.foreground']
    || '#4a9eff';

  const meta = {
    label,
    baseColor,
    isDark,
    variant: isDark ? 'dark' : 'light',
    safeId,
    fileName,
    generatedAt: Date.now(),
  };

  patchPackageJson(meta);
  await saveCustomMeta(context, meta);
  customThemesProvider?.refresh();

  const action = await vscode.window.showInformationMessage(
    `Imported "${label}". Reload window to add it to the theme picker.`,
    'Reload Now',
    'Later'
  );
  if (action === 'Reload Now') {
    await vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

// ─── activate / deactivate ────────────────────────────────────────────────────

function activate(context) {
  // Ensure the custom themes directory exists
  const dir = customThemesDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Silently repair package.json on every activation
  try {
    syncPackageJsonOnActivation(context);
  } catch (err) {
    // Non-fatal — log but don't break activation
    console.error('[ForestAsh] syncPackageJson failed:', err.message);
  }

  const focusOpacity = vscode.workspace.getConfiguration('forestAsh').get('focusMode.dimOpacity', 0.35);
  createFocusDecoration(focusOpacity);

  customThemesProvider = new CustomThemesProvider(context);
  paletteViewProvider = new PaletteViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('forestAsh.customThemesView', customThemesProvider),
    vscode.window.registerWebviewViewProvider('forestAsh.paletteView', paletteViewProvider)
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => scheduleFocusUpdate(context)),
    vscode.window.onDidChangeTextEditorSelection(() => scheduleFocusUpdate(context)),
    vscode.workspace.onDidChangeTextDocument(() => scheduleFocusUpdate(context))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'forestAsh.generateTheme',    () => cmdGenerateTheme(context)),
    vscode.commands.registerCommand(
      'forestAsh.applyCustomTheme', themeArg => cmdApplyCustomTheme(context, themeArg)),
    vscode.commands.registerCommand(
      'forestAsh.deleteCustomTheme', themeArg => cmdDeleteCustomTheme(context, themeArg)),
    vscode.commands.registerCommand(
      'forestAsh.listCustomThemes', () => cmdListCustomThemes(context)),
    vscode.commands.registerCommand(
      'forestAsh.quickThemePicker', () => cmdQuickThemePicker(context)),
    vscode.commands.registerCommand(
      'forestAsh.toggleFocusMode',  () => cmdToggleFocusMode(context)),
    vscode.commands.registerCommand(
      'forestAsh.toggleItalicMode', () => cmdToggleItalicMode(context)),
    vscode.commands.registerCommand(
      'forestAsh.toggleHighContrast', () => cmdToggleHighContrast(context)),
    vscode.commands.registerCommand(
      'forestAsh.previewThemes', () => cmdPreviewThemes(context)),
    vscode.commands.registerCommand(
      'forestAsh.showPaletteInspector', () => cmdShowPaletteInspector()),
    vscode.commands.registerCommand(
      'forestAsh.exportPaletteCss', () => cmdExportPaletteCss(context)),
    vscode.commands.registerCommand(
      'forestAsh.exportCustomTheme', themeArg => cmdExportCustomTheme(context, themeArg)),
    vscode.commands.registerCommand(
      'forestAsh.shareCustomTheme', themeArg => cmdShareCustomTheme(context, themeArg)),
    vscode.commands.registerCommand(
      'forestAsh.importCustomTheme', () => cmdImportCustomTheme(context)),
    vscode.commands.registerCommand(
      'forestAsh.applyCircadianTheme', () => cmdApplyCircadianTheme(context)),
    vscode.commands.registerCommand(
      'forestAsh.showThemeOfWeek', () => cmdShowThemeOfWeek(context, true)),
  );

  applyLanguageAccents(context).catch(() => undefined);

  const config = vscode.workspace.getConfiguration('forestAsh');
  if (config.get('italicMode.enabled', false)) {
    applyItalicMode(context, true).catch(() => undefined);
  }
  if (config.get('highContrast.enabled', false)) {
    applyHighContrast(context, true).catch(() => undefined);
  }
  if (config.get('focusMode.enabled', false)) {
    applyFocusModeColors(context).then(() => scheduleFocusUpdate(context));
  }

  startCircadianScheduler(context);
  cmdShowThemeOfWeek(context).catch(() => undefined);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async event => {
      if (event.affectsConfiguration('forestAsh.focusMode')) {
        const updated = vscode.workspace.getConfiguration('forestAsh');
        const enabled = updated.get('focusMode.enabled', false);
        const opacity = updated.get('focusMode.dimOpacity', 0.35);
        createFocusDecoration(opacity);
        if (enabled) {
          await applyFocusModeColors(context);
          scheduleFocusUpdate(context);
        } else {
          await restoreWorkbenchColors(context, FOCUS_STATE_KEY);
          if (focusDecoration && vscode.window.activeTextEditor) {
            vscode.window.activeTextEditor.setDecorations(focusDecoration, []);
          }
        }
      }

      if (event.affectsConfiguration('forestAsh.languageAccents')) {
        await applyLanguageAccents(context);
      }

      if (event.affectsConfiguration('forestAsh.italicMode')) {
        const enabled = vscode.workspace.getConfiguration('forestAsh').get('italicMode.enabled', false);
        await applyItalicMode(context, enabled);
      }

      if (event.affectsConfiguration('forestAsh.highContrast')) {
        const enabled = vscode.workspace.getConfiguration('forestAsh').get('highContrast.enabled', false);
        await applyHighContrast(context, enabled);
      }

      if (event.affectsConfiguration('forestAsh.circadian')) {
        startCircadianScheduler(context);
      }

      if (event.affectsConfiguration('workbench.colorTheme')) {
        const updated = vscode.workspace.getConfiguration('forestAsh');
        if (updated.get('focusMode.enabled', false)) {
          await applyFocusModeColors(context);
          scheduleFocusUpdate(context);
        }
        if (updated.get('highContrast.enabled', false)) {
          await applyHighContrast(context, true);
        }
        if (updated.get('italicMode.enabled', false)) {
          await applyItalicMode(context, true);
        }
        paletteViewProvider?.refresh();
      }
    })
  );
}

function deactivate() {
  if (circadianTimer) clearInterval(circadianTimer);
  if (focusUpdateTimer) clearTimeout(focusUpdateTimer);
  if (focusDecoration) focusDecoration.dispose();
}

module.exports = { activate, deactivate };