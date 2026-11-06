'use strict';

const HEX_COLOR = /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i;
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ._()\-]{0,79}$/u;

function isColor(value) {
  return typeof value === 'string' && (
    HEX_COLOR.test(value.trim()) ||
    /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(value.trim())
  );
}

function validateThemeName(value, existing = []) {
  const label = String(value || '').trim();
  if (!label) return 'Theme name is required.';
  if (!NAME_PATTERN.test(label)) return 'Use 1-80 letters, numbers, spaces, dots, underscores, parentheses, or hyphens.';
  if (existing.some(item => String(item.label || item).toLowerCase() === label.toLowerCase())) {
    return 'A theme with this name already exists.';
  }
  return null;
}

function validateThemeJson(theme) {
  if (!theme || typeof theme !== 'object' || Array.isArray(theme)) return 'Theme must be a JSON object.';
  if (!theme.colors || typeof theme.colors !== 'object' || Array.isArray(theme.colors)) return 'Theme colors must be an object.';
  if (!Array.isArray(theme.tokenColors)) return 'Theme tokenColors must be an array.';
  const invalidColor = Object.entries(theme.colors).find(([, value]) => !isColor(value));
  if (invalidColor) return `Invalid color for "${invalidColor[0]}".`;
  for (const [index, rule] of theme.tokenColors.entries()) {
    if (!rule || typeof rule !== 'object' || !rule.settings || typeof rule.settings !== 'object') {
      return `Invalid tokenColors entry at index ${index}.`;
    }
    if (rule.settings.foreground && !isColor(rule.settings.foreground)) {
      return `Invalid token foreground at index ${index}.`;
    }
  }
  return null;
}

function parsePaletteText(text) {
  const source = String(text || '').trim();
  if (!source) throw new Error('The palette file is empty.');
  try {
    const parsed = JSON.parse(source);
    if (parsed.colors || parsed.tokenColors) return parsed;
    if (parsed.colors && typeof parsed.colors === 'object') return { colors: parsed.colors, tokenColors: [] };
  } catch (_) {
    // CSS, SCSS, and Tailwind-like text are handled below.
  }
  const colors = {};
  const pattern = /(?:--|[$])?([a-zA-Z][\w.-]*)\s*:\s*(#[0-9a-f]{6,8}|rgba?\([^;]+\))/gi;
  for (const match of source.matchAll(pattern)) colors[match[1]] = match[2].trim();
  if (!Object.keys(colors).length) throw new Error('No supported colors were found.');
  const mapped = {};
  const aliases = [
    ['editor.background', ['background', 'bg', 'base']],
    ['editor.foreground', ['foreground', 'fg', 'text']],
    ['textLink.foreground', ['accent', 'primary', 'link']],
    ['editor.selectionBackground', ['selection']],
  ];
  for (const [target, names] of aliases) {
    const found = Object.entries(colors).find(([key]) => names.some(name => key.toLowerCase().includes(name)));
    if (found) mapped[target] = found[1];
  }
  const remaining = Object.values(colors);
  if (!mapped['editor.background']) mapped['editor.background'] = remaining[0];
  if (!mapped['editor.foreground']) mapped['editor.foreground'] = remaining[1] || '#d4d4d4';
  if (!mapped['textLink.foreground']) mapped['textLink.foreground'] = remaining[2] || mapped['editor.foreground'];
  return { name: 'Imported Forest Ash Palette', colors: mapped, tokenColors: [] };
}

module.exports = { isColor, validateThemeName, validateThemeJson, parsePaletteText };
