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
const { buildPalette, EXPORT_TARGETS } = require('./themeExporter');
const { buildThemeStudioHtml } = require('./themeStudio');
const {
  validateThemeName,
  validateThemeJson,
  parsePaletteText,
} = require('./themeValidation');

// ─── Constants ────────────────────────────────────────────────────────────────

const CUSTOM_STATE_KEY = 'forestAsh.customThemes';
const FOCUS_STATE_KEY = 'forestAsh.focusModeState';
const CONTRAST_STATE_KEY = 'forestAsh.highContrastState';
const LANGUAGE_ACCENT_STATE_KEY = 'forestAsh.languageAccentState';
const THEME_OF_WEEK_STATE_KEY = 'forestAsh.themeOfWeekState';
const FAVORITES_STATE_KEY = 'forestAsh.favoriteThemes';
const RECENT_STATE_KEY = 'forestAsh.recentThemes';
const WORKSPACE_THEMES_KEY = 'forestAsh.workspaceThemes';
const STUDIO_BACKUP_KEY = 'forestAsh.themeStudioBackup';
const STUDIO_AUTOSAVE_KEY = 'forestAsh.themeStudioAutosave';
const STUDIO_RULE_NAME = 'Forest Ash Theme Studio';

const ITALIC_RULE_NAME = 'Forest Ash Italic Mode';
const CONTRAST_RULE_NAME = 'Forest Ash High Contrast';
const LANGUAGE_RULE_NAME = 'Forest Ash Language Accent';

let focusDecoration = null;
let focusUpdateTimer = null;
let circadianTimer = null;
let paletteViewProvider    = null;
let themePreviewProvider   = null;
let customThemesProvider   = null;
let statusBarItem          = null;
let workspaceThemeTimer    = null;
let studioStatusBarItem    = null;
let themeOfWeekPanel       = null;

// Simple in-memory lock to prevent concurrent package.json writes
let pkgWriteLock = Promise.resolve();

// ─── Path helpers ─────────────────────────────────────────────────────────────

function extRoot() {
  let dir = __dirname;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('Cannot locate extension root (package.json not found)');
}

function customThemesDir() {
  return path.join(extRoot(), 'themes', 'custom');
}

function shareThemesDir() {
  return path.join(extRoot(), 'share');
}

function themeFilePath(fileName) {
  return path.join(customThemesDir(), fileName);
}

function themeFileRelPath(fileName) {
  return `./themes/custom/${fileName}`;
}

// ─── package.json patching ────────────────────────────────────────────────────

