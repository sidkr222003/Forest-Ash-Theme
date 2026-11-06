'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  isColor,
  parsePaletteText,
  validateThemeJson,
  validateThemeName,
} = require('../src/themeValidation');

test('validates supported colors and rejects malformed values', () => {
  assert.equal(isColor('#4a9eff'), true);
  assert.equal(isColor('#4a9effcc'), true);
  assert.equal(isColor('rgba(10, 20, 30, 0.5)'), true);
  assert.equal(isColor('javascript:alert(1)'), false);
});

test('rejects duplicate and unsafe names', () => {
  assert.equal(validateThemeName('Forest Ash', [{ label: 'forest ash' }]), 'A theme with this name already exists.');
  assert.match(validateThemeName('bad<script>', []), /Use 1-80/);
});

test('parses CSS variables into a theme palette', () => {
  const theme = parsePaletteText(':root { --background: #101010; --foreground: #eeeefe; --accent: #4a9eff; }');
  assert.equal(theme.colors['editor.background'], '#101010');
  assert.equal(validateThemeJson(theme), null);
});
