'use strict';

const vscode = require('vscode');
const path   = require('path');
const fs     = require('fs');
const { generateThemeJson } = require('./themeGenerator');

// ─── Constants ────────────────────────────────────────────────────────────────

const CUSTOM_STATE_KEY = 'forestAsh.customThemes';

const STATIC_THEMES = [
  { label: 'Forest Ash',                      description: 'vs-dark'  },
  { label: 'Forest Ash Yoru Paper',            description: 'vs-dark'  },
  { label: 'Forest Ash Sumi Moon',             description: 'vs-dark'  },
  { label: 'Forest Ash Kitsune Ink',           description: 'vs-dark'  },
  { label: 'Forest Ash Shoji Night',           description: 'vs-dark'  },
  { label: 'Forest Ash Aizome Dusk',           description: 'vs-dark'  },
  { label: 'Forest Ash Ronin Lantern',         description: 'vs-dark'  },
  { label: 'Forest Ash Bamboo Midnight',       description: 'vs-dark'  },
  { label: 'Forest Ash Nebula Manga',          description: 'vs-dark'  },
  { label: 'Forest Ash Sakura Charcoal',       description: 'vs-dark'  },
  { label: 'Forest Ash Kage Washi',            description: 'vs-dark'  },
  { label: 'Forest Ash Yoru Paper Light',      description: 'vs-light' },
  { label: 'Forest Ash Sumi Moon Light',       description: 'vs-light' },
  { label: 'Forest Ash Kitsune Ink Light',     description: 'vs-light' },
  { label: 'Forest Ash Shoji Night Light',     description: 'vs-light' },
  { label: 'Forest Ash Aizome Dusk Light',     description: 'vs-light' },
  { label: 'Forest Ash Ronin Lantern Light',   description: 'vs-light' },
  { label: 'Forest Ash Bamboo Midnight Light', description: 'vs-light' },
  { label: 'Forest Ash Nebula Manga Light',    description: 'vs-light' },
  { label: 'Forest Ash Sakura Charcoal Light', description: 'vs-light' },
  { label: 'Forest Ash Kage Washi Light',      description: 'vs-light' },
];

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

// ─── Commands ─────────────────────────────────────────────────────────────────

async function cmdGenerateTheme(context) {
  // Ensure the custom themes directory exists inside the extension
  const dir = customThemesDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // ── Step 1: base colour ───────────────────────────────────────────────────
  const colorInput = await vscode.window.showInputBox({
    title:       '🎨 Forest Ash Theme Generator — Step 1 of 3',
    prompt:      'Enter your base accent colour as a hex value',
    placeHolder: '#4a9eff',
    validateInput(val) {
      if (!val) return null;
      if (!/^#[0-9A-Fa-f]{6}$/.test(val.trim()))
        return 'Must be a 6-digit hex colour, e.g. #4a9eff';
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
    { title: '🌗 Forest Ash Theme Generator — Step 2 of 3' }
  );
  if (!variant) return;
  const isDark = variant.id === 'dark';

  // ── Step 3: name ──────────────────────────────────────────────────────────
  const defaultName =
    `Forest Ash Custom ${baseColor.toUpperCase()}${isDark ? '' : ' Light'}`;
  const themeName = await vscode.window.showInputBox({
    title:         '✏️ Forest Ash Theme Generator — Step 3 of 3',
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
  } catch (err) {
    vscode.window.showErrorMessage(
      `Saved theme file but could not register it: ${err.message}`
    );
    return;
  }

  // ── Prompt reload so VS Code picks up the new package.json entry ──────────
  const action = await vscode.window.showInformationMessage(
    `✅ "${label}" created! Reload window to make it appear in the theme picker (Cmd+K Cmd+T).`,
    'Reload Now',
    'Later',
  );
  if (action === 'Reload Now') {
    await vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

async function cmdApplyCustomTheme(context) {
  const customs = getCustomThemes(context);
  if (!customs.length) {
    vscode.window.showInformationMessage('No custom themes. Generate one first.');
    return;
  }

  const picked = await vscode.window.showQuickPick(
    customs.map(t => ({
      label:       t.label,
      description: `${t.isDark ? '🌙' : '☀️'}  ${t.baseColor}`,
    })),
    { title: '🎨 Apply Custom Forest Ash Theme', placeHolder: 'Pick a theme' }
  );
  if (!picked) return;

  await vscode.workspace.getConfiguration('workbench').update(
    'colorTheme', picked.label, vscode.ConfigurationTarget.Global
  );
  vscode.window.showInformationMessage(`Applied: ${picked.label}`);
}

async function cmdDeleteCustomTheme(context) {
  const customs = getCustomThemes(context);
  if (!customs.length) {
    vscode.window.showInformationMessage('No custom themes to delete.');
    return;
  }

  const picked = await vscode.window.showQuickPick(
    customs.map(t => ({
      label:       `🗑️  ${t.label}`,
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
      <td>${t.isDark ? '🌙 Dark' : '☀️ Light'}</td>
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
      detail:      `⭐ Custom · ${t.baseColor}`,
    })),
  ];

  const picked = await vscode.window.showQuickPick(allItems, {
    title:       '🎨 Forest Ash Quick Theme Picker',
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

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'forestAsh.generateTheme',    () => cmdGenerateTheme(context)),
    vscode.commands.registerCommand(
      'forestAsh.applyCustomTheme', () => cmdApplyCustomTheme(context)),
    vscode.commands.registerCommand(
      'forestAsh.deleteCustomTheme',() => cmdDeleteCustomTheme(context)),
    vscode.commands.registerCommand(
      'forestAsh.listCustomThemes', () => cmdListCustomThemes(context)),
    vscode.commands.registerCommand(
      'forestAsh.quickThemePicker', () => cmdQuickThemePicker(context)),
  );
}

function deactivate() {}

module.exports = { activate, deactivate };