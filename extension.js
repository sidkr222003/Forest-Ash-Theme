'use strict';

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { generateThemeJson } = require('./src/themeGenerator');

// ─── Constants ────────────────────────────────────────────────────────────────
const CUSTOM_STATE_KEY = 'forestAsh.customThemes';
const STATIC_THEMES = [
  {label: "Forest Ash", description: "vs-dark"},
  {label: "Forest Ash Yoru Paper", description: "vs-dark"},
  {label: "Forest Ash Sumi Moon", description: "vs-dark"},
  {label: "Forest Ash Kitsune Ink", description: "vs-dark"},
  {label: "Forest Ash Shoji Night", description: "vs-dark"},
  {label: "Forest Ash Aizome Dusk", description: "vs-dark"},
  {label: "Forest Ash Ronin Lantern", description: "vs-dark"},
  {label: "Forest Ash Bamboo Midnight", description: "vs-dark"},
  {label: "Forest Ash Nebula Manga", description: "vs-dark"},
  {label: "Forest Ash Sakura Charcoal", description: "vs-dark"},
  {label: "Forest Ash Kage Washi", description: "vs-dark"},
  {label: "Forest Ash Yoru Paper Light", description: "vs-light"},
  {label: "Forest Ash Sumi Moon Light", description: "vs-light"},
  {label: "Forest Ash Kitsune Ink Light", description: "vs-light"},
  {label: "Forest Ash Shoji Night Light", description: "vs-light"},
  {label: "Forest Ash Aizome Dusk Light", description: "vs-light"},
  {label: "Forest Ash Ronin Lantern Light", description: "vs-light"},
  {label: "Forest Ash Bamboo Midnight Light", description: "vs-light"},
  {label: "Forest Ash Nebula Manga Light", description: "vs-light"},
  {label: "Forest Ash Sakura Charcoal Light", description: "vs-light"},
  {label: "Forest Ash Kage Washi Light", description: "vs-light"},
];

// ─── Storage Helpers ─────────────────────────────────────────────────────────

function getCustomThemes(context) {
  return context.globalState.get(CUSTOM_STATE_KEY, []);
}

function saveCustomMeta(context, meta) {
  const customs = getCustomThemes(context);
  const index = customs.findIndex(t => t.label === meta.label);
  if (index > -1) customs.splice(index, 1);
  customs.push(meta);
  context.globalState.update(CUSTOM_STATE_KEY, customs);
}

function deleteCustomMeta(context, label) {
  const customs = getCustomThemes(context);
  const index = customs.findIndex(t => t.label === label);
  if (index > -1) {
    const meta = customs[index];
    const storagePath = path.join(context.globalStorageUri.fsPath, 'themes', meta.fileName);
    if (fs.existsSync(storagePath)) fs.unlinkSync(storagePath);
    customs.splice(index, 1);
    context.globalState.update(CUSTOM_STATE_KEY, customs);
    return true;
  }
  return false;
}

// ─── Commands ────────────────────────────────────────────────────────────────

async function cmdGenerateTheme(context) {
  const storagePath = context.globalStorageUri.fsPath;
  const themesStorage = path.join(storagePath, 'themes');
  if (!fs.existsSync(themesStorage)) fs.mkdirSync(themesStorage, { recursive: true });

  // Step 1: base colour
  const colorInput = await vscode.window.showInputBox({
    title: '🎨 Forest Ash Theme Generator — Step 1 of 3',
    prompt: 'Enter your base accent colour as a hex value',
    placeHolder: '#4a9eff',
    validateInput(val) {
      if (!val) return null;
      if (!/^#[0-9A-Fa-f]{6}$/.test(val.trim())) {
        return 'Must be a 6-digit hex colour, e.g. #4a9eff';
      }
      return null;
    },
  });
  if (!colorInput) return;

  const baseColor = colorInput.trim().toLowerCase();

  // Step 2: variant
  const variant = await vscode.window.showQuickPick([
    { label: '$(moon) Dark', description: 'Deep, low-glare', id: 'dark' },
    { label: '$(sun) Light', description: 'Paper-like', id: 'light' },
  ], { title: '🌗 Forest Ash Theme Generator — Step 2 of 3' });
  if (!variant) return;
  const isDark = variant.id === 'dark';

  // Step 3: name
  const defaultName = `Forest Ash Custom ${baseColor.toUpperCase()}${isDark ? '' : ' Light'}`;
  const themeName = await vscode.window.showInputBox({
    title: '✏️ Forest Ash Theme Generator — Step 3 of 3',
    prompt: 'Theme name (unique)',
    value: defaultName,
    validateInput(val) {
      if (!val?.trim()) return 'Name required';
      return null;
    },
  });
  if (!themeName) return;
  const label = themeName.trim();

  // Check duplicate in customs
  const customs = getCustomThemes(context);
  if (customs.some(t => t.label === label)) {
    vscode.window.showErrorMessage(`"${label}" already exists. Choose different name.`);
    return;
  }

  // Generate & save
  const safeId = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const timestamp = Date.now();
  const fileName = `custom-${timestamp}-${safeId}.json`;
  const absPath = path.join(themesStorage, fileName);

  let themeJson;
  try {
    themeJson = generateThemeJson(label, baseColor, isDark);
    fs.writeFileSync(absPath, JSON.stringify(themeJson, null, 2), 'utf8');
  } catch (err) {
    vscode.window.showErrorMessage(`Generation failed: ${err.message}`);
    return;
  }

  const meta = {
    label,
    baseColor,
    isDark,
    variant: isDark ? 'dark' : 'light',
    safeId,
    fileName,
    generatedAt: timestamp
  };
  saveCustomMeta(context, meta);

  // Offer apply
  const action = await vscode.window.showInformationMessage(
    `✅ "${label}" saved to user storage!`,
    'Apply Now', 'Later'
  );
  if (action === 'Apply Now') {
    await vscode.workspace.getConfiguration('workbench').update(
      'colorTheme', label, vscode.ConfigurationTarget.Global
    );
    vscode.window.showInformationMessage(`Applied: ${label}`);
  }
}

