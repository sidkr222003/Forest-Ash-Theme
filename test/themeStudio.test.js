'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { buildThemeStudioHtml, contrastRatio } = require('../src/themeStudio');

test('calculates WCAG contrast ratios', () => {
  assert.equal(contrastRatio('#ffffff', '#000000'), 21);
  assert.ok(contrastRatio('#d4d4d4', '#1e1e1e') > 10);
});

test('renders all Studio controls and escapes labels', () => {
  const html = buildThemeStudioHtml([{
    label: '<unsafe>',
    type: 'dark',
    colors: { 'editor.background': '#101010' },
    syntax: {},
  }]);
  assert.match(html, /Theme Studio/);
  assert.match(html, /Color-blind safe/);
  assert.doesNotMatch(html, /<unsafe>/);
});