function patchPackageJson(meta) {
  // Serialise all package.json writes to prevent concurrent corruption
  pkgWriteLock = pkgWriteLock.then(() => {
    const pkgPath = path.join(extRoot(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    if (!pkg.contributes)        pkg.contributes = {};
    if (!pkg.contributes.themes) pkg.contributes.themes = [];

    pkg.contributes.themes = pkg.contributes.themes.filter(
      t => t.label !== meta.label
    );

    pkg.contributes.themes.push({
      label:  meta.label,
      uiTheme: meta.isDark ? 'vs-dark' : 'vs',
      path:   themeFileRelPath(meta.fileName),
    });

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  });
  return pkgWriteLock;
}

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
 * Ensure the `forestAsh.paletteView` view contribution has `"type": "webview"`.
 *
 * VS Code will NEVER call resolveWebviewView — and will show
 * "There is no data provider registered that can provide view data" — unless
 * the view is explicitly declared with `"type": "webview"` in package.json.
 * This patches that field at runtime, the same way patchPackageJson() already
 * handles custom theme entries.
 *
 * Returns true when the file was modified (a reload is needed for VS Code to
 * pick up the change).
 */
function ensurePaletteViewWebviewType() {
  const pkgPath = path.join(extRoot(), 'package.json');
  const pkg     = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  let dirty = false;
  const viewGroups = pkg.contributes?.views || {};

  for (const groupViews of Object.values(viewGroups)) {
    if (!Array.isArray(groupViews)) continue;
    for (const view of groupViews) {
      if (view.id === 'forestAsh.paletteView' && view.type !== 'webview') {
        view.type = 'webview';
        dirty = true;
      }
    }
  }

  if (dirty) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }
  return dirty;
}

function syncPackageJsonOnActivation(context) {
  const pkgPath = path.join(extRoot(), 'package.json');
  const pkg     = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.contributes)        pkg.contributes = {};
  if (!pkg.contributes.themes) pkg.contributes.themes = [];

  const customs = getCustomThemes(context);
  let dirty = false;

  for (const meta of customs) {
    const filePath    = themeFilePath(meta.fileName);
    const alreadyIn   = pkg.contributes.themes.some(t => t.label === meta.label);
    const fileExists  = fs.existsSync(filePath);

    if (!fileExists) {
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

function getFavorites(context) {
  return context.globalState.get(FAVORITES_STATE_KEY, []);
}

async function recordThemeUse(context, label) {
  const recent = context.globalState.get(RECENT_STATE_KEY, []).filter(item => item !== label);
  recent.unshift(label);
  await context.globalState.update(RECENT_STATE_KEY, recent.slice(0, 10));
}

function applyPreset(themeJson, preset) {
  const next = JSON.parse(JSON.stringify(themeJson));
  const colors = next.colors || (next.colors = {});
  const background = colors['editor.background'] || '#1e1e1e';
  const foreground = colors['editor.foreground'] || '#d4d4d4';
  const accent = colors['textLink.foreground'] || colors['editorCursor.foreground'] || '#61afef';
  const transformTokens = transform => {
    next.tokenColors = (next.tokenColors || []).map(rule => ({
      ...rule,
      settings: {
        ...rule.settings,
        ...(rule.settings?.foreground ? { foreground: transform(rule.settings.foreground) } : {}),
      },
    }));
  };
  if (preset === 'oled') {
    colors['editor.background'] = '#000000';
    colors['sideBar.background'] = '#050505';
    colors['panel.background'] = '#050505';
  } else if (preset === 'warm-night') {
    colors['editor.background'] = chroma(background).set('hsl.h', '+8').set('hsl.s', '*0.75').hex();
    colors['editor.foreground'] = chroma(foreground).set('hsl.h', '+8').hex();
    transformTokens(color => chroma(color).set('hsl.h', '+8').set('hsl.s', '*0.8').hex());
  } else if (preset === 'paper-light') {
    colors['editor.background'] = '#f6f1e7';
    colors['editor.foreground'] = '#2c2925';
    colors['sideBar.background'] = '#eee8dc';
  } else if (preset === 'high-contrast') {
    colors['editor.background'] = background;
    colors['editor.foreground'] = chroma(foreground).luminance(0.85).hex();
    transformTokens(color => chroma(color).luminance(0.72).hex());
  } else if (preset === 'calm') {
    colors['editor.background'] = chroma(background).set('hsl.s', '*0.7').hex();
    colors['editor.foreground'] = chroma(foreground).set('hsl.s', '*0.5').hex();
    transformTokens(color => chroma(color).set('hsl.s', '*0.7').hex());
  } else if (preset === 'color-blind') {
    colors['textLink.foreground'] = '#0072B2';
    colors['editorCursor.foreground'] = '#E69F00';
    colors['editorError.foreground'] = '#D55E00';
    colors['editorWarning.foreground'] = '#F0E442';
    colors['editorInfo.foreground'] = '#56B4E9';
  }
  colors['editorCursor.foreground'] = colors['editorCursor.foreground'] || accent;
  return next;
}

function transformThemeForSimulation(themeJson, mode) {
  const next = JSON.parse(JSON.stringify(themeJson));
  const matrix = {
    deuteranopia: [0.625, 0.7, 0, 0.375, 0.3, 0, 0, 0, 1],
    protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0, 1],
    tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
  }[mode];
  if (!matrix) return next;
  const transform = value => {
    if (!/^#[0-9a-f]{6}$/i.test(value)) return value;
    const rgb = [0, 2, 4].map(i => parseInt(value.slice(i + 1, i + 3), 16));
    const result = [0, 1, 2].map(row => Math.round(
      matrix[row * 3] * rgb[0] + matrix[row * 3 + 1] * rgb[1] + matrix[row * 3 + 2] * rgb[2]
    ));
    return `#${result.map(channel => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, '0')).join('')}`;
  };
  next.colors = Object.fromEntries(Object.entries(next.colors || {}).map(([key, value]) => [key, transform(value)]));
  next.tokenColors = (next.tokenColors || []).map(rule => ({
    ...rule,
    settings: { ...rule.settings, foreground: transform(rule.settings?.foreground || '') },
  }));
  return next;
}

// ─── Universal theme JSON reader ──────────────────────────────────────────────
//
// Reads the theme JSON for *any* installed VS Code theme (not just Forest Ash)
// by searching the contributes.themes entries across all loaded extensions.
// Falls back to Forest Ash's own reader first so custom/generated themes
// still work correctly.

async function readAnyThemeJsonByLabel(context, themeLabel) {
  if (!themeLabel) return null;

  // 1. Try the Forest Ash internal reader first (handles custom + built-in FA themes)
  try {
    const faTheme = await readThemeJsonByLabel(context, themeLabel);
    if (faTheme?.colors && Object.keys(faTheme.colors).length > 0) {
      return faTheme;
    }
  } catch (_) {}

  // 2. Search every installed extension for a matching theme contribution
  for (const ext of vscode.extensions.all) {
    const contributed = ext.packageJSON?.contributes?.themes;
    if (!Array.isArray(contributed)) continue;

    for (const t of contributed) {
      if (t.label !== themeLabel || !t.path) continue;

      const themePath = path.isAbsolute(t.path)
        ? t.path
        : path.join(ext.extensionPath, t.path);

      try {
        if (!fs.existsSync(themePath)) continue;
        const parsed = JSON.parse(fs.readFileSync(themePath, 'utf8'));
        // Resolve "include" chains (common in VS Code built-in themes)
        if (parsed?.include) {
          const includePath = path.resolve(path.dirname(themePath), parsed.include);
          try {
            const base = JSON.parse(fs.readFileSync(includePath, 'utf8'));
            parsed.colors      = { ...base.colors,      ...parsed.colors };
            parsed.tokenColors = [...(base.tokenColors || []), ...(parsed.tokenColors || [])];
          } catch (_) {}
        }
        if (parsed?.colors && Object.keys(parsed.colors).length > 0) {
          return parsed;
        }
      } catch (_) {}
    }
  }

  return null;
}

// ─── Tree view items ─────────────────────────────────────────────────────────

// ─── Custom Themes sidebar — webview with mini preview cards ─────────────────

function buildSidebarCustomThemesHtml(customs, activeLabel) {
  const esc = s => String(s).replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]
  );

  if (!customs || customs.length === 0) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
  body{margin:0;padding:0;font-family:var(--vscode-font-family);color:var(--vscode-foreground);background:transparent;}
  .empty{padding:32px 16px;text-align:center;}
  .empty-icon{font-size:32px;margin-bottom:12px;opacity:.4;}
  .empty-title{font-size:12px;font-weight:600;margin-bottom:6px;opacity:.8;}
  .empty-sub{font-size:11px;opacity:.5;line-height:1.5;}
  .gen-btn{
    margin-top:14px;padding:7px 16px;border:none;border-radius:5px;
    font-size:11px;font-weight:600;cursor:pointer;
    background:var(--vscode-button-background);
    color:var(--vscode-button-foreground);
  }
  .gen-btn:hover{opacity:.85;}
</style></head><body>
<div class="empty">
  <div class="empty-icon">🎨</div>
  <div class="empty-title">No Custom Themes Yet</div>
  <div class="empty-sub">Generate a theme from any base colour to see it here.</div>
  <button class="gen-btn" onclick="gen()">Generate Theme</button>
</div>
<script>
  const vscode = acquireVsCodeApi();
  function gen() { vscode.postMessage({ type: 'generate' }); }
</script>
</body></html>`;
  }

  // Build a fake colour palette from the base hex for the mini mockup
  function deriveColors(baseHex, isDark) {
    // Simple deterministic palette derived purely from the hex string
    // (no chroma-js available in the webview context)
    const r = parseInt(baseHex.slice(1,3),16);
    const g = parseInt(baseHex.slice(3,5),16);
    const b = parseInt(baseHex.slice(5,7),16);
    const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
    const bg   = isDark
      ? `#${Math.max(0,r-160).toString(16).padStart(2,'0')}${Math.max(0,g-160).toString(16).padStart(2,'0')}${Math.max(0,b-140).toString(16).padStart(2,'0')}`
      : '#f4f4f2';
    const fg   = isDark ? '#d4d4d4' : '#333333';
    return { bg, fg, accent: baseHex };
  }

  // Pick white or near-black text depending on background luminance
  function contrastText(hexBg) {
    try {
      const r = parseInt(hexBg.slice(1,3),16);
      const g = parseInt(hexBg.slice(3,5),16);
      const b = parseInt(hexBg.slice(5,7),16);
      return (0.299*r + 0.587*g + 0.114*b) > 140 ? '#111111' : '#ffffff';
    } catch(_) { return '#ffffff'; }
  }

  const renderCard = meta => {
    const isActive = meta.label === activeLabel;
    const { bg, fg, accent } = deriveColors(meta.baseColor, meta.isDark);
    const safeLabel = esc(meta.label);

    // Text on accent — always contrast-safe
    const accentText = contrastText(accent);

    // Icon buttons: use a mid-grey that's always visible over any card bg
    // Compute a neutral that's brighter than bg for dark themes, darker for light
    const r = parseInt(bg.slice(1,3)||'28',16);
    const g = parseInt(bg.slice(3,5)||'28',16);
    const b = parseInt(bg.slice(5,7)||'28',16);
    const bgLum = (0.299*r + 0.587*g + 0.114*b);
    const iconBg   = bgLum < 128 ? '#5a5a5a' : '#c0c0c0';
    const iconFg   = bgLum < 128 ? '#f0f0f0' : '#1a1a1a';

    // 5 fake code lines using accent + fg variants
    const lines = [
      { color: accent,  w: 30 },
      { color: fg,      w: 58 },
      { color: accent,  w: 42 },
      { color: fg,      w: 65 },
      { color: accent,  w: 36 },
    ].map(({ color, w }) =>
      `<div class="cl"><span style="width:${w}%;background:${esc(color)};opacity:.82"></span></div>`
    ).join('');

    // 5-swatch row
    const swatches = [accent, accent+'bb', accent+'88', fg+'88', fg+'44'].map(c =>
      `<span class="sw" style="background:${esc(c)}"></span>`
    ).join('');

    const shortName = meta.label.replace(/^Forest Ash\s*/i, '') || meta.label;
    const dateStr   = meta.generatedAt
      ? new Date(meta.generatedAt).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })
      : '';

    return `<div class="card${isActive ? ' active' : ''}"
               data-label="${safeLabel}"
               style="--bg:${esc(bg)};--fg:${esc(fg)};--ac:${esc(accent)};"
               onclick="apply('${safeLabel}')">

      <!-- mini editor mockup -->
      <div class="preview" style="background:${esc(bg)}">
        <div class="titlebar" style="background:${esc(bg)};border-bottom:1px solid ${esc(accent)}33;">
          <span class="dot" style="background:#ff5f57"></span>
          <span class="dot" style="background:#febc2e"></span>
          <span class="dot" style="background:#28c840"></span>
          <span class="tab-lbl" style="color:${esc(fg)};border-bottom:2px solid ${esc(accent)};">
            ${esc(shortName)}
          </span>
        </div>
        <div class="code-area">
          <div class="gutter">
            ${[1,2,3,4,5].map(n=>`<div class="ln" style="color:${esc(fg)}44">${n}</div>`).join('')}
          </div>
          <div class="lines">${lines}</div>
        </div>
        <div class="statusbar" style="background:${esc(accent)}cc;">
          <span style="color:${esc(accentText)};font-size:8px;padding:0 6px;opacity:.9;">
            ${meta.isDark ? 'Dark' : 'Light'} · ${esc(meta.baseColor.toUpperCase())}
          </span>
        </div>
      </div>

      <!-- card footer -->
      <div class="footer" style="background:${esc(bg)}f0;">
        <div class="name" style="color:${esc(fg)};">${esc(shortName)}</div>
        <div class="swatches">${swatches}</div>
        ${dateStr ? `<div class="date">${esc(dateStr)}</div>` : ''}
        <div class="actions" onclick="event.stopPropagation()">
          ${isActive
            ? `<div class="badge active-badge" style="background:${esc(accent)};color:${esc(accentText)};">● Active</div>`
            : `<button class="btn apply-btn"
                       style="background:${esc(accent)};color:${esc(accentText)};"
                       onclick="apply('${safeLabel}')">Apply</button>`
          }
          <button class="btn icon-btn" title="Export"
                  style="background:${esc(iconBg)};color:${esc(iconFg)};"
                  onclick="exportTheme('${safeLabel}')">↑</button>
          <button class="btn icon-btn del-btn" title="Delete"
                  style="background:${esc(iconBg)};color:${esc(iconFg)};"
                  onclick="del('${safeLabel}')">✕</button>
        </div>
      </div>
    </div>`;
  };

  const cards = customs
    .slice()
    .sort((a,b) => a.label.localeCompare(b.label))
    .map(renderCard)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{
    font-family:var(--vscode-font-family,system-ui,sans-serif);
    font-size:11px;
    color:var(--vscode-foreground);
    background:transparent;
    padding-bottom:24px;
    -webkit-font-smoothing:antialiased;
  }

  /* ── sticky header ── */
  .header{
    position:sticky;top:0;z-index:20;
    background:var(--vscode-sideBar-background,#252526);
    border-bottom:1px solid var(--vscode-panel-border,#3c3c3c);
    padding:10px 12px 8px;
    display:flex;align-items:center;justify-content:space-between;
  }
  .header-left h2{font-size:12px;font-weight:600;}
  .header-left .meta{font-size:10px;opacity:.5;margin-top:2px;}
  .gen-header-btn{
    padding:4px 10px;border:none;border-radius:4px;
    font-size:10px;font-weight:600;cursor:pointer;
    background:var(--vscode-button-background);
    color:var(--vscode-button-foreground);
    white-space:nowrap;
  }
  .gen-header-btn:hover{opacity:.85;}

  /* ── search ── */
  .search-wrap{padding:8px 10px 2px;}
  .search-wrap input{
    width:100%;padding:5px 8px;font-size:11px;
    background:var(--vscode-input-background,#3c3c3c);
    color:var(--vscode-input-foreground,#ccc);
    border:1px solid var(--vscode-input-border,#555);
    border-radius:3px;outline:none;
  }
  .search-wrap input:focus{border-color:var(--vscode-focusBorder,#007acc);}

  /* ── grid ── */
  .grid{
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(130px,1fr));
    gap:8px;
    padding:8px 10px 4px;
  }

  /* ── card ── */
  .card{
    border-radius:8px;overflow:hidden;cursor:pointer;
    border:1.5px solid var(--vscode-panel-border,#3c3c3c);
    transition:transform .15s,box-shadow .15s,border-color .15s;
    background:var(--vscode-sideBar-background);
  }
  .card:hover{
    transform:translateY(-3px);
    box-shadow:0 6px 18px rgba(0,0,0,.5);
    border-color:var(--ac,#555);
  }
  .card.active{
    border-color:var(--ac,#007acc);
    box-shadow:0 0 0 1px var(--ac,#007acc);
  }
  .card.hidden{display:none;}

  /* ── mini editor mockup ── */
  .preview{height:88px;display:flex;flex-direction:column;overflow:hidden;}
  .titlebar{display:flex;align-items:center;gap:4px;padding:4px 6px;flex-shrink:0;}
  .dot{width:7px;height:7px;border-radius:50%;}
  .tab-lbl{font-size:8px;padding:0 5px 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px;opacity:.85;}
  .code-area{display:flex;flex:1;overflow:hidden;padding:3px 0 2px;}
  .gutter{display:flex;flex-direction:column;gap:2px;padding:0 5px;flex-shrink:0;}
  .ln{font-size:7px;line-height:1;font-variant-numeric:tabular-nums;}
  .lines{flex:1;display:flex;flex-direction:column;gap:3px;padding:0 4px;}
  .cl{height:7px;border-radius:2px;overflow:hidden;}
  .cl span{display:block;height:100%;border-radius:2px;}
  .statusbar{height:10px;flex-shrink:0;display:flex;align-items:center;}

  /* ── card footer ── */
  .footer{
    padding:6px 8px 7px;
    display:flex;flex-direction:column;gap:4px;
    border-top:1px solid rgba(255,255,255,.07);
  }
  .name{font-size:10px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.9;}
  .swatches{display:flex;gap:3px;}
  .sw{flex:1;height:5px;border-radius:2px;min-width:0;}
  .date{font-size:9px;opacity:.4;}

  /* ── action row ── */
  .actions{display:flex;gap:4px;align-items:center;margin-top:1px;}
  .btn{
    border:none;border-radius:4px;cursor:pointer;
    font-size:10px;font-weight:600;
    transition:opacity .15s, background .15s;padding:4px 0;
  }
  .btn:hover{opacity:.85;}
  .apply-btn{flex:1;}
  .icon-btn{width:24px;flex-shrink:0;font-size:11px;}
  .del-btn:hover{background:#c53030 !important;color:#fff !important;opacity:1;}
  .active-badge{
    flex:1;padding:3px 0;border-radius:4px;
    font-size:10px;font-weight:600;text-align:center;
  }

  /* ── toast ── */
  #toast{
    position:fixed;bottom:12px;left:50%;transform:translateX(-50%) translateY(12px);
    background:var(--vscode-badge-background,#4d4d4d);
    color:var(--vscode-badge-foreground,#fff);
    padding:4px 14px;border-radius:20px;
    font-size:10px;pointer-events:none;
    opacity:0;transition:opacity .2s,transform .2s;z-index:99;
  }
  #toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <h2>Custom Themes</h2>
    <div class="meta">${customs.length} theme${customs.length !== 1 ? 's' : ''}</div>
  </div>
  <button class="gen-header-btn" onclick="gen()">+ Generate</button>
</div>

<div class="search-wrap">
  <input id="q" type="text" placeholder="Search custom themes…" oninput="filter(this.value)">
</div>

<div class="grid">${cards}</div>

<div id="toast"></div>

<script>
  const vscode = acquireVsCodeApi();

  function apply(label) {
    vscode.postMessage({ type: 'apply', label });
    showToast('Applied: ' + label.replace(/^Forest Ash\\s*/i,''));
  }
  function del(label) {
    vscode.postMessage({ type: 'delete', label });
  }
  function exportTheme(label) {
    vscode.postMessage({ type: 'export', label });
  }
  function gen() {
    vscode.postMessage({ type: 'generate' });
  }

  let toastTimer;
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  function filter(q) {
    const lq = q.trim().toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
      const match = !lq || card.dataset.label.toLowerCase().includes(lq);
      card.classList.toggle('hidden', !match);
    });
  }
</script>
</body>
</html>`;
}

class CustomThemesProvider {
  constructor(context) {
    this.context = context;
    this.view    = null;
  }

  resolveWebviewView(view) {
    this.view = view;
    view.webview.options = { enableScripts: true, retainContextWhenHidden: true };

    // Set HTML immediately — prevents VS Code's "no data provider" placeholder
    view.webview.html = buildSidebarCustomThemesHtml([], null);

    view.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'apply':
          await vscode.workspace.getConfiguration('workbench').update(
            'colorTheme', message.label, vscode.ConfigurationTarget.Global
          );
          paletteViewProvider?.refresh();
          this.refresh();
          break;
        case 'delete':
          await cmdDeleteCustomTheme(this.context, message.label);
          break;
        case 'export':
          await cmdExportCustomTheme(this.context, message.label);
          break;
        case 'generate':
          await cmdGenerateTheme(this.context);
          break;
      }
    });

    this._render();
  }

  _render() {
    if (!this.view?.webview) return;
    const customs     = getCustomThemes(this.context);
    const activeLabel = getActiveThemeLabel();
    this.view.webview.html = buildSidebarCustomThemesHtml(customs, activeLabel);
  }

  refresh() {
    this._render();
  }
}

// ─── Palette sidebar — self-contained HTML builder ────────────────────────────
//
// Builds the color-tile grid directly in JS so the sidebar view never depends
// on buildPaletteInspectorHtml from themeWebviews.js.  Every key-value pair
// from the theme's `colors` map becomes a clickable swatch tile.

const PALETTE_GROUPS = [
  { prefix: 'editor.background',       label: 'Editor BG'      },
  { prefix: 'editor.foreground',       label: 'Editor FG'      },
  { prefix: 'editor',                  label: 'Editor'         },
  { prefix: 'editorCursor',            label: 'Cursor'         },
  { prefix: 'editorLineNumber',        label: 'Line Numbers'   },
  { prefix: 'editorGutter',            label: 'Gutter'         },
  { prefix: 'editorGroup',             label: 'Editor Groups'  },
  { prefix: 'editorWidget',            label: 'Widgets'        },
  { prefix: 'editorSuggestWidget',     label: 'Suggest'        },
  { prefix: 'editorHoverWidget',       label: 'Hover'          },
  { prefix: 'editorError',             label: 'Errors'         },
  { prefix: 'editorWarning',           label: 'Warnings'       },
  { prefix: 'editorInfo',              label: 'Info'           },
  { prefix: 'editorIndentGuide',       label: 'Indent Guides'  },
  { prefix: 'editorBracketMatch',      label: 'Bracket Match'  },
  { prefix: 'editorOverviewRuler',     label: 'Overview Ruler' },
  { prefix: 'tab',                     label: 'Tabs'           },
  { prefix: 'titleBar',                label: 'Title Bar'      },
  { prefix: 'statusBar',               label: 'Status Bar'     },
  { prefix: 'activityBar',             label: 'Activity Bar'   },
  { prefix: 'sideBar',                 label: 'Side Bar'       },
  { prefix: 'panel',                   label: 'Panel'          },
  { prefix: 'terminal',                label: 'Terminal'       },
  { prefix: 'button',                  label: 'Buttons'        },
  { prefix: 'input',                   label: 'Inputs'         },
  { prefix: 'list',                    label: 'Lists'          },
  { prefix: 'dropdown',                label: 'Dropdowns'      },
  { prefix: 'focusBorder',             label: 'Focus'          },
  { prefix: 'selection',               label: 'Selection'      },
  { prefix: 'textLink',                label: 'Links'          },
  { prefix: 'badge',                   label: 'Badges'         },
  { prefix: 'progressBar',             label: 'Progress'       },
  { prefix: 'scrollbar',               label: 'Scrollbar'      },
  { prefix: 'scrollbarSlider',         label: 'Scrollbar Slider'},
  { prefix: 'minimap',                 label: 'Minimap'        },
  { prefix: 'gitDecoration',           label: 'Git'            },
  { prefix: 'notifications',           label: 'Notifications'  },
  { prefix: 'notificationCenter',      label: 'Notification Center' },
  { prefix: 'pickerGroup',             label: 'Picker'         },
  { prefix: 'quickInput',              label: 'Quick Input'    },
  { prefix: 'menu',                    label: 'Menus'          },
  { prefix: 'breadcrumb',              label: 'Breadcrumbs'    },
  { prefix: 'settings',                label: 'Settings'       },
  { prefix: 'debugToolBar',            label: 'Debug Toolbar'  },
  { prefix: 'debugConsole',            label: 'Debug Console'  },
  { prefix: 'peekView',                label: 'Peek View'      },
  { prefix: 'merge',                   label: 'Merge'          },
  { prefix: 'charts',                  label: 'Charts'         },
  { prefix: 'toolbar',                 label: 'Toolbar'        },
];

/**
 * Group a flat { key: hex } colors map into labeled buckets.
 * Each color ends up in exactly one bucket (longest matching prefix wins).
 * Anything unmatched goes into "Other".
 */
function groupColors(colors) {
  // Sort prefixes longest-first so specific keys beat general ones
  const sortedGroups = PALETTE_GROUPS.slice().sort(
    (a, b) => b.prefix.length - a.prefix.length
  );

  const buckets = new Map(); // label → [{key, value}]
  const used    = new Set();

  for (const { prefix, label } of sortedGroups) {
    const entries = Object.entries(colors).filter(
      ([k, v]) => !used.has(k) && k.startsWith(prefix) && v && typeof v === 'string'
    );
    if (!entries.length) continue;
    entries.forEach(([k]) => used.add(k));
    buckets.set(label, entries.map(([key, value]) => ({ key, value })));
  }

  // Anything left
  const other = Object.entries(colors).filter(([k, v]) => !used.has(k) && v && typeof v === 'string');
  if (other.length) {
    buckets.set('Other', other.map(([key, value]) => ({ key, value })));
  }

  return buckets;
}

/**
 * Returns true when the hex color (ignoring alpha) is "light enough"
 * that dark text should be used on top.
 */
function isLightColor(hex) {
  try {
    // Strip alpha channel characters (#RRGGBBAA → #RRGGBB)
    const clean = hex.slice(0, 7);
    const r = parseInt(clean.slice(1, 3), 16);
    const g = parseInt(clean.slice(3, 5), 16);
    const b = parseInt(clean.slice(5, 7), 16);
    // Perceived luminance
    return (0.299 * r + 0.587 * g + 0.114 * b) > 165;
  } catch (_) {
    return false;
  }
}

function buildSidebarPaletteHtml(themeLabel, colors) {
  const esc = s => String(s).replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]
  );

  // ── Empty / loading states ──────────────────────────────────────────────
  if (!colors || Object.keys(colors).length === 0) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
  body{margin:0;padding:20px 16px;font-family:var(--vscode-font-family);
       color:var(--vscode-foreground);background:transparent;font-size:12px;}
  .msg{opacity:.7;font-style:italic;}
</style></head><body>
<p class="msg">No color palette available for "<strong>${esc(themeLabel)}</strong>".<br>
Switch to a theme and the palette will refresh automatically.</p>
</body></html>`;
  }

  const buckets = groupColors(colors);
  const totalColors = Object.keys(colors).length;

  // ── Build tile sections ──────────────────────────────────────────────────
  let sections = '';
  for (const [groupLabel, entries] of buckets) {
    const tiles = entries.map(({ key, value }) => {
      // Normalise: strip alpha for the swatch bg, keep full value for label
      const swatchColor = value.length > 7 ? value.slice(0, 7) : value;
      const textColor   = isLightColor(swatchColor) ? '#1a1a1a' : '#f0f0f0';
      const shortName   = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\./g, ' › ');
      return `<div class="tile" title="${esc(key)}\n${esc(value)}"
                   data-value="${esc(value)}"
                   style="background:${esc(swatchColor)};color:${textColor};"
                   onclick="copy('${esc(value)}')">
        <span class="tile-hex">${esc(value.toUpperCase())}</span>
        <span class="tile-name">${esc(shortName)}</span>
      </div>`;
    }).join('');

    sections += `
      <section>
        <h3 class="group-label">${esc(groupLabel)} <span class="count">${entries.length}</span></h3>
        <div class="grid">${tiles}</div>
      </section>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{
    font-family:var(--vscode-font-family,system-ui,sans-serif);
    font-size:11px;
    color:var(--vscode-foreground);
    background:transparent;
    padding:0 0 24px;
    -webkit-font-smoothing:antialiased;
  }

  /* ── header ── */
  .header{
    position:sticky;top:0;z-index:10;
    background:var(--vscode-sideBar-background,#252526);
    border-bottom:1px solid var(--vscode-panel-border,#3c3c3c);
    padding:10px 12px 8px;
  }
  .header h2{
    font-size:12px;font-weight:600;
    color:var(--vscode-foreground);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  }
  .header .meta{
    font-size:10px;opacity:.55;margin-top:2px;
  }

  /* ── search ── */
  .search-wrap{padding:8px 10px 4px;}
  .search-wrap input{
    width:100%;
    padding:5px 8px;
    font-size:11px;
    background:var(--vscode-input-background,#3c3c3c);
    color:var(--vscode-input-foreground,#ccc);
    border:1px solid var(--vscode-input-border,#555);
    border-radius:3px;
    outline:none;
  }
  .search-wrap input:focus{
    border-color:var(--vscode-focusBorder,#007acc);
  }

  /* ── sections ── */
  section{padding:6px 10px 2px;}
  .group-label{
    font-size:10px;font-weight:600;letter-spacing:.04em;
    text-transform:uppercase;
    color:var(--vscode-descriptionForeground,#888);
    margin:8px 0 5px;
    display:flex;align-items:center;gap:5px;
  }
  .count{
    font-weight:400;font-size:9px;
    opacity:.6;letter-spacing:0;text-transform:none;
  }

  /* ── tile grid ── */
  .grid{
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(72px,1fr));
    gap:5px;
    margin-bottom:4px;
  }
  .tile{
    border-radius:5px;
    padding:7px 5px 5px;
    cursor:pointer;
    display:flex;flex-direction:column;align-items:center;
    min-height:52px;
    border:1px solid rgba(255,255,255,.08);
    transition:transform .1s,box-shadow .1s;
    overflow:hidden;
    position:relative;
  }
  .tile:hover{
    transform:scale(1.06);
    box-shadow:0 3px 10px rgba(0,0,0,.45);
    z-index:1;
  }
  .tile:active{transform:scale(.97);}
  .tile-hex{
    font-size:9px;font-weight:700;
    letter-spacing:.03em;
    margin-bottom:3px;
    text-shadow:0 1px 2px rgba(0,0,0,.4);
  }
  .tile-name{
    font-size:8.5px;
    text-align:center;
    line-height:1.3;
    opacity:.85;
    word-break:break-all;
    display:-webkit-box;
    -webkit-line-clamp:2;
    -webkit-box-orient:vertical;
    overflow:hidden;
  }

  /* ── toast ── */
  #toast{
    position:fixed;bottom:14px;left:50%;transform:translateX(-50%) translateY(20px);
    background:var(--vscode-badge-background,#4d4d4d);
    color:var(--vscode-badge-foreground,#fff);
    padding:4px 12px;border-radius:20px;
    font-size:10px;pointer-events:none;
    opacity:0;transition:opacity .2s,transform .2s;
  }
  #toast.show{opacity:1;transform:translateX(-50%) translateY(0);}

  /* ── hidden by filter ── */
  .tile.hidden{display:none;}
  section.empty{display:none;}
</style>
</head>
<body>

<div class="header">
  <h2>${esc(themeLabel)}</h2>
  <div class="meta">${totalColors} colors</div>
</div>

<div class="search-wrap">
  <input id="search" type="text" placeholder="Filter by name or hex…" oninput="filterTiles(this.value)">
</div>

${sections}

<div id="toast">Copied!</div>

<script>
  const vscode = acquireVsCodeApi();

  function copy(value) {
    vscode.postMessage({ type: 'copy', value });
    showToast(value);
  }

  let toastTimer;
  function showToast(text) {
    const t = document.getElementById('toast');
    t.textContent = 'Copied ' + text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
  }

  function filterTiles(query) {
    const q = query.trim().toLowerCase();
    document.querySelectorAll('.tile').forEach(tile => {
      const match = !q
        || tile.title.toLowerCase().includes(q)
        || (tile.dataset.value || '').toLowerCase().includes(q);
      tile.classList.toggle('hidden', !match);
    });
    // Hide sections where all tiles are hidden
    document.querySelectorAll('section').forEach(sec => {
      const anyVisible = [...sec.querySelectorAll('.tile')].some(t => !t.classList.contains('hidden'));
      sec.classList.toggle('empty', !anyVisible);
    });
  }
</script>
</body>
</html>`;
}

// ─── Palette sidebar view provider ───────────────────────────────────────────

class PaletteViewProvider {
  constructor(context) {
    this.context = context;
    this.view    = null;
  }

  /**
   * VS Code calls this once when the user first expands the view.
   * It MUST set webview.html synchronously (or very quickly) — if we leave
   * it blank VS Code may display the "no data provider" placeholder instead.
   */
  resolveWebviewView(view) {
    this.view = view;

    view.webview.options = {
      enableScripts: true,
      // retainContextWhenHidden keeps the webview alive when the panel is
      // collapsed / another sidebar view is shown, so tiles don't reset.
      retainContextWhenHidden: true,
    };

    // Set HTML immediately (loading state) — this clears the VS Code placeholder
    view.webview.html = buildSidebarPaletteHtml(
      getActiveThemeLabel() || 'Active Theme', null
    );

    view.webview.onDidReceiveMessage(async message => {
      if (message.type === 'copy' && message.value) {
        await vscode.env.clipboard.writeText(message.value);
        vscode.window.showInformationMessage(`Copied ${message.value}`);
      }
    });

    // Populate tiles asynchronously without blocking resolveWebviewView
    this._load();
  }

  /** Internal: fetch theme colors and render tiles. */
  async _load() {
    const themeLabel = getActiveThemeLabel() || 'Active Theme';
    let theme = null;

    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        theme = await readAnyThemeJsonByLabel(this.context, themeLabel);
      } catch (err) {
        console.error('[ForestAsh] palette _load error:', err?.message || err);
      }
      if (theme?.colors && Object.keys(theme.colors).length > 0) break;
      // Short delay then retry (extensions may still be activating)
      await new Promise(r => setTimeout(r, 300));
    }

    if (!this.view?.webview) return; // view was disposed while we were waiting

    this.view.webview.html = buildSidebarPaletteHtml(
      themeLabel,
      theme?.colors || null
    );
  }

  /** Public: called externally when the theme changes. */
  async refresh() {
    if (!this.view?.webview) return;
    await this._load();
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

function studioThemeKey(label) {
  return `[${String(label || '').replace(/[\\"]/g, '')}]`;
}

async function applyStudioOverrides(context, label, colors, tokenColors = [], semanticTokenColors = {}, semanticHighlighting = true) {
  if (!label) throw new Error('Theme Studio requires a theme name.');
  const workbench = vscode.workspace.getConfiguration('workbench');
  const editor = vscode.workspace.getConfiguration('editor');
  const backup = context.globalState.get(STUDIO_BACKUP_KEY);
  if (!backup) {
    await context.globalState.update(STUDIO_BACKUP_KEY, {
      workbench: workbench.get('colorCustomizations') || {},
      token: editor.get('tokenColorCustomizations') || {},
      semantic: editor.get('semanticTokenColorCustomizations') || {},
      label,
    });
  }
  const key = studioThemeKey(label);
  const colorCustomizations = { ...(workbench.get('colorCustomizations') || {}) };
  colorCustomizations[key] = { ...(colorCustomizations[key] || {}), ...colors };
  const tokenCustomizations = { ...(editor.get('tokenColorCustomizations') || {}) };
  tokenCustomizations[key] = {
    ...(tokenCustomizations[key] || {}),
    textMateRules: tokenColors,
  };
  const semanticCustomizations = { ...(editor.get('semanticTokenColorCustomizations') || {}) };
  semanticCustomizations[key] = {
    ...(semanticCustomizations[key] || {}),
    enabled: semanticHighlighting,
    rules: semanticTokenColors,
  };
  await workbench.update('colorCustomizations', colorCustomizations, vscode.ConfigurationTarget.Global);
  await editor.update('tokenColorCustomizations', tokenCustomizations, vscode.ConfigurationTarget.Global);
  await editor.update('semanticTokenColorCustomizations', semanticCustomizations, vscode.ConfigurationTarget.Global);
  if (!studioStatusBarItem) {
    studioStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    studioStatusBarItem.command = 'forestAsh.themeStudio';
    context.subscriptions.push(studioStatusBarItem);
  }
  studioStatusBarItem.text = '$(paintcan) Theme Studio: live';
  studioStatusBarItem.tooltip = 'Theme Studio live overrides are active';
  studioStatusBarItem.show();
}

async function restoreStudioOverrides(context) {
  const backup = context.globalState.get(STUDIO_BACKUP_KEY);
  if (!backup) return false;
  const workbench = vscode.workspace.getConfiguration('workbench');
  const editor = vscode.workspace.getConfiguration('editor');
  await workbench.update('colorCustomizations', backup.workbench, vscode.ConfigurationTarget.Global);
  await editor.update('tokenColorCustomizations', backup.token, vscode.ConfigurationTarget.Global);
  await editor.update('semanticTokenColorCustomizations', backup.semantic, vscode.ConfigurationTarget.Global);
  await context.globalState.update(STUDIO_BACKUP_KEY, null);
  studioStatusBarItem?.hide();
  return true;
}

async function removeAllStudioOverrides(context) {
  const restored = await restoreStudioOverrides(context);
  if (!restored) {
    const workbench = vscode.workspace.getConfiguration('workbench');
    const editor = vscode.workspace.getConfiguration('editor');
    const keyPattern = key => Object.fromEntries(Object.entries(key || {}).filter(([name]) => !name.startsWith('[Forest Ash')));
    await workbench.update('colorCustomizations', keyPattern(workbench.get('colorCustomizations')), vscode.ConfigurationTarget.Global);
    await editor.update('tokenColorCustomizations', keyPattern(editor.get('tokenColorCustomizations')), vscode.ConfigurationTarget.Global);
    await editor.update('semanticTokenColorCustomizations', keyPattern(editor.get('semanticTokenColorCustomizations')), vscode.ConfigurationTarget.Global);
  }
  await context.globalState.update(STUDIO_AUTOSAVE_KEY, null);
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
  const dir = customThemesDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const config = vscode.workspace.getConfiguration('forestAsh');
  const configuredBaseColor = config.get('lastBaseColor', '#4a9eff');
  const configuredVariant = config.get('defaultVariant', 'dark');

  const colorInput = await vscode.window.showInputBox({
    title:       'Forest Ash Theme Generator - Step 1 of 3',
    prompt:      'Enter your base accent color as a hex value',
    placeHolder: '#4a9eff',
    value:       /^#[0-9A-Fa-f]{6}$/.test(configuredBaseColor) ? configuredBaseColor : '#4a9eff',
    validateInput(val) {
      if (!val) return null;
      if (!/^#[0-9A-Fa-f]{6}$/.test(val.trim()))
        return 'Must be a 6-digit hex color, e.g. #4a9eff';
      return null;
    },
  });
  if (!colorInput) return;
  const baseColor = colorInput.trim().toLowerCase();

  const variantItems = [
    { label: '$(moon) Dark',  description: 'Deep, low-glare', id: 'dark'  },
    { label: '$(sun) Light',  description: 'Paper-like',      id: 'light' },
  ];
  const variant = await vscode.window.showQuickPick(
    variantItems,
    {
      title: 'Forest Ash Theme Generator - Step 2 of 3',
      placeHolder: 'Choose a variant',
      canPickMany: false,
      activeItem: variantItems.find(item => item.id === configuredVariant) || variantItems[0],
    }
  );
  if (!variant) return;
  const isDark = variant.id === 'dark';

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

  const customs = getCustomThemes(context);
  if (label.length > 80) {
    vscode.window.showErrorMessage('Theme names must be 80 characters or fewer.');
    return;
  }
  if (customs.some(t => t.label.toLowerCase() === label.toLowerCase())) {
    vscode.window.showErrorMessage(
      `"${label}" already exists. Choose a different name.`
    );
    return;
  }

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
    await patchPackageJson(meta);
    await saveCustomMeta(context, meta);
    await config.update('lastBaseColor', baseColor, vscode.ConfigurationTarget.Global);
    customThemesProvider?.refresh();
  } catch (err) {
    vscode.window.showErrorMessage(
      `Saved theme file but could not register it: ${err.message}`
    );
    return;
  }

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
    await recordThemeUse(context, direct.label);
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
  await recordThemeUse(context, picked.label);
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
      description: t.description === 'vs-dark' ? '$(moon) Dark' : '$(sun) Light',
      detail:      THEME_MOODS[t.label] ? `$(quote) ${THEME_MOODS[t.label]}` : 'Built-in',
    })),
    ...customs.map(t => ({
      label:       t.label,
      description: t.isDark ? '$(moon) Dark' : '$(sun) Light',
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
  await recordThemeUse(context, picked.label);
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
  focusUpdateTimer = setTimeout(() => updateFocusDecorations(context), 80);
}

async function applyFocusModeColors(context) {
  const theme = await readAnyThemeJsonByLabel(context, getActiveThemeLabel());
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
  const theme = await readAnyThemeJsonByLabel(context, getActiveThemeLabel());
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

  const theme = await readAnyThemeJsonByLabel(context, getActiveThemeLabel());
  if (!theme) {
    vscode.window.showWarningMessage('High Contrast Boost: could not read active theme.');
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

async function getStudioThemes(context) {
  const themes = [];
  for (const entry of STATIC_THEMES) {
    const themeJson = await readAnyThemeJsonByLabel(context, entry.label);
    if (!themeJson) continue;
    themes.push({
      label: entry.label,
      type: themeJson.type || (entry.description === 'vs-light' ? 'light' : 'dark'),
      colors: themeJson.colors,
      syntax: extractSyntaxColors(themeJson),
      tokenColors: themeJson.tokenColors || [],
      semanticTokenColors: themeJson.semanticTokenColors || {},
      semanticHighlighting: themeJson.semanticHighlighting !== false,
      mood: THEME_MOODS[entry.label],
      custom: false,
    });
  }
  for (const meta of getCustomThemes(context)) {
    try {
      const themeJson = JSON.parse(fs.readFileSync(themeFilePath(meta.fileName), 'utf8'));
      themes.push({
        label: meta.label,
        type: meta.isDark ? 'dark' : 'light',
        colors: themeJson.colors,
        syntax: extractSyntaxColors(themeJson),
        tokenColors: themeJson.tokenColors || [],
        semanticTokenColors: themeJson.semanticTokenColors || {},
        semanticHighlighting: themeJson.semanticHighlighting !== false,
        mood: `Custom palette from ${meta.baseColor}`,
        custom: true,
      });
    } catch (error) {
      console.error(`[ForestAsh] Could not load custom theme "${meta.label}":`, error.message);
    }
  }
  return themes;
}

async function saveStudioTheme(context, sourceLabel, overrides, suffix = 'Studio', document = {}) {
  const source = await readAnyThemeJsonByLabel(context, sourceLabel);
  if (!source) throw new Error(`Theme "${sourceLabel}" could not be loaded.`);
  const themeJson = JSON.parse(JSON.stringify(source));
  themeJson.colors = { ...(themeJson.colors || {}), ...overrides };
  if (Array.isArray(document.tokenColors)) themeJson.tokenColors = document.tokenColors;
  if (document.semanticTokenColors) themeJson.semanticTokenColors = document.semanticTokenColors;
  if (typeof document.semanticHighlighting === 'boolean') themeJson.semanticHighlighting = document.semanticHighlighting;
  const proposed = `${sourceLabel} ${suffix}`.slice(0, 80);
  const customs = getCustomThemes(context);
  const labelInput = await vscode.window.showInputBox({
    title: 'Save Theme Studio palette',
    prompt: 'Name for the new custom theme',
    value: proposed,
    validateInput: value => validateThemeName(value, [...customs, ...STATIC_THEMES]),
  });
  if (!labelInput) return null;
  const label = labelInput.trim();
  const validationError = validateThemeJson(themeJson);
  if (validationError) throw new Error(validationError);
  const timestamp = Date.now();
  const safeId = toKebab(label) || `theme-${timestamp}`;
  const fileName = `custom-studio-${timestamp}-${safeId}.json`;
  themeJson.name = label;
  themeJson.type = themeJson.type || 'dark';
  fs.mkdirSync(customThemesDir(), { recursive: true });
  fs.writeFileSync(themeFilePath(fileName), JSON.stringify(themeJson, null, 2), 'utf8');
  const meta = {
    label,
    baseColor: themeJson.colors['textLink.foreground'] || '#4a9eff',
    isDark: themeJson.type !== 'light',
    variant: themeJson.type === 'light' ? 'light' : 'dark',
    safeId,
    fileName,
    generatedAt: timestamp,
  };
  try {
    await patchPackageJson(meta);
    await saveCustomMeta(context, meta);
  } catch (error) {
    try { fs.unlinkSync(themeFilePath(fileName)); } catch (cleanupError) {
      console.error('[ForestAsh] Studio rollback failed:', cleanupError.message);
    }
    throw error;
  }
  customThemesProvider?.refresh();
  themePreviewProvider?.refresh();
  return meta;
}

async function cmdThemeStudio(context) {
  if (!themePreviewProvider) {
    vscode.window.showErrorMessage('Theme Studio is not available yet.');
    return;
  }
  await themePreviewProvider.showStudio();
}

async function cmdDiscardStudioChanges(context) {
  const restored = await restoreStudioOverrides(context);
  vscode.window.showInformationMessage(
    restored
      ? 'Theme Studio changes discarded.'
      : 'Theme Studio has no live overrides to discard.'
  );
}

async function cmdRemoveAllStudioOverrides(context) {
  await removeAllStudioOverrides(context);
  vscode.window.showInformationMessage('Theme Studio overrides removed.');
}

async function cmdImportPalette(context) {
  const picked = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { 'Palette files': ['json', 'css', 'scss', 'txt'] },
    openLabel: 'Import Palette',
  });
  if (!picked?.length) return;
  try {
    const text = Buffer.from(await vscode.workspace.fs.readFile(picked[0])).toString('utf8');
    const parsed = parsePaletteText(text);
    const error = validateThemeJson({ colors: parsed.colors, tokenColors: parsed.tokenColors || [] });
    if (error) throw new Error(error);
    const base = await readAnyThemeJsonByLabel(context, getActiveThemeLabel()) || { colors: {}, tokenColors: [] };
    const merged = { ...base, colors: { ...base.colors, ...parsed.colors }, tokenColors: parsed.tokenColors?.length ? parsed.tokenColors : base.tokenColors };
    const source = getActiveThemeLabel() || 'Forest Ash';
    const saved = await saveStudioTheme(context, source, merged.colors, 'Imported');
    if (saved) {
      vscode.window.showInformationMessage(`Imported "${saved.label}". Reload to add it to the native picker.`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Palette import failed: ${error.message}`);
  }
}

async function cmdAccessibilityReport(context) {
  const label = getActiveThemeLabel();
  const theme = await readAnyThemeJsonByLabel(context, label);
  if (!theme) {
    vscode.window.showErrorMessage('Could not read the active theme.');
    return;
  }
  const bg = theme.colors?.['editor.background'] || '#1e1e1e';
  const syntax = extractSyntaxColors(theme);
  const rows = [
    ['Editor text', theme.colors?.['editor.foreground'], bg],
    ['Comments', syntax.comment, bg],
    ['Keywords', syntax.keyword, bg],
    ['Strings', syntax.string, bg],
    ['Selection', theme.colors?.['editor.selectionBackground'], bg],
    ['Errors', theme.colors?.['editorError.foreground'], bg],
  ].filter(([, fg]) => fg).map(([name, fg, background]) =>
    `${name}: ${chroma.contrast(fg, background).toFixed(2)}:1`
  );
  vscode.window.showInformationMessage(`Accessibility · ${label}\n${rows.join(' · ')}`);
}

async function cmdToggleFavorite(context, label = getActiveThemeLabel()) {
  if (!label) return;
  const favorites = getFavorites(context);
  const next = favorites.includes(label)
    ? favorites.filter(item => item !== label)
    : [...favorites, label];
  await context.globalState.update(FAVORITES_STATE_KEY, next);
  vscode.window.showInformationMessage(`${next.includes(label) ? 'Added to' : 'Removed from'} favorites: ${label}`);
}

async function cmdBatchExportCustomThemes(context) {
  const customs = getCustomThemes(context);
  if (!customs.length) {
    vscode.window.showInformationMessage('No custom themes to export.');
    return;
  }
  const selected = await vscode.window.showQuickPick(customs.map(meta => ({
    label: meta.label, description: `${meta.isDark ? 'Dark' : 'Light'} · ${meta.baseColor}`, meta,
  })), { title: 'Select custom themes to export', canPickMany: true });
  if (!selected?.length) return;
  const toolPick = await vscode.window.showQuickPick(EXPORT_TARGETS.map(target => ({
    label: target.label, description: target.description, target,
  })), { title: 'Select export target' });
  if (!toolPick) return;
  const folder = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, canSelectMany: false, openLabel: 'Export themes here' });
  if (!folder?.length) return;
  let exported = 0;
  for (const item of selected) {
    try {
      const themeJson = JSON.parse(fs.readFileSync(themeFilePath(item.meta.fileName), 'utf8'));
      const palette = buildPalette(themeJson, item.meta);
      const fileName = `${toKebab(item.meta.label)}${toolPick.target.ext}`;
      await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(folder[0], fileName), Buffer.from(toolPick.target.export(palette), 'utf8'));
      exported += 1;
    } catch (error) {
      console.error(`[ForestAsh] Batch export failed for ${item.meta.label}:`, error.message);
    }
  }
  vscode.window.showInformationMessage(`Exported ${exported} of ${selected.length} custom themes.`);
}

async function cmdBackup(context) {
  const uri = await vscode.window.showSaveDialog({ filters: { 'Forest Ash backup': ['json'] }, defaultUri: vscode.Uri.file(path.join(os.homedir(), 'forest-ash-backup.json')) });
  if (!uri) return;
  const settingKeys = [
    'defaultVariant', 'lastBaseColor', 'showSwatchInStatusBar',
    'workspaceThemes.enabled', 'reducedGlare.enabled', 'themeStudio.defaultSampleLanguage',
    'focusMode.enabled', 'focusMode.dimOpacity', 'italicMode.enabled',
    'highContrast.enabled', 'languageAccents', 'circadian.enabled',
    'circadian.dayTheme', 'circadian.nightTheme', 'circadian.dayStart',
    'circadian.nightStart', 'circadian.timezone', 'circadian.checkIntervalMinutes',
    'themeOfWeek.enabled',
  ];
  const settings = Object.fromEntries(settingKeys.map(key => [
    key, vscode.workspace.getConfiguration('forestAsh').get(key),
  ]));
  const payload = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    themes: getCustomThemes(context).map(meta => ({
      meta,
      theme: fs.existsSync(themeFilePath(meta.fileName)) ? JSON.parse(fs.readFileSync(themeFilePath(meta.fileName), 'utf8')) : null,
    })).filter(item => item.theme),
    favorites: getFavorites(context),
    recent: context.globalState.get(RECENT_STATE_KEY, []),
    workspaceThemes: context.globalState.get(WORKSPACE_THEMES_KEY, {}),
    settings,
  };
  await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(payload, null, 2), 'utf8'));
  vscode.window.showInformationMessage(`Backed up ${payload.themes.length} custom themes.`);
}

async function cmdRestore(context) {
  const picked = await vscode.window.showOpenDialog({ canSelectMany: false, filters: { 'Forest Ash backup': ['json'] } });
  if (!picked?.length) return;
  try {
    const backup = JSON.parse(Buffer.from(await vscode.workspace.fs.readFile(picked[0])).toString('utf8'));
    if (backup.schemaVersion !== 1 || !Array.isArray(backup.themes)) throw new Error('Unsupported backup format.');
    for (const item of backup.themes) {
      const error = validateThemeJson(item.theme);
      if (error) throw new Error(`${item.meta?.label || 'Theme'}: ${error}`);
      const labelError = validateThemeName(item.meta?.label, getCustomThemes(context));
      if (labelError && !getCustomThemes(context).some(meta => meta.label === item.meta.label)) throw new Error(labelError);
      const fileName = item.meta.fileName || `custom-restore-${Date.now()}-${toKebab(item.meta.label)}.json`;
      fs.writeFileSync(themeFilePath(fileName), JSON.stringify({ ...item.theme, name: item.meta.label }, null, 2), 'utf8');
      await patchPackageJson({ ...item.meta, fileName });
      await saveCustomMeta(context, { ...item.meta, fileName });
    }
    await context.globalState.update(FAVORITES_STATE_KEY, Array.isArray(backup.favorites) ? backup.favorites : []);
    await context.globalState.update(RECENT_STATE_KEY, Array.isArray(backup.recent) ? backup.recent : []);
    await context.globalState.update(WORKSPACE_THEMES_KEY, backup.workspaceThemes || {});
    for (const [key, value] of Object.entries(backup.settings || {})) {
      await vscode.workspace.getConfiguration('forestAsh').update(key, value, vscode.ConfigurationTarget.Global);
    }
    customThemesProvider?.refresh();
    vscode.window.showInformationMessage(`Restored ${backup.themes.length} custom themes. Reload to update the native picker.`);
  } catch (error) {
    vscode.window.showErrorMessage(`Restore failed: ${error.message}`);
  }
}

function workspaceThemeKey() {
  return vscode.workspace.workspaceFile?.toString()
    || vscode.workspace.workspaceFolders?.map(folder => folder.uri.toString()).join('|')
    || 'untitled';
}

async function applyWorkspaceTheme(context) {
  const config = vscode.workspace.getConfiguration('forestAsh');
  if (!config.get('workspaceThemes.enabled', false)) return;
  const themes = context.globalState.get(WORKSPACE_THEMES_KEY, {});
  const target = themes[workspaceThemeKey()];
  if (!target || target === getActiveThemeLabel()) return;
  const exists = (await listThemeEntries(context)).some(entry => entry.label === target);
  if (exists) {
    await vscode.workspace.getConfiguration('workbench').update(
      'colorTheme', target, vscode.ConfigurationTarget.Workspace
    );
    await recordThemeUse(context, target);
  }
}

async function cmdSetWorkspaceTheme(context) {
  const active = getActiveThemeLabel();
  if (!active) return;
  const themes = context.globalState.get(WORKSPACE_THEMES_KEY, {});
  themes[workspaceThemeKey()] = active;
  await context.globalState.update(WORKSPACE_THEMES_KEY, themes);
  vscode.window.showInformationMessage(`Workspace theme set to "${active}".`);
}

// ─── Theme Preview ────────────────────────────────────────────────────────────

// ─── Theme Preview — sidebar webview ─────────────────────────────────────────

function buildSidebarPreviewHtml(cards, activeLabel) {
  const esc = s => String(s).replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]
  );

  if (!cards || cards.length === 0) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>body{margin:0;padding:20px 14px;font-family:var(--vscode-font-family);color:var(--vscode-foreground);background:transparent;font-size:12px;}.msg{opacity:.65;font-style:italic;}</style>
</head><body><p class="msg">Loading themes…</p></body></html>`;
  }

  // Split dark / light
  const darkCards  = cards.filter(c => c.typeLabel === 'Dark');
  const lightCards = cards.filter(c => c.typeLabel === 'Light');

  const renderCard = c => {
    const isActive = c.label === activeLabel;
    // 5-swatch strip from syntax colors
    const swatches = Object.values(c.syntax).slice(0, 5).map(col =>
      `<span class="sw" style="background:${esc(col)}"></span>`
    ).join('');
    // Mini code preview lines
    const codeLine = (color, text, w) =>
      `<div class="cl"><span style="width:${w}%;background:${esc(color)};opacity:.85"></span></div>`;
    const lines = [
      codeLine(c.syntax.keyword || c.accent, 'kw', 32),
      codeLine(c.syntax.string  || c.accent, 'st', 55),
      codeLine(c.syntax.comment || c.fg,     'cm', 44),
      codeLine(c.syntax.func    || c.accent, 'fn', 38),
      codeLine(c.fg,                         'tx', 60),
    ].join('');

    return `<div class="card${isActive ? ' active' : ''}"
               data-label="${esc(c.label)}"
               style="--bg:${esc(c.bg)};--fg:${esc(c.fg)};--ac:${esc(c.accent)};"
               onclick="apply('${esc(c.label)}')">

      <!-- mini editor mockup -->
      <div class="preview" style="background:${esc(c.bg)}">
        <div class="titlebar" style="background:${esc(c.bg)};border-bottom:1px solid ${esc(c.accent)}22;">
          <span class="dot" style="background:#ff5f57"></span>
          <span class="dot" style="background:#febc2e"></span>
          <span class="dot" style="background:#28c840"></span>
          <span class="tab" style="color:${esc(c.fg)};border-bottom:2px solid ${esc(c.accent)};">
            ${esc(c.label.replace('Forest Ash ', ''))}
          </span>
        </div>
        <div class="code-area">
          <div class="gutter">
            ${[1,2,3,4,5].map(n => `<div class="ln" style="color:${esc(c.fg)}44">${n}</div>`).join('')}
          </div>
          <div class="lines">${lines}</div>
        </div>
        <div class="statusbar" style="background:${esc(c.accent)}cc;">
          <span style="color:${esc(c.bg)};font-size:8px;padding:0 6px;opacity:.9;">
            ${esc(c.typeLabel)}
          </span>
        </div>
      </div>

      <!-- card footer -->
      <div class="footer" style="background:${esc(c.bg)}ee;">
        <div class="name" style="color:${esc(c.fg)};">${esc(c.label.replace('Forest Ash ', ''))}</div>
        <div class="swatches">${swatches}</div>
        ${isActive
          ? `<div class="badge active-badge" style="background:${esc(c.accent)}33;color:${esc(c.accent)};">● Active</div>`
          : `<button class="apply-btn" style="background:${esc(c.accent)};color:${esc(c.bg)};" onclick="event.stopPropagation();apply('${esc(c.label)}')">Apply</button>`
        }
      </div>
    </div>`;
  };

  const section = (title, cardList) => cardList.length === 0 ? '' : `
    <div class="section-head">${esc(title)} <span class="sect-count">${cardList.length}</span></div>
    <div class="grid">${cardList.map(renderCard).join('')}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{
    font-family:var(--vscode-font-family,system-ui,sans-serif);
    font-size:11px;
    color:var(--vscode-foreground);
    background:transparent;
    padding-bottom:24px;
    -webkit-font-smoothing:antialiased;
  }

  /* ── sticky header ── */
  .header{
    position:sticky;top:0;z-index:20;
    background:var(--vscode-sideBar-background,#252526);
    border-bottom:1px solid var(--vscode-panel-border,#3c3c3c);
    padding:10px 12px 8px;
  }
  .header h2{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .header .meta{font-size:10px;opacity:.5;margin-top:2px;}

  /* ── search ── */
  .search-wrap{padding:8px 10px 2px;}
  .search-wrap input{
    width:100%;padding:5px 8px;font-size:11px;
    background:var(--vscode-input-background,#3c3c3c);
    color:var(--vscode-input-foreground,#ccc);
    border:1px solid var(--vscode-input-border,#555);
    border-radius:3px;outline:none;
  }
  .search-wrap input:focus{border-color:var(--vscode-focusBorder,#007acc);}

  /* ── section heading ── */
  .section-head{
    font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
    color:var(--vscode-descriptionForeground,#888);
    padding:10px 12px 5px;
    display:flex;align-items:center;gap:5px;
  }
  .sect-count{font-weight:400;font-size:9px;opacity:.6;letter-spacing:0;text-transform:none;}

  /* ── grid ── */
  .grid{
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(130px,1fr));
    gap:8px;
    padding:0 10px 4px;
  }

  /* ── card ── */
  .card{
    border-radius:8px;
    overflow:hidden;
    cursor:pointer;
    border:1.5px solid var(--vscode-panel-border,#3c3c3c);
    transition:transform .15s,box-shadow .15s,border-color .15s;
    background:var(--vscode-sideBar-background);
  }
  .card:hover{
    transform:translateY(-3px);
    box-shadow:0 6px 18px rgba(0,0,0,.5);
    border-color:var(--bg, #555);
  }
  .card.active{
    border-color:var(--ac,#007acc);
    box-shadow:0 0 0 1px var(--ac,#007acc);
  }
  .card.hidden{display:none;}

  /* ── mini editor mockup ── */
  .preview{
    height:88px;
    display:flex;flex-direction:column;
    overflow:hidden;
  }
  .titlebar{
    display:flex;align-items:center;gap:4px;
    padding:4px 6px;flex-shrink:0;
  }
  .dot{width:7px;height:7px;border-radius:50%;}
  .tab{
    font-size:8px;padding:0 5px 2px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    max-width:80px;
    opacity:.85;
  }
  .code-area{
    display:flex;flex:1;overflow:hidden;padding:3px 0 2px;
  }
  .gutter{
    display:flex;flex-direction:column;gap:2px;
    padding:0 5px;flex-shrink:0;
  }
  .ln{font-size:7px;line-height:1;font-variant-numeric:tabular-nums;}
  .lines{flex:1;display:flex;flex-direction:column;gap:3px;padding:0 4px;}
  .cl{height:7px;border-radius:2px;overflow:hidden;}
  .cl span{display:block;height:100%;border-radius:2px;}
  .statusbar{height:10px;flex-shrink:0;display:flex;align-items:center;}

  /* ── card footer ── */
  .footer{
    padding:6px 8px 7px;
    display:flex;flex-direction:column;gap:4px;
    border-top:1px solid rgba(255,255,255,.07);
  }
  .name{
    font-size:10px;font-weight:600;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    opacity:.9;
  }
  .swatches{display:flex;gap:3px;}
  .sw{
    flex:1;height:5px;border-radius:2px;
    min-width:0;
  }
  .apply-btn{
    width:100%;margin-top:1px;
    padding:4px 0;border:none;border-radius:4px;
    font-size:10px;font-weight:600;cursor:pointer;
    transition:opacity .15s;
  }
  .apply-btn:hover{opacity:.85;}
  .active-badge{
    width:100%;margin-top:1px;
    padding:3px 0;border-radius:4px;
    font-size:10px;font-weight:600;
    text-align:center;
  }

  /* ── toast ── */
  #toast{
    position:fixed;bottom:12px;left:50%;transform:translateX(-50%) translateY(12px);
    background:var(--vscode-badge-background,#4d4d4d);
    color:var(--vscode-badge-foreground,#fff);
    padding:4px 14px;border-radius:20px;
    font-size:10px;pointer-events:none;
    opacity:0;transition:opacity .2s,transform .2s;z-index:99;
  }
  #toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
</style>
</head>
<body>

<div class="header">
  <h2>🎨 Theme Preview</h2>
  <div class="meta">${cards.length} themes</div>
</div>

<div class="search-wrap">
  <input id="q" type="text" placeholder="Search themes…" oninput="filter(this.value)">
</div>

${section('Dark', darkCards)}
${section('Light', lightCards)}

<div id="toast"></div>

<script>
  const vscode = acquireVsCodeApi();

  function apply(label) {
    vscode.postMessage({ type: 'applyTheme', label });
    showToast('Applied: ' + label.replace('Forest Ash ', ''));
  }

  let toastTimer;
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  function filter(q) {
    const lq = q.trim().toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
      const match = !lq || card.dataset.label.toLowerCase().includes(lq);
      card.classList.toggle('hidden', !match);
    });
  }
</script>
</body>
</html>`;
}

class ThemePreviewProvider {
  constructor(context) {
    this.context = context;
    this.view    = null;
    this.studioPanel = null;
    this.studioWebview = null;
    this.studioHistory = [];
    this.studioRedo = [];
    this.studioDocument = null;
  }

  resolveWebviewView(view) {
    this.view = view;
    view.webview.options = { enableScripts: true, retainContextWhenHidden: true };

    // Immediate placeholder
    view.webview.html = buildSidebarPreviewHtml([], null);

    view.webview.onDidReceiveMessage(message => this._handleStudioMessage(message));
    this._load();
  }

  async _handleStudioMessage(message) {
      if ((message.type === 'applyTheme' || message.type === 'apply') && message.label) {
        await vscode.workspace.getConfiguration('workbench').update(
          'colorTheme', message.label, vscode.ConfigurationTarget.Global
        );
        await recordThemeUse(this.context, message.label);
        paletteViewProvider?.refresh();
      } else if (message.type === 'copy' && message.value) {
        await vscode.env.clipboard.writeText(message.value);
      } else if (message.type === 'generate') {
        await cmdGenerateTheme(this.context);
        await this._load();
      } else if (message.type === 'dismiss') {
        await this._load();
      } else if (message.type === 'save' && message.source && message.colors) {
        try {
          await saveStudioTheme(this.context, message.source, message.colors, 'Studio', message);
          await this.showStudio();
        } catch (error) {
          vscode.window.showErrorMessage(`Could not save Studio theme: ${error.message}`);
        }
      } else if (message.type === 'setState' && message.source && message.colors) {
        const next = {
          source: message.source,
          colors: { ...message.colors },
          tokenColors: Array.isArray(message.tokenColors) ? message.tokenColors : [],
          semanticTokenColors: { ...(message.semanticTokenColors || {}) },
          semanticHighlighting: message.semanticHighlighting !== false,
        };
        const previous = this.studioDocument;
        if (previous && JSON.stringify(previous) !== JSON.stringify(next)) {
          this.studioHistory.push(previous);
          if (this.studioHistory.length > 200) this.studioHistory.shift();
          this.studioRedo = [];
        }
        this.studioDocument = next;
        try {
          await applyStudioOverrides(
            this.context,
            next.source,
            next.colors,
            next.tokenColors,
            next.semanticTokenColors,
            next.semanticHighlighting
          );
          await this.context.globalState.update(STUDIO_AUTOSAVE_KEY, next);
        } catch (error) {
          vscode.window.showErrorMessage(`Theme Studio live update failed: ${error.message}`);
        }
      } else if (message.type === 'undo' || message.type === 'redo') {
        const source = message.type === 'undo' ? this.studioHistory : this.studioRedo;
        const target = source.pop();
        if (target && this.studioDocument) {
          (message.type === 'undo' ? this.studioRedo : this.studioHistory).push(this.studioDocument);
          this.studioDocument = target;
          await applyStudioOverrides(this.context, target.source, target.colors, target.tokenColors, target.semanticTokenColors, target.semanticHighlighting);
          this.studioWebview?.postMessage({ type: 'studioState', ...target });
        }
      } else if (message.type === 'discard') {
        await cmdDiscardStudioChanges(this.context);
        this.studioDocument = null;
        this.studioHistory = [];
        this.studioRedo = [];
      } else if (message.type === 'panic') {
        await cmdRemoveAllStudioOverrides(this.context);
        this.studioDocument = null;
        this.studioHistory = [];
        this.studioRedo = [];
      } else if (message.type === 'favorite' && message.label) {
        await cmdToggleFavorite(this.context, message.label);
      } else if (message.type === 'preset' && message.source && message.preset) {
        try {
          const source = await readAnyThemeJsonByLabel(this.context, message.source);
          const transformed = applyPreset({ ...source, colors: { ...source.colors, ...message.colors } }, message.preset);
          await saveStudioTheme(this.context, message.source, transformed.colors, message.preset);
          await this.showStudio();
        } catch (error) {
          vscode.window.showErrorMessage(`Preset failed: ${error.message}`);
        }
      } else if (message.type === 'simulation' && message.source && message.mode) {
        try {
          const source = await readAnyThemeJsonByLabel(this.context, message.source);
          const transformed = transformThemeForSimulation({ ...source, colors: { ...source.colors, ...message.colors } }, message.mode);
          await saveStudioTheme(this.context, message.source, transformed.colors, message.mode);
          await this.showStudio();
        } catch (error) {
          vscode.window.showErrorMessage(`Color simulation failed: ${error.message}`);
        }
      } else if (message.type === 'reduced-glare' && message.source) {
        try {
          const source = await readAnyThemeJsonByLabel(this.context, message.source);
          const colors = Object.fromEntries(Object.entries({ ...source.colors, ...message.colors }).map(([key, value]) => {
            try { return [key, chroma(value).set('hsl.s', '*0.65').hex()]; } catch (_) { return [key, value]; }
          }));
          await saveStudioTheme(this.context, message.source, colors, 'Reduced Glare');
          await this.showStudio();
        } catch (error) {
          vscode.window.showErrorMessage(`Reduced-glare mode failed: ${error.message}`);
        }
      } else if (message.type === 'accessibility') {
        await cmdAccessibilityReport(this.context);
      }
  }

  async _load() {
    const activeLabel = getActiveThemeLabel();
    const cards = [];

    for (const theme of STATIC_THEMES) {
      try {
        const themeJson = await readAnyThemeJsonByLabel(this.context, theme.label);
        if (!themeJson) continue;
        const colors = themeJson.colors || {};
        const bg     = colors['editor.background'] || (themeJson.type === 'light' ? '#f5f5f5' : '#1e1e1e');
        const fg     = colors['editor.foreground'] || (themeJson.type === 'light' ? '#333' : '#ccc');
        const accent = colors['textLink.foreground'] || colors['editorCursor.foreground'] || fg;
        const syntax = extractSyntaxColors(themeJson);
        cards.push({ label: theme.label, bg, fg, accent, syntax, typeLabel: themeJson.type === 'light' ? 'Light' : 'Dark' });
      } catch (_) {}
    }

    if (!this.view?.webview) return;
    this.view.webview.html = buildSidebarPreviewHtml(cards, activeLabel);
  }

  async showStudio() {
    if (!this.studioPanel) {
      this.studioPanel = vscode.window.createWebviewPanel(
        'forestAsh.themeStudio',
        'Forest Ash Theme Studio',
        vscode.ViewColumn.Beside,
        { enableScripts: true, retainContextWhenHidden: true }
      );
      this.studioWebview = this.studioPanel.webview;
      this.studioPanel.onDidDispose(() => {
        this.studioPanel = null;
        this.studioWebview = null;
      }, null, []);
      this.studioWebview.onDidReceiveMessage(message => this._handleStudioMessage(message));
    }

    const themes = await getStudioThemes(this.context);
    this.studioPanel.webview.html = buildThemeStudioHtml(
      themes,
      getFavorites(this.context),
      this.context.globalState.get(RECENT_STATE_KEY, [])
    );
    return true;
  }

  async refresh() {
    if (!this.view?.webview) return;
    await this._load();
  }

  showThemeOfWeek(theme) {
    if (!this.view?.webview) return false;
    this.view.webview.html = buildThemeOfWeekHtml(theme);
    return true;
  }
}

async function cmdPreviewThemes() {
  if (!themePreviewProvider) {
    vscode.window.showInformationMessage('Theme preview is not available yet.');
    return;
  }

  // Reveal the sidebar view — collapse palette, expand preview
  try {
    await vscode.commands.executeCommand('forestAsh.themePreviewView.focus');
  } catch (_) {
    try {
      if (themePreviewProvider.view?.show) themePreviewProvider.view.show(true);
    } catch (_) {}
  }

  await themePreviewProvider.refresh();
}

// ─── Palette Inspector — sidebar only, never opens a new tab ─────────────────

async function cmdShowPaletteInspector() {
  if (!paletteViewProvider) {
    vscode.window.showInformationMessage('Palette inspector is not available yet.');
    return;
  }
  // Focus palette view — VS Code automatically collapses other views in the same container
  try {
    await vscode.commands.executeCommand('forestAsh.paletteView.focus');
  } catch (_) {
    try { if (paletteViewProvider.view?.show) paletteViewProvider.view.show(true); } catch (_) {}
  }
  await paletteViewProvider.refresh();
}

async function cmdExportPaletteCss(context) {
  const themeLabel = getActiveThemeLabel();
  const theme = await readAnyThemeJsonByLabel(context, themeLabel);
  if (!theme?.colors) {
    vscode.window.showInformationMessage('Could not read palette for the active theme.');
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

  const customs = getCustomThemes(context);
  const candidates = [
    ...STATIC_THEMES.map(theme => ({ label: theme.label, meta: null })),
    ...customs.map(meta => ({ label: meta.label, meta })),
  ];
  const choices = candidates.filter(candidate => candidate.label !== state.lastTheme);
  const selected = choices[Math.floor(Math.random() * choices.length)] || candidates[0];
  const label = selected.label;
  const mood = THEME_MOODS[label] ||
    (selected.meta
      ? `A custom Forest Ash palette built from ${selected.meta.baseColor}.`
      : 'Forest Ash spotlight.');

  await context.globalState.update(THEME_OF_WEEK_STATE_KEY, {
    lastShown: now,
    lastTheme: label,
  });

  let themeJson = null;
  try {
    themeJson = selected.meta
      ? JSON.parse(fs.readFileSync(themeFilePath(selected.meta.fileName), 'utf8'))
      : await readAnyThemeJsonByLabel(context, label);
  } catch (_) {}

  const colors = themeJson?.colors || {};
  const syntax = themeJson ? extractSyntaxColors(themeJson) : {};
  let type = themeJson?.type;
  if (!type && colors['editor.background']) {
    type = isLightColor(colors['editor.background']) ? 'light' : 'dark';
  }

  const theme = {
    label,
    mood,
    colors,
    syntax,
    type,
    isCustom: Boolean(selected.meta),
  };

  showThemeOfWeekPanel(context, theme);
}

function showThemeOfWeekPanel(context, theme) {
  if (themeOfWeekPanel) {
    themeOfWeekPanel.reveal(vscode.ViewColumn.Active, false);
  } else {
    themeOfWeekPanel = vscode.window.createWebviewPanel(
      'forestAsh.themeOfWeek',
      'Forest Ash · Theme of the Week',
      { viewColumn: vscode.ViewColumn.Active, preserveFocus: false },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableFindWidget: false,
      }
    );
    themeOfWeekPanel.onDidDispose(() => {
      themeOfWeekPanel = null;
    }, null, context.subscriptions);
    themeOfWeekPanel.webview.onDidReceiveMessage(async message => {
      try {
        if (message.type === 'applyTheme' && message.label) {
          await vscode.workspace.getConfiguration('workbench').update(
            'colorTheme', message.label, vscode.ConfigurationTarget.Global
          );
          await recordThemeUse(context, message.label);
          themeOfWeekPanel?.webview.postMessage({ type: 'toast', message: `Applied: ${message.label}` });
        } else if (message.type === 'generate') {
          await cmdGenerateTheme(context);
        } else if (message.type === 'copy' && message.value) {
          await vscode.env.clipboard.writeText(message.value);
          themeOfWeekPanel?.webview.postMessage({ type: 'toast', message: 'Copied color to clipboard' });
        } else if (message.type === 'dismiss') {
          themeOfWeekPanel?.dispose();
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Theme of the Week failed: ${error.message}`);
      }
    }, null, context.subscriptions);
  }
  themeOfWeekPanel.webview.html = buildThemeOfWeekHtml(theme);
  themeOfWeekPanel.reveal(vscode.ViewColumn.Active, false);
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

  const validationError = validateThemeJson(themeJson);
  if (validationError) {
    vscode.window.showErrorMessage(`Invalid theme JSON: ${validationError}`);
    return;
  }

  const proposedName = themeJson.name || 'Forest Ash Custom';
  const existingThemes = [...getCustomThemes(context), ...STATIC_THEMES];
  const label = await vscode.window.showInputBox({
    title: 'Import Custom Theme',
    prompt: 'Theme name',
    value: proposedName,
    validateInput: value => validateThemeName(value, existingThemes),
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

  try {
    await patchPackageJson(meta);
    await saveCustomMeta(context, meta);
  } catch (error) {
    try { fs.unlinkSync(absPath); } catch (cleanupError) {
      console.error('[ForestAsh] Import rollback failed:', cleanupError.message);
    }
    vscode.window.showErrorMessage(`Could not register imported theme: ${error.message}`);
    return;
  }
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

// ─── Status Bar Item ──────────────────────────────────────────────────────────

function createOrUpdateStatusBar(context) {
  const config = vscode.workspace.getConfiguration('forestAsh');
  const show = config.get('showSwatchInStatusBar', true);

  if (!show) {
    statusBarItem?.hide();
    return;
  }

  if (!statusBarItem) {
    statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      99
    );
    statusBarItem.command = 'forestAsh.quickThemePicker';
    context.subscriptions.push(statusBarItem);
  }

  const label = getActiveThemeLabel() || '';
  const isForestAsh = label.toLowerCase().includes('forest ash');

  if (!isForestAsh) {
    statusBarItem.hide();
    return;
  }

  const shortName = label.replace(/^Forest Ash\s*/i, '') || 'Default';
  statusBarItem.text = `$(symbol-color) ${shortName}`;
  statusBarItem.tooltip = `Forest Ash: ${label}\nClick to switch themes`;
  statusBarItem.show();
}

// ─── Export Theme for External Tool ──────────────────────────────────────────

async function cmdExportForTool(context) {
  const activeLabel = getActiveThemeLabel();
  const themeJson = await readAnyThemeJsonByLabel(context, activeLabel);

  if (!themeJson?.colors) {
    vscode.window.showWarningMessage(
      'Could not read the active theme palette. Switch to a Forest Ash theme first, or use any theme — colors will be derived from the available data.'
    );
    return;
  }

  // Let user also pick a custom theme as source
  const customs = getCustomThemes(context);
  const sourceItems = [
    { label: `$(symbol-color) Active theme: ${activeLabel}`, id: 'active', themeJson, meta: null },
    ...customs.map(t => ({
      label: `$(star-full) ${t.label}`,
      description: `Custom · ${t.isDark ? 'dark' : 'light'} · ${t.baseColor}`,
      id: 'custom',
      meta: t,
      themeJson: null,
    })),
  ];

  const sourcePick = sourceItems.length > 1
    ? await vscode.window.showQuickPick(sourceItems, {
        title: 'Forest Ash: Export for External Tool — Step 1 of 3',
        placeHolder: 'Choose which theme to export',
      })
    : sourceItems[0];

  if (!sourcePick) return;

  let sourceJson = sourcePick.themeJson;
  let sourceMeta = sourcePick.meta;
  if (!sourceJson && sourceMeta) {
    sourceJson = await readAnyThemeJsonByLabel(context, sourceMeta.label);
  }
  if (!sourceJson) {
    vscode.window.showErrorMessage('Could not load theme data.');
    return;
  }

  // Build normalised palette
  const palette = buildPalette(sourceJson, sourceMeta || { label: activeLabel, isDark: sourceJson.type !== 'light' });

  // Pick target tool
  const toolPick = await vscode.window.showQuickPick(
    EXPORT_TARGETS.map(t => ({
      label:       t.label,
      description: t.description,
      detail:      t.detail,
      target:      t,
    })),
    {
      title: 'Forest Ash: Export for External Tool — Step 2 of 3',
      placeHolder: 'Select the target editor or terminal',
      matchOnDescription: true,
    }
  );
  if (!toolPick) return;

  const target = toolPick.target;
  const content = target.export(palette);

  // Save file
  const safeName = palette.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const defaultName = `forest-ash-${safeName}${target.ext}`;
  const defaultUri = vscode.Uri.file(path.join(os.homedir(), defaultName));

  const saveUri = await vscode.window.showSaveDialog({
    defaultUri,
    filters: { [target.filterName]: [target.ext.replace('.', '')] },
    title: `Forest Ash: Export for ${target.id} — Step 3 of 3`,
  });
  if (!saveUri) return;

  await vscode.workspace.fs.writeFile(saveUri, Buffer.from(content, 'utf8'));

  const action = await vscode.window.showInformationMessage(
    `Exported ${defaultName}  ·  ${target.detail}`,
    'Reveal in Finder',
    'Copy Install Path'
  );
  if (action === 'Reveal in Finder') {
    await vscode.commands.executeCommand('revealFileInOS', saveUri);
  }
  if (action === 'Copy Install Path') {
    await vscode.env.clipboard.writeText(saveUri.fsPath);
    vscode.window.showInformationMessage('Path copied to clipboard.');
  }
}

// ─── Export All Themes for External Tool ─────────────────────────────────────

async function cmdExportAllThemes(context) {
  const toolPick = await vscode.window.showQuickPick(
    EXPORT_TARGETS.map(t => ({
      label:       t.label,
      description: t.description,
      detail:      t.detail,
      target:      t,
    })),
    {
      title:       'Forest Ash: Export All Themes for Tool — Step 1 of 2',
      placeHolder: 'Select the target editor or terminal',
      matchOnDescription: true,
    }
  );
  if (!toolPick) return;

  const target = toolPick.target;

  // Pick a destination directory
  const folderUris = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: 'Export All Themes Here',
    title: 'Forest Ash: Choose export folder — Step 2 of 2',
  });
  if (!folderUris?.length) return;

  const destDir = folderUris[0].fsPath;

  let exported = 0;
  let failed = 0;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Forest Ash: Exporting all themes for ${target.id}…`,
      cancellable: false,
    },
    async (progress) => {
      for (const theme of STATIC_THEMES) {
        try {
          const themeJson = await readAnyThemeJsonByLabel(context, theme.label);
          if (!themeJson) { failed++; continue; }
          const meta = {
            label: theme.label,
            isDark: theme.description === 'vs-dark',
          };
          const palette = buildPalette(themeJson, meta);
          const content = target.export(palette);
          const safeName = theme.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const fileName = `${safeName}${target.ext}`;
          fs.writeFileSync(path.join(destDir, fileName), content, 'utf8');
          exported++;
          progress.report({ message: `${theme.label}`, increment: 100 / STATIC_THEMES.length });
        } catch (err) {
          console.error(`[ForestAsh] exportAllThemes failed for ${theme.label}:`, err.message);
          failed++;
        }
      }
    }
  );

  const action = await vscode.window.showInformationMessage(
    `Exported ${exported} theme${exported !== 1 ? 's' : ''}${failed ? ` (${failed} failed)` : ''} to ${destDir}`,
    'Open Folder'
  );
  if (action === 'Open Folder') {
    await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(destDir));
  }
}

// ─── Rename Custom Theme ──────────────────────────────────────────────────────

async function cmdRenameCustomTheme(context) {
  const customs = getCustomThemes(context);
  if (!customs.length) {
    vscode.window.showInformationMessage('No custom themes to rename.');
    return;
  }

  const picked = await vscode.window.showQuickPick(
    customs.map(t => ({
      label:       t.label,
      description: `${t.isDark ? '$(moon) Dark' : '$(sun) Light'} · ${t.baseColor}`,
      meta:        t,
    })),
    { title: 'Forest Ash: Rename Custom Theme — Step 1 of 2', placeHolder: 'Choose a theme to rename' }
  );
  if (!picked) return;

  const newName = await vscode.window.showInputBox({
    title:   'Forest Ash: Rename Custom Theme — Step 2 of 2',
    prompt:  'Enter a new name',
    value:   picked.meta.label,
    validateInput(val) {
      if (!val?.trim()) return 'Name required';
      if (val.trim() === picked.meta.label) return 'Name is the same';
      if (customs.some(t => t.label === val.trim())) return 'A theme with this name already exists';
      return null;
    },
  });
  if (!newName) return;

  const oldMeta = picked.meta;
  const newMeta = { ...oldMeta, label: newName.trim() };

  // Update theme JSON name field
  const filePath = themeFilePath(oldMeta.fileName);
  if (fs.existsSync(filePath)) {
    try {
      const themeJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      themeJson.name = newName.trim();
      fs.writeFileSync(filePath, JSON.stringify(themeJson, null, 2), 'utf8');
    } catch (_) {}
  }

  // Update package.json
  unpatchPackageJson(oldMeta.label);
  await patchPackageJson(newMeta);

  // Update state
  const idx = customs.findIndex(t => t.label === oldMeta.label);
  if (idx > -1) customs.splice(idx, 1, newMeta);
  await context.globalState.update(CUSTOM_STATE_KEY, customs);
  customThemesProvider?.refresh();

  const action = await vscode.window.showInformationMessage(
    `Renamed to "${newMeta.label}". Reload to update the theme picker.`,
    'Reload Now', 'Later'
  );
  if (action === 'Reload Now') {
    await vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

// ─── Duplicate Custom Theme ───────────────────────────────────────────────────

async function cmdDuplicateCustomTheme(context) {
  const customs = getCustomThemes(context);
  if (!customs.length) {
    vscode.window.showInformationMessage('No custom themes to duplicate.');
    return;
  }

  const picked = await vscode.window.showQuickPick(
    customs.map(t => ({
      label:       t.label,
      description: `${t.isDark ? '$(moon) Dark' : '$(sun) Light'} · ${t.baseColor}`,
      meta:        t,
    })),
    { title: 'Forest Ash: Duplicate Custom Theme — Step 1 of 2', placeHolder: 'Choose a theme to duplicate' }
  );
  if (!picked) return;

  const srcMeta = picked.meta;
  const defaultName = `${srcMeta.label} Copy`;
  const newName = await vscode.window.showInputBox({
    title:   'Forest Ash: Duplicate Custom Theme — Step 2 of 2',
    prompt:  'Name for the new copy',
    value:   defaultName,
    validateInput(val) {
      if (!val?.trim()) return 'Name required';
      if (customs.some(t => t.label === val.trim())) return 'A theme with this name already exists';
      return null;
    },
  });
  if (!newName) return;

  const label    = newName.trim();
  const safeId   = toKebab(label);
  const timestamp = Date.now();
  const fileName  = `custom-${timestamp}-${safeId}.json`;
  const srcPath   = themeFilePath(srcMeta.fileName);
  const dstPath   = themeFilePath(fileName);

  if (!fs.existsSync(srcPath)) {
    vscode.window.showErrorMessage('Source theme file not found.');
    return;
  }

  // Copy and rename
  try {
    const themeJson = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
    themeJson.name = label;
    fs.writeFileSync(dstPath, JSON.stringify(themeJson, null, 2), 'utf8');
  } catch (err) {
    vscode.window.showErrorMessage(`Duplication failed: ${err.message}`);
    return;
  }

  const newMeta = { ...srcMeta, label, safeId, fileName, generatedAt: timestamp };
  patchPackageJson(newMeta);
  await saveCustomMeta(context, newMeta);
  customThemesProvider?.refresh();

  const action = await vscode.window.showInformationMessage(
    `Duplicated as "${label}". Reload to make it available in the theme picker.`,
    'Reload Now', 'Later'
  );
  if (action === 'Reload Now') {
    await vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

// ─── Random Theme ─────────────────────────────────────────────────────────────

async function cmdRandomTheme(context) {
  const customs  = getCustomThemes(context);
  const current  = getActiveThemeLabel();

  const all = [
    ...STATIC_THEMES.map(t => t.label),
    ...customs.map(t => t.label),
  ].filter(label => label !== current);

  if (!all.length) {
    vscode.window.showInformationMessage('Only one theme installed — nothing to switch to!');
    return;
  }

  const chosen = all[Math.floor(Math.random() * all.length)];
  await vscode.workspace.getConfiguration('workbench').update(
    'colorTheme', chosen, vscode.ConfigurationTarget.Global
  );
  await recordThemeUse(context, chosen);
  const mood = THEME_MOODS[chosen];
  vscode.window.showInformationMessage(
    mood ? `🎲 ${chosen} — ${mood}` : `🎲 Applied: ${chosen}`
  );
}

// ─── Export Palette as SCSS ────────────────────────────────────────────────────

async function cmdExportPaletteScss(context) {
  const themeLabel = getActiveThemeLabel();
  const theme = await readAnyThemeJsonByLabel(context, themeLabel);
  if (!theme?.colors) {
    vscode.window.showInformationMessage('Could not read palette for the active theme.');
    return;
  }

  const vars = Object.entries(theme.colors).map(([key, value]) => {
    const name = `$fa-${toKebab(key)}`;
    return `${name}: ${value};`;
  });

  const syntax = extractSyntaxColors(theme);
  Object.entries(syntax).forEach(([key, value]) => {
    vars.push(`$fa-syntax-${toKebab(key)}: ${value};`);
  });

  const scss = [
    `// Forest Ash Palette: ${themeLabel}`,
    `// Generated: ${new Date().toISOString().slice(0, 10)}`,
    `//`,
    `// Usage: @use 'forest-ash' as fa;`,
    `//        color: fa.$fa-editor-foreground;`,
    '',
    ...vars.sort(),
    '',
    `// CSS custom properties map`,
    ':root {',
    ...vars.sort().map(v => {
      const [decl] = v.split(': ');
      const cssVar = decl.replace(/^\$/, '--');
      return `  ${cssVar}: #{${decl}};`;
    }),
    '}',
    '',
  ].join('\n');

  const defaultName = `forest-ash-${toKebab(themeLabel)}.scss`;
  const defaultUri = vscode.Uri.file(path.join(os.homedir(), defaultName));
  const saveUri = await vscode.window.showSaveDialog({
    defaultUri,
    filters: { 'SCSS': ['scss'] },
  });

  if (!saveUri) return;
  await vscode.workspace.fs.writeFile(saveUri, Buffer.from(scss, 'utf8'));
  vscode.window.showInformationMessage(`Exported ${defaultName}`);
}

// ─── activate / deactivate ────────────────────────────────────────────────────

function activate(context) {
  const dir = customThemesDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Patch package.json so `forestAsh.paletteView` is declared as a webview view.
  // Without "type": "webview" VS Code treats it as a tree view and never calls
  // resolveWebviewView, showing "There is no data provider registered" instead.
  let paletteViewNeedsReload = false;
  try {
    paletteViewNeedsReload = ensurePaletteViewWebviewType();
  } catch (err) {
    console.error('[ForestAsh] ensurePaletteViewWebviewType failed:', err.message);
  }

  try {
    syncPackageJsonOnActivation(context);
  } catch (err) {
    console.error('[ForestAsh] syncPackageJson failed:', err.message);
  }

  // If we just patched the view type for the first time, ask for a reload so
  // VS Code picks up the new "type": "webview" declaration.
  if (paletteViewNeedsReload) {
    vscode.window.showInformationMessage(
      'Forest Ash: palette view updated — reload once to activate color tiles.',
      'Reload Now'
    ).then(action => {
      if (action === 'Reload Now') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    });
  }

  const focusOpacity = vscode.workspace.getConfiguration('forestAsh').get('focusMode.dimOpacity', 0.35);
  createFocusDecoration(focusOpacity);

  customThemesProvider  = new CustomThemesProvider(context);
  paletteViewProvider   = new PaletteViewProvider(context);
  themePreviewProvider  = new ThemePreviewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'forestAsh.customThemesView', customThemesProvider,
      { webviewOptions: { retainContextWhenHidden: true } }),
    vscode.window.registerWebviewViewProvider(
      'forestAsh.paletteView', paletteViewProvider,
      { webviewOptions: { retainContextWhenHidden: true } }),
    vscode.window.registerWebviewViewProvider(
      'forestAsh.themePreviewView', themePreviewProvider,
      { webviewOptions: { retainContextWhenHidden: true } }),
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => scheduleFocusUpdate(context)),
    vscode.window.onDidChangeTextEditorSelection(() => scheduleFocusUpdate(context)),
    vscode.workspace.onDidChangeTextDocument(() => scheduleFocusUpdate(context)),
    vscode.window.onDidChangeActiveColorTheme(() => {
      paletteViewProvider?.refresh();
      themePreviewProvider?.refresh();
      customThemesProvider?.refresh();   // updates active-badge on custom cards
    })
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
      'forestAsh.previewThemes', () => cmdPreviewThemes()),
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
    // ── v1.5.0 new commands ──
    vscode.commands.registerCommand(
      'forestAsh.exportForTool',        () => cmdExportForTool(context)),
    vscode.commands.registerCommand(
      'forestAsh.exportAllThemes',      () => cmdExportAllThemes(context)),
    vscode.commands.registerCommand(
      'forestAsh.renameCustomTheme',    () => cmdRenameCustomTheme(context)),
    vscode.commands.registerCommand(
      'forestAsh.duplicateCustomTheme', () => cmdDuplicateCustomTheme(context)),
    vscode.commands.registerCommand(
      'forestAsh.randomTheme',          () => cmdRandomTheme(context)),
    vscode.commands.registerCommand(
      'forestAsh.exportPaletteScss',    () => cmdExportPaletteScss(context)),
    vscode.commands.registerCommand(
      'forestAsh.themeStudio',          () => cmdThemeStudio(context)),
    vscode.commands.registerCommand(
      'forestAsh.themeStudioDiscard',   () => cmdDiscardStudioChanges(context)),
    vscode.commands.registerCommand(
      'forestAsh.themeStudioRemoveOverrides', () => cmdRemoveAllStudioOverrides(context)),
    vscode.commands.registerCommand(
      'forestAsh.importPalette',        () => cmdImportPalette(context)),
    vscode.commands.registerCommand(
      'forestAsh.batchExportCustomThemes', () => cmdBatchExportCustomThemes(context)),
    vscode.commands.registerCommand(
      'forestAsh.backup',               () => cmdBackup(context)),
    vscode.commands.registerCommand(
      'forestAsh.restore',              () => cmdRestore(context)),
    vscode.commands.registerCommand(
      'forestAsh.accessibilityReport',  () => cmdAccessibilityReport(context)),
    vscode.commands.registerCommand(
      'forestAsh.toggleFavorite',       () => cmdToggleFavorite(context)),
    vscode.commands.registerCommand(
      'forestAsh.setWorkspaceTheme',    () => cmdSetWorkspaceTheme(context)),
  );

  applyLanguageAccents(context).catch(() => undefined);

  // ── Status bar item (fixes missing implementation of showSwatchInStatusBar) ──
  createOrUpdateStatusBar(context);

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
  applyWorkspaceTheme(context).catch(error => {
    console.error('[ForestAsh] workspace theme apply failed:', error.message);
  });
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

      if (event.affectsConfiguration('forestAsh.showSwatchInStatusBar')) {
        createOrUpdateStatusBar(context);
      }

      if (event.affectsConfiguration('workbench.colorTheme')) {
        createOrUpdateStatusBar(context);
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
        themePreviewProvider?.refresh();
        customThemesProvider?.refresh();
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => applyWorkspaceTheme(context))
  );
}

function deactivate() {
  if (circadianTimer) clearInterval(circadianTimer);
  if (focusUpdateTimer) clearTimeout(focusUpdateTimer);
  if (focusDecoration) focusDecoration.dispose();
}

module.exports = { activate, deactivate };