async function cmdApplyCustomTheme(context) {
  const customs = getCustomThemes(context);
  if (!customs.length) {
    vscode.window.showInformationMessage('No custom themes. Generate first.');
    return;
  }

  const picked = await vscode.window.showQuickPick(
    customs.map(t => ({
      label: t.label,
      description: `${t.variant === "dark" ? "🌙" : "☀️"} ${t.baseColor}`,
    })),
    { title: '🎨 Apply Custom Forest Ash Theme', placeHolder: 'Pick theme' }
  );
  if (picked) {
    await vscode.workspace.getConfiguration('workbench').update(
      'colorTheme', picked.label, vscode.ConfigurationTarget.Global
    );
    vscode.window.showInformationMessage(`Applied: ${picked.label}`);
  }
}

async function cmdDeleteCustomTheme(context) {
  const customs = getCustomThemes(context);
  if (!customs.length) {
    vscode.window.showInformationMessage('No custom themes to delete.');
    return;
  }

  const picked = await vscode.window.showQuickPick(
    customs.map(t => ({
      label: `🗑️ ${t.label}`,
      description: `${t.variant} · ${t.baseColor}`,
      themeData: t
    })),
    { title: 'Delete Custom Theme', placeHolder: 'Select to delete' }
  );
  if (!picked) return;

  const confirm = await vscode.window.showWarningMessage(
    `Delete "${picked.themeData.label}" permanently?`,
    { modal: true }, 'Delete'
  );
  if (confirm === 'Delete') {
    deleteCustomMeta(context, picked.themeData.label);
    vscode.window.showInformationMessage(`Deleted "${picked.themeData.label}"`);
  }
}

async function cmdListCustomThemes(context) {
  const customs = getCustomThemes(context);
  if (!customs.length) {
    vscode.window.showInformationMessage('No custom themes.');
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
      <td><span class="swatch" style="background:${t.baseColor}"></span></td>
      <td><strong>${escHtml(t.label)}</strong></td>
      <td>${t.variant === 'dark' ? '🌙 Dark' : '☀️ Light'}</td>
      <td><code>${escHtml(t.baseColor)}</code></td>
      <td>${new Date(t.generatedAt).toLocaleDateString()}</td>
    </tr>
  `).join('');

  panel.webview.html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>body{font-family:var(--vscode-font-family);padding:24px;}table{border-collapse:collapse;width:100%;}th,td{padding:8px;border-bottom:1px solid var(--vscode-panel-border);}th{text-align:left;}.swatch{display:inline-block;width:18px;height:18px;border-radius:50%;border:1px solid #888;vertical-align:middle;}code{font-family:var(--vscode-editor-font-family);}</style></head>
<body><h1>Custom Forest Ash Themes (${customs.length})</h1><table><thead><tr><th>Color</th><th>Name</th><th>Variant</th><th>Base</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function escHtml(str) {
  const html = String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '<', '>': '>', '"': '"', "'": '&#39;'
  })[m]);
  return html;
}

async function cmdForestAshQuickThemePicker(context) {
  const customs = getCustomThemes(context);
  const allThemes = [
    ...STATIC_THEMES.map(t => ({ ...t, isCustom: false })),
    ...customs.map(t => ({ ...t, description: t.variant, isCustom: true }))
  ];

  const picked = await vscode.window.showQuickPick(
    allThemes.map(t => ({
      label: t.label,
      description: t.description || t.variant,
      detail: t.isCustom ? '⭐ Custom' : 'Static'
    })),
    {
      title: '🎨 Quick Forest Ash Theme Picker (Right-click)',
      placeHolder: 'Select and apply theme'
    }
  );
  if (picked) {
    await vscode.workspace.getConfiguration('workbench').update(
      'colorTheme', picked.label, vscode.ConfigurationTarget.Global
    );
    vscode.window.showInformationMessage(`Switched to ${picked.label}`);
  }
}

// ─── activate ────────────────────────────────────────────────────────────────

function activate(context) {
  const storagePath = context.globalStorageUri.fsPath;
  const themesStorage = path.join(storagePath, 'themes');
  if (!fs.existsSync(themesStorage)) {
    fs.mkdirSync(themesStorage, { recursive: true });
  }

  // Register commands (pass context)
  context.subscriptions.push(
    vscode.commands.registerCommand('forestAsh.generateTheme', () => cmdGenerateTheme(context)),
    vscode.commands.registerCommand('forestAsh.applyCustomTheme', () => cmdApplyCustomTheme(context)),
    vscode.commands.registerCommand('forestAsh.deleteCustomTheme', () => cmdDeleteCustomTheme(context)),
    vscode.commands.registerCommand('forestAsh.listCustomThemes', () => cmdListCustomThemes(context)),
    vscode.commands.registerCommand('forestAsh.quickThemePicker', () => cmdForestAshQuickThemePicker(context))
  );
}

function deactivate() {}

module.exports = { activate, deactivate };

