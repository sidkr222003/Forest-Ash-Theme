'use strict';

const vscode = require('vscode');
const { STATIC_THEMES } = require('./themesList');

// ─── Desktop-only message helper ──────────────────────────────────────────────

function showDesktopOnly(featureName) {
  return vscode.window.showInformationMessage(
    `${featureName} is only available in the desktop version of VS Code.`
  );
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function cmdQuickThemePicker() {
  const items = STATIC_THEMES.map(t => ({
    label:       t.label,
    description: t.description,
    detail:      'Built-in',
  }));

  const picked = await vscode.window.showQuickPick(items, {
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

function cmdGenerateTheme() {
  return showDesktopOnly('Custom theme generation');
}

function cmdApplyCustomTheme() {
  return showDesktopOnly('Custom theme application');
}

function cmdDeleteCustomTheme() {
  return showDesktopOnly('Custom theme deletion');
}

function cmdListCustomThemes() {
  return showDesktopOnly('Custom theme list');
}

function cmdToggleFocusMode() {
  return showDesktopOnly('Focus Mode');
}

function cmdToggleItalicMode() {
  return showDesktopOnly('Italic Mode');
}

function cmdToggleHighContrast() {
  return showDesktopOnly('High Contrast Boost');
}

function cmdPreviewThemes() {
  return showDesktopOnly('Theme preview');
}

function cmdShowPaletteInspector() {
  return showDesktopOnly('Palette inspector');
}

function cmdExportPaletteCss() {
  return showDesktopOnly('Export palette as CSS');
}

function cmdExportCustomTheme() {
  return showDesktopOnly('Custom theme export');
}

function cmdShareCustomTheme() {
  return showDesktopOnly('Custom theme sharing');
}

function cmdImportCustomTheme() {
  return showDesktopOnly('Custom theme import');
}

function cmdApplyCircadianTheme() {
  return showDesktopOnly('Circadian auto-switching');
}

function cmdShowThemeOfWeek() {
  return showDesktopOnly('Theme of the week');
}

// ─── activate / deactivate ────────────────────────────────────────────────────

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('forestAsh.generateTheme',    cmdGenerateTheme),
    vscode.commands.registerCommand('forestAsh.applyCustomTheme', cmdApplyCustomTheme),
    vscode.commands.registerCommand('forestAsh.deleteCustomTheme',cmdDeleteCustomTheme),
    vscode.commands.registerCommand('forestAsh.listCustomThemes', cmdListCustomThemes),
    vscode.commands.registerCommand('forestAsh.quickThemePicker', cmdQuickThemePicker),
    vscode.commands.registerCommand('forestAsh.toggleFocusMode', cmdToggleFocusMode),
    vscode.commands.registerCommand('forestAsh.toggleItalicMode', cmdToggleItalicMode),
    vscode.commands.registerCommand('forestAsh.toggleHighContrast', cmdToggleHighContrast),
    vscode.commands.registerCommand('forestAsh.previewThemes', cmdPreviewThemes),
    vscode.commands.registerCommand('forestAsh.showPaletteInspector', cmdShowPaletteInspector),
    vscode.commands.registerCommand('forestAsh.exportPaletteCss', cmdExportPaletteCss),
    vscode.commands.registerCommand('forestAsh.exportCustomTheme', cmdExportCustomTheme),
    vscode.commands.registerCommand('forestAsh.shareCustomTheme', cmdShareCustomTheme),
    vscode.commands.registerCommand('forestAsh.importCustomTheme', cmdImportCustomTheme),
    vscode.commands.registerCommand('forestAsh.applyCircadianTheme', cmdApplyCircadianTheme),
    vscode.commands.registerCommand('forestAsh.showThemeOfWeek', cmdShowThemeOfWeek),
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
