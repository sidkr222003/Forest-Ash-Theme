'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { STATIC_THEMES } = require('../src/themesList');

test('manifest commands and themes stay in sync', () => {
  const root = path.join(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const commands = new Set(pkg.contributes.commands.map(command => command.command));
  const activations = new Set(pkg.activationEvents.filter(event => event.startsWith('onCommand:')).map(event => event.slice(10)));
  assert.deepEqual([...commands].filter(command => !activations.has(command)), []);
  assert.deepEqual(
    STATIC_THEMES.map(theme => theme.label).sort(),
    pkg.contributes.themes.map(theme => theme.label).sort()
  );
});
