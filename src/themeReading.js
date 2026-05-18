'use strict';

const vscode = require('vscode');

function decodeBytes(bytes) {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(bytes);
  }
  return Buffer.from(bytes).toString('utf8');
}

async function readJsonFromExtension(context, relPath) {
  const uri = vscode.Uri.joinPath(context.extensionUri, relPath);
  const data = await vscode.workspace.fs.readFile(uri);
  return JSON.parse(decodeBytes(data));
}

async function listThemeEntries(context) {
  const pkg = await readJsonFromExtension(context, 'package.json');
  return pkg?.contributes?.themes ?? [];
}

async function getThemeEntryByLabel(context, label) {
  const themes = await listThemeEntries(context);
  return themes.find(theme => theme.label === label) || null;
}

async function readThemeJsonByLabel(context, label) {
  const entry = await getThemeEntryByLabel(context, label);
  if (!entry?.path) return null;
  return readJsonFromExtension(context, entry.path.replace(/^\.?\//, ''));
}

module.exports = {
  readJsonFromExtension,
  listThemeEntries,
  getThemeEntryByLabel,
  readThemeJsonByLabel,
};
