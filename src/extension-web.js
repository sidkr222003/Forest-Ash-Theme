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

// ─── activate / deactivate ────────────────────────────────────────────────────

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('forestAsh.generateTheme',    cmdGenerateTheme),
    vscode.commands.registerCommand('forestAsh.applyCustomTheme', cmdApplyCustomTheme),
    vscode.commands.registerCommand('forestAsh.deleteCustomTheme',cmdDeleteCustomTheme),
    vscode.commands.registerCommand('forestAsh.listCustomThemes', cmdListCustomThemes),
    vscode.commands.registerCommand('forestAsh.quickThemePicker', cmdQuickThemePicker),
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
