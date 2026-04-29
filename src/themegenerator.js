'use strict';

/**
 * themeGenerator.js  –  Forest Ash Dynamic Theme Generator
 * ──────────────────────────────────────────────────────────
 */

const chroma = require('chroma-js');

// ─── low-level helpers ───────────────────────────────────────────────────────

function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  return chroma.hsl(h, s, l).hex();
}

/** Append alpha byte: '#rrggbb' + 0.4  →  '#rrggbb66' */
function alpha(hex, opacity) {
  const byte = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');
  return hex.slice(0, 7) + byte;
}

/**
 * Extract hue (0-360), saturation (0-100) and lightness (0-100)
 * from any chroma-valid colour.
 */
function hslOf(hex) {
  const [h, s, l] = chroma(hex).hsl();
  return {
    h: isNaN(h) ? 0 : h,          // achromatic greys → 0°
    s: isNaN(s) ? 0 : s * 100,    // 0-100
    l: isNaN(l) ? 50 : l * 100,   // 0-100
  };
}

/**
 * Clamp a value between lo and hi.
 */
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// ─── Forest Ash palette builder ──────────────────────────────────────────────

function buildPalette(baseHex, isDark) {
  const { h: H, s: S, l: L } = hslOf(baseHex);

  // ── Derived influence factors ────────────────────────────────────────────
  const sF = clamp(0.60 + (S / 100) * 0.80, 0.60, 1.40);
  const lShift = clamp(((L - 50) / 50) * 6, -6, 6);
  const hueBias = (S / 100) * 20;

  const ss = (base) => clamp(base * sF, 0, 100);
  const sl = (base) => clamp(base + lShift * 0.5, 0, 100);

  if (isDark) {
    // ── backgrounds ─────────────────────────────────────────────────────
    const bgL = (base) => clamp(base + lShift * 0.3, 6, 22);

    const bg0 = hsl(H, ss(8), bgL(10));
    const bg1 = hsl(H, ss(8), bgL(12));
    const bg2 = hsl(H, ss(7), bgL(15));
    const bg3 = hsl(H, ss(7), bgL(18));
    const bg4 = hsl(H, ss(9), bgL(14));

    // ── foregrounds ───────────────────────────────────────────────────────
    const fgL = (base) => clamp(base - lShift * 0.2, 38, 92);

    const fg0 = hsl(H, ss(9), fgL(82));
    const fg1 = hsl(H, ss(7), fgL(65));
    const fg2 = hsl(H, ss(5), fgL(44));

    // ── accent ───────────────────────────────────────────────────────────
    const accent = hsl(H, ss(44), sl(62));
    const accentBright = hsl(H, ss(50), sl(68));
    const accentDim = hsl(H, ss(38), sl(55));
    const accentFaint = alpha(accent, 0.15);
    const buttonAccent = hsl(H, clamp(ss(52), 35, 100), clamp(sl(40), 28, 48));

    // ─ syntax tokens ───────────────────────────────────────────────────────
    const synKeyword = hsl(H, ss(28), sl(60));
    const synFunc = hsl(H + 200 + hueBias, ss(28), sl(62));
    const synString = hsl(H + 40 + hueBias, ss(48), sl(58));
    const synType = hsl(H + 290 - hueBias, ss(28), sl(64));
    const synNumber = hsl(H + 55 + hueBias, ss(42), sl(64));
    
    // FIX: Comments are now significantly lighter and slightly more saturated
    const synComment = hsl(H, clamp(ss(35), 30, 100), clamp(75 + lShift * 0.2, 68, 85));
    
    const synVar = hsl(H, ss(14), sl(76));
    const synPunct = hsl(H, ss(12), sl(65));
    const synTag = hsl(H + 15 + hueBias, ss(32), sl(62));
    const synAttr = hsl(H - 15 - hueBias, ss(30), sl(64));

    // ── terminal ANSI ────────────────────────────────────────────────────
    const termBlack = bg1;
    const termRed = hsl(H + 0, ss(55), sl(58));
    const termGreen = hsl(H + 100, ss(45), sl(56));
    const termYellow = hsl(H + 50, ss(55), sl(60));
    const termBlue = hsl(H + 220, ss(45), sl(60));
    const termMagenta = hsl(H + 280, ss(40), sl(60));
    const termCyan = hsl(H + 170, ss(42), sl(58));
    const termWhite = fg0;

    return {
      isDark,
      bg0, bg1, bg2, bg3, bg4,
      fg0, fg1, fg2,
      accent, accentBright, accentDim, accentFaint, buttonAccent,
      synKeyword, synFunc, synString, synType, synNumber,
      synComment, synVar, synPunct, synTag, synAttr,
      termBlack, termRed, termGreen, termYellow,
      termBlue, termMagenta, termCyan, termWhite,
    };

  } else {
    // ══════════════════════════════════════════════════════
    //  LIGHT variant
    // ══════════════════════════════════════════════════════

    const bgL = (base) => clamp(base - lShift * 0.25, 82, 98);
    const fgL = (base) => clamp(base - lShift * 0.20, 12, 60);

    const bg0 = hsl(H, ss(14), bgL(96));
    const bg1 = hsl(H, ss(12), bgL(93));
    const bg2 = hsl(H, ss(10), bgL(90));
    const bg3 = hsl(H, ss(9), bgL(87));
    const bg4 = hsl(H, ss(16), bgL(92));

    const fg0 = hsl(H, ss(18), fgL(18));
    const fg1 = hsl(H, ss(14), fgL(34));
    const fg2 = hsl(H, ss(9), fgL(52));

    const accent = hsl(H, ss(50), sl(42));
    const accentBright = hsl(H, ss(55), sl(38));
    const accentDim = hsl(H, ss(42), sl(48));
    const accentFaint = alpha(accent, 0.12);
    const buttonAccent = accentBright;

    // Syntax: lightness is pushed down for light variant
    const synKeyword = hsl(H, ss(38), sl(38));
    const synFunc = hsl(H + 200 + hueBias, ss(38), sl(38));
    const synString = hsl(H + 40 + hueBias, ss(52), sl(36));
    const synType = hsl(H + 290 - hueBias, ss(35), sl(40));
    const synNumber = hsl(H + 55 + hueBias, ss(46), sl(36));
    const synComment = hsl(H, ss(12), sl(55));
    const synVar = hsl(H, ss(16), sl(24));
    const synPunct = hsl(H, ss(12), sl(42));
    const synTag = hsl(H + 15 + hueBias, ss(40), sl(38));
    const synAttr = hsl(H - 15 - hueBias, ss(36), sl(40));

    const termBlack = fg0;
    const termRed = hsl(H + 0, ss(52), sl(38));
    const termGreen = hsl(H + 100, ss(42), sl(36));
    const termYellow = hsl(H + 50, ss(52), sl(36));
    const termBlue = hsl(H + 220, ss(42), sl(38));
    const termMagenta = hsl(H + 280, ss(38), sl(38));
    const termCyan = hsl(H + 170, ss(40), sl(36));
    const termWhite = bg0;

    return {
      isDark,
      bg0, bg1, bg2, bg3, bg4,
      fg0, fg1, fg2,
      accent, accentBright, accentDim, accentFaint, buttonAccent,
      synKeyword, synFunc, synString, synType, synNumber,
      synComment, synVar, synPunct, synTag, synAttr,
      termBlack, termRed, termGreen, termYellow,
      termBlue, termMagenta, termCyan, termWhite,
    };
  }
}

// ── VS Code workbench colors ────────────────────────────────────────────────

function buildColors(p) {
  const {
    isDark,
    bg0, bg1, bg2, bg3, bg4,
    fg0, fg1, fg2,
    accent, accentBright, accentDim, buttonAccent,
    termRed, termGreen, termYellow, termBlue,
    termMagenta, termCyan, termBlack, termWhite,
    synKeyword, synFunc, synString, synType,
    synComment, synAttr,
  } = p;

  const border = isDark ? alpha(fg2, 0.25) : alpha(fg2, 0.30);
  const shadow = alpha('#000000', isDark ? 0.45 : 0.12);
  const inputBg = isDark ? bg2 : alpha(bg0, 0.90);
  const dropBg = bg2;

  return {
    // ── Base ──────────────────────────────────────────────────────────────
    'focusBorder': '#00000000', // Removed focus box
    'foreground': fg0,
    'disabledForeground': fg2,
    'widget.shadow': shadow,
    'selection.background': alpha(accent, 0.30),
    'descriptionForeground': fg1,
    'errorForeground': termRed,
    'icon.foreground': fg1,

    // ── Text ──────────────────────────────────────────────────────────────
    'textBlockQuote.background': bg2,
    'textBlockQuote.border': '#00000000',
    'textCodeBlock.background': bg2,
    'textLink.activeForeground': accentBright,
    'textLink.foreground': accent,
    'textPreformat.foreground': fg0,
    'textSeparator.foreground': '#00000000',

    // ── Toolbar ─────────────────────────────────────────────────────────
    'toolbar.hoverBackground': alpha(accent, 0.10),
    'toolbar.activeBackground': alpha(accent, 0.18),

    // ── Button ───────────────────────────────────────────────────────────
    'button.background': buttonAccent,
    'button.foreground': '#ffffff',
    'button.hoverBackground': accentDim,
    'button.secondaryBackground': bg3,
    'button.secondaryForeground': fg0,
    'button.secondaryHoverBackground': bg2,
    'button.border': '#00000000',
    'button.separator': '#00000000',

    // ── Checkbox ──────────────────────────────────────────────────────────
    'checkbox.background': inputBg,
    'checkbox.foreground': fg0,
    'checkbox.border': '#00000000',
    'checkbox.selectBackground': alpha(accent, 0.20),
    'checkbox.selectBorder': '#00000000',

    // ── Dropdown ──────────────────────────────────────────────────────────
    'dropdown.background': dropBg,
    'dropdown.listBackground': dropBg,
    'dropdown.border': '#00000000',
    'dropdown.foreground': fg0,

    // ── Input ─────────────────────────────────────────────────────────────
    'input.background': inputBg,
    'input.border': '#00000000',
    'input.foreground': fg0,
    'input.placeholderForeground': fg2,
    'inputOption.activeBackground': alpha(accent, 0.22),
    'inputOption.activeBorder': '#00000000',
    'inputOption.activeForeground': accentBright,
    'inputOption.hoverBackground': alpha(accent, 0.12),
    'inputValidation.errorBackground': alpha(termRed, isDark ? 0.22 : 0.10),
    'inputValidation.errorBorder': '#00000000',
    'inputValidation.errorForeground': fg0,
    'inputValidation.warningBackground': alpha(termYellow, 0.18),
    'inputValidation.warningBorder': '#00000000',
    'inputValidation.warningForeground': fg0,
    'inputValidation.infoBackground': alpha(accent, 0.18),
    'inputValidation.infoBorder': '#00000000',
    'inputValidation.infoForeground': fg0,

    // ── Scrollbar ─────────────────────────────────────────────────────────
    'scrollbar.shadow': shadow,
    'scrollbarSlider.activeBackground': alpha(accent, 0.55),
    'scrollbarSlider.background': alpha(fg2, 0.18),
    'scrollbarSlider.hoverBackground': alpha(accent, 0.38),

    // ── Badge ─────────────────────────────────────────────────────────────
    'badge.background': buttonAccent,
    'badge.foreground': '#ffffff',
    'progressBar.background': buttonAccent,

    // ── List / Tree ───────────────────────────────────────────────────────
    'list.activeSelectionBackground': alpha(accent, 0.24),
    'list.activeSelectionForeground': fg0,
    'list.activeSelectionIconForeground': fg0,
    'list.dropBackground': alpha(accent, 0.14),
    'list.focusBackground': alpha(accent, 0.18),
    'list.focusForeground': fg0,
    'list.focusOutline': '#00000000', // Removed focus box
    'list.highlightForeground': accentBright,
    'list.hoverBackground': alpha(accent, 0.10),
    'list.hoverForeground': fg0,
    'list.inactiveSelectionBackground': alpha(accent, 0.14),
    'list.inactiveSelectionForeground': fg0,
    'list.inactiveSelectionIconForeground': fg1,
    'list.inactiveFocusBackground': alpha(accent, 0.10),
    'list.inactiveFocusOutline': '#00000000',
    'list.errorForeground': termRed,
    'list.warningForeground': termYellow,
    'list.deemphasizedForeground': fg2,
    'list.filterMatchBackground': alpha(accent, 0.18),
    'list.filterMatchBorder': '#00000000',
    'listFilterWidget.background': dropBg,
    'listFilterWidget.outline': '#00000000',
    'listFilterWidget.noMatchesOutline': '#00000000',
    'listFilterWidget.shadow': shadow,
    'tree.indentGuidesStroke': alpha(accent, 0.28),
    'tree.tableColumnsBorder': '#00000000',
    'tree.tableOddRowsBackground': alpha(accent, 0.04),

    // ── Activity Bar ──────────────────────────────────────────────────────
    'activityBar.background': bg1,
    'activityBar.foreground': fg0,
    'activityBar.inactiveForeground': fg2,
    'activityBar.dropBorder': '#00000000',
    'activityBar.activeBackground': alpha(accent, 0.10),
    'activityBar.activeBorder': '#00000000',
    'activityBar.activeFocusBorder': '#00000000',
    'activityBarBadge.background': buttonAccent,
    'activityBarBadge.foreground': '#ffffff',
    'activityBarTop.foreground': fg0,
    'activityBarTop.activeBorder': '#00000000',
    'activityBarTop.inactiveForeground': fg2,
    'activityBarTop.dropBorder': '#00000000',

    // ── Side Bar ──────────────────────────────────────────────────────────
    'sideBar.background': bg1,
    'sideBar.foreground': fg0,
    'sideBar.dropBackground': alpha(accent, 0.12),
    'sideBarTitle.foreground': fg0,
    'sideBarSectionHeader.background': bg2,
    'sideBarSectionHeader.foreground': fg1,
    'sideBarSectionHeader.border': '#00000000',

    // ── Minimap ──────────────────────────────────────────────────────────
    'minimap.findMatchHighlight': alpha(accentBright, 0.60),
    'minimap.selectionHighlight': alpha(accent, 0.40),
    'minimap.errorHighlight': termRed,
    'minimap.warningHighlight': termYellow,
    'minimap.background': bg0,
    'minimap.foregroundOpacity': alpha('#000000', 0.85),
    'minimapSlider.background': alpha(fg2, 0.18),
    'minimapSlider.hoverBackground': alpha(accent, 0.38),
    'minimapSlider.activeBackground': alpha(accent, 0.55),

    // ── Editor Groups / Tabs ──────────────────────────────────────────────
    'editorGroup.border': '#00000000', // Removed editor group border
    'editorGroup.dropBackground': alpha(accent, 0.12),
    'editorGroup.emptyBackground': bg0,
    'editorGroup.focusedEmptyBorder': '#00000000',
    'editorGroup.dropIntoPromptForeground': fg0,
    'editorGroup.dropIntoPromptBackground': bg2,
    'editorGroup.dropIntoPromptBorder': '#00000000',
    'editorGroupHeader.tabsBackground': bg1,
    'editorGroupHeader.noTabsBackground': bg1,
    'editorGroupHeader.border': '#00000000',
    
    // TABS - ONLY BOTTOM BORDER
    'tab.activeBackground': bg0,
    'tab.activeForeground': fg0,
    'tab.border': '#00000000', // REMOVE rectangular border
    'tab.activeBorder': accent, // SHOW ONLY BOTTOM BORDER
    'tab.activeBorderTop': '#00000000', 
    'tab.inactiveBackground': bg1,
    'tab.inactiveForeground': fg2,
    'tab.hoverBackground': alpha(accent, 0.08),
    'tab.hoverForeground': fg1,
    'tab.hoverBorder': '#00000000', 
    'tab.unfocusedActiveBackground': bg1,
    'tab.unfocusedActiveForeground': fg1,
    'tab.unfocusedActiveBorder': '#00000000', 
    'tab.unfocusedActiveBorderTop': '#00000000',
    'tab.unfocusedInactiveBackground': bg1,
    'tab.unfocusedInactiveForeground': fg2,
    'tab.unfocusedHoverBackground': alpha(accent, 0.06),
    'tab.unfocusedHoverForeground': fg2,
    'tab.unfocusedHoverBorder': '#00000000',
    'tab.lastPinnedBorder': '#00000000',
    'tab.selectedBorderTop': '#00000000',
    'tab.dragAndDropBorder': '#00000000',

    // ─ Editor ────────────────────────────────────────────────────────────
    'editor.background': bg0,
    'editor.foreground': fg0,
    'editorLineNumber.foreground': fg2,
    'editorLineNumber.activeForeground': fg1,
    'editorLineNumber.dimmedForeground': alpha(fg2, 0.55),
    'editorCursor.foreground': accentBright,
    'editorCursor.background': bg0,
    'editor.selectionBackground': alpha(accent, 0.28),
    'editor.selectionForeground': fg0,
    'editor.inactiveSelectionBackground': alpha(accent, isDark ? 0.14 : 0.10),
    'editor.selectionHighlightBackground': alpha(accent, 0.14),
    'editor.selectionHighlightBorder': '#00000000',
    'editor.wordHighlightBackground': alpha(accent, 0.16),
    'editor.wordHighlightBorder': '#00000000',
    'editor.wordHighlightStrongBackground': alpha(accent, 0.26),
    'editor.wordHighlightStrongBorder': '#00000000',
    'editor.wordHighlightTextBackground': alpha(accent, 0.10),
    'editor.wordHighlightTextBorder': '#00000000',
    'editor.findMatchBackground': alpha(accentBright, 0.38),
    'editor.findMatchBorder': '#00000000',
    'editor.findMatchHighlightBackground': alpha(accent, 0.18),
    'editor.findMatchHighlightBorder': '#00000000',
    'editor.findRangeHighlightBackground': alpha(accent, 0.08),
    'editor.findRangeHighlightBorder': '#00000000',
    'editor.hoverHighlightBackground': alpha(accent, 0.12),
    'editor.lineHighlightBackground': bg4,
    'editor.lineHighlightBorder': '#00000000', 
    'editorLink.activeForeground': accentBright,
    'editor.rangeHighlightBackground': alpha(accent, 0.08),
    'editor.rangeHighlightBorder': '#00000000',
    'editor.symbolHighlightBackground': alpha(accent, 0.14),
    'editor.symbolHighlightBorder': '#00000000',
    'editorWhitespace.foreground': alpha(fg2, 0.40),
    'editorIndentGuide.background': alpha(fg2, 0.18),
    'editorIndentGuide.background1': alpha(fg2, 0.18),
    'editorIndentGuide.activeBackground': alpha(accent, 0.38),
    'editorIndentGuide.activeBackground1': alpha(accent, 0.38),
    'editorRuler.foreground': alpha(fg2, 0.18),
    'editorMultiCursor.primary.foreground': accentBright,
    'editorMultiCursor.primary.background': bg0,
    'editorMultiCursor.secondary.foreground': accent,
    'editorMultiCursor.secondary.background': bg0,

    // ─ Editor Widgets ────────────────────────────────────────────────────
    'editorWidget.background': bg2,
    'editorWidget.border': '#00000000',
    'editorWidget.foreground': fg0,
    'editorWidget.resizeBorder': '#00000000',
    'editorSuggestWidget.background': bg2,
    'editorSuggestWidget.border': '#00000000',
    'editorSuggestWidget.foreground': fg0,
    'editorSuggestWidget.focusHighlightForeground': accentBright,
    'editorSuggestWidget.highlightForeground': accentBright,
    'editorSuggestWidget.selectedBackground': alpha(accent, 0.22),
    'editorSuggestWidget.selectedForeground': fg0,
    'editorSuggestWidget.selectedIconForeground': accentBright,
    'editorSuggestWidgetStatus.foreground': fg2,
    'editorHoverWidget.background': bg2,
    'editorHoverWidget.border': '#00000000',
    'editorHoverWidget.foreground': fg0,
    'editorHoverWidget.highlightForeground': accentBright,
    'editorHoverWidget.statusBarBackground': bg3,

    // ── Gutter ────────────────────────────────────────────────────────────
    'editorGutter.background': bg0,
    'editorGutter.modifiedBackground': alpha(accent, 0.80),
    'editorGutter.addedBackground': alpha(termGreen, 0.80),
    'editorGutter.deletedBackground': alpha(termRed, 0.80),
    'editorGutter.commentRangeForeground': fg2,
    'editorGutter.commentGlyphForeground': accent,
    'editorGutter.commentUnresolvedGlyphForeground': termYellow,
    'editorGutter.foldingControlForeground': fg2,

    // ── Diff Editor ───────────────────────────────────────────────────────
    'diffEditor.insertedTextBackground': alpha(termGreen, 0.12),
    'diffEditor.insertedTextBorder': '#00000000',
    'diffEditor.removedTextBackground': alpha(termRed, 0.12),
    'diffEditor.removedTextBorder': '#00000000',
    'diffEditor.insertedLineBackground': alpha(termGreen, 0.07),
    'diffEditor.removedLineBackground': alpha(termRed, 0.07),
    'diffEditor.diagonalFill': alpha(termBlue, 0.30),
    'diffEditor.unchangedRegionBackground': bg1,
    'diffEditor.unchangedRegionForeground': fg2,
    'diffEditor.unchangedCodeBackground': alpha(fg2, 0.06),
    'diffEditorGutter.insertedLineBackground': alpha(termGreen, 0.70),
    'diffEditorGutter.removedLineBackground': alpha(termRed, 0.70),
    'diffEditorOverview.insertedForeground': alpha(termGreen, 0.70),
    'diffEditorOverview.removedForeground': alpha(termRed, 0.70),

    // ── Peek View ────────────────────────────────────────────────────────
    'peekView.border': '#00000000',
    'peekViewEditor.background': bg0,
    'peekViewEditor.matchHighlightBackground': alpha(accent, 0.26),
    'peekViewEditor.matchHighlightBorder': '#00000000',
    'peekViewEditorGutter.background': bg0,
    'peekViewEditorStickyScroll.background': bg1,
    'peekViewResult.background': bg2,
    'peekViewResult.fileForeground': fg0,
    'peekViewResult.lineForeground': fg1,
    'peekViewResult.matchHighlightBackground': alpha(accent, 0.22),
    'peekViewResult.selectionBackground': alpha(accent, 0.18),
    'peekViewResult.selectionForeground': fg0,
    'peekViewTitle.background': bg2,
    'peekViewTitleDescription.foreground': fg1,
    'peekViewTitleLabel.foreground': fg0,

    // ─ Merge ─────────────────────────────────────────────────────────────
    'merge.currentHeaderBackground': alpha(termGreen, 0.20),
    'merge.currentContentBackground': alpha(termGreen, 0.08),
    'merge.incomingHeaderBackground': alpha(termBlue, 0.20),
    'merge.incomingContentBackground': alpha(termBlue, 0.08),
    'merge.border': '#00000000',
    'merge.commonHeaderBackground': alpha(accent, 0.18),
    'merge.commonContentBackground': alpha(accent, 0.08),

    // ── Panel ─────────────────────────────────────────────────────────────
    'panel.background': bg1,
    'panel.dropBorder': '#00000000',
    'panelTitle.activeBorder': '#00000000', 
    'panelTitle.activeForeground': fg0,
    'panelTitle.inactiveForeground': fg2,
    'panelInput.border': '#00000000',
    'panelSection.border': '#00000000',
    'panelSection.dropBackground': alpha(accent, 0.12),
    'panelSectionHeader.background': bg2,
    'panelSectionHeader.foreground': fg0,
    'panelSectionHeader.border': '#00000000',

    // ── Status Bar ────────────────────────────────────────────────────────
    'statusBar.background': bg1,
    'statusBar.foreground': fg0,
    'statusBar.border': '#00000000',
    'statusBar.focusBorder': '#00000000',
    'statusBar.debuggingBackground': accentDim,
    'statusBar.debuggingForeground': '#ffffff',
    'statusBar.debuggingBorder': '#00000000',
    'statusBar.noFolderBackground': bg2,
    'statusBar.noFolderForeground': fg0,
    'statusBar.noFolderBorder': '#00000000',
    'statusBarItem.activeBackground': alpha(accent, 0.28),
    'statusBarItem.hoverBackground': alpha(accent, 0.14),
    'statusBarItem.hoverForeground': fg0,
    'statusBarItem.focusBorder': '#00000000',
    'statusBarItem.prominentBackground': buttonAccent,
    'statusBarItem.prominentForeground': '#ffffff',
    'statusBarItem.prominentHoverForeground': '#ffffff',
    'statusBarItem.prominentHoverBackground': accentDim,
    'statusBarItem.remoteBackground': buttonAccent,
    'statusBarItem.remoteForeground': '#ffffff',
    'statusBarItem.remoteHoverBackground': accentDim,
    'statusBarItem.remoteHoverForeground': '#ffffff',
    'statusBarItem.errorBackground': alpha(termRed, 0.22),
    'statusBarItem.errorForeground': termRed,
    'statusBarItem.errorHoverBackground': alpha(termRed, 0.35),
    'statusBarItem.errorHoverForeground': termRed,
    'statusBarItem.warningBackground': alpha(termYellow, 0.18),
    'statusBarItem.warningForeground': termYellow,
    'statusBarItem.warningHoverBackground': alpha(termYellow, 0.30),
    'statusBarItem.warningHoverForeground': termYellow,
    'statusBarItem.offlineBackground': alpha(fg2, 0.18),
    'statusBarItem.offlineForeground': fg1,
    'statusBarItem.offlineHoverBackground': alpha(fg2, 0.28),
    'statusBarItem.offlineHoverForeground': fg0,

    // ── Title Bar ───────────────────────────────────────────────────────
    'titleBar.activeBackground': bg1,
    'titleBar.activeForeground': fg0,
    'titleBar.border': '#00000000',
    'titleBar.inactiveBackground': bg1,
    'titleBar.inactiveForeground': fg2,
    'menubar.selectionForeground': fg0,
    'menubar.selectionBackground': alpha(accent, 0.14),
    'menubar.selectionBorder': '#00000000',

    // ── Menu ──────────────────────────────────────────────────────────────
    'menu.background': bg2,
    'menu.foreground': fg0,
    'menu.border': '#00000000',
    'menu.selectionBackground': alpha(accent, 0.22),
    'menu.selectionForeground': fg0,
    'menu.selectionBorder': '#00000000',
    'menu.separatorBackground': '#00000000',
    'menu.shadow': shadow,

    // ── Notifications ────────────────────────────────────────────────────
    'notifications.background': bg2,
    'notifications.border': '#00000000',
    'notifications.foreground': fg0,
    'notificationCenter.border': '#00000000',
    'notificationCenterHeader.foreground': fg0,
    'notificationCenterHeader.background': bg3,
    'notificationToast.border': '#00000000',
    'notificationsErrorIcon.foreground': termRed,
    'notificationsWarningIcon.foreground': termYellow,
    'notificationsInfoIcon.foreground': accent,
    'notificationLink.foreground': accentBright,

    // ── Quick Pick ────────────────────────────────────────────────────────
    'pickerGroup.border': '#00000000',
    'pickerGroup.foreground': accentBright,
    'quickInput.background': bg2,
    'quickInput.foreground': fg0,
    'quickInputList.focusBackground': alpha(accent, 0.22),
    'quickInputList.focusForeground': fg0,
    'quickInputList.focusIconForeground': accent,
    'quickInputTitle.background': bg3,

    // ── Keybinding Label ──────────────────────────────────────────────────
    'keybindingLabel.background': alpha(accent, 0.12),
    'keybindingLabel.border': '#00000000',
    'keybindingLabel.bottomBorder': '#00000000',
    'keybindingLabel.foreground': fg0,
    'keybindingTable.headerBackground': bg2,
    'keybindingTable.rowsBackground': alpha(accent, 0.04),

    // ── Breadcrumb ────────────────────────────────────────────────────────
    'breadcrumb.activeSelectionForeground': accentBright,
    'breadcrumb.background': bg0,
    'breadcrumb.focusForeground': accent,
    'breadcrumb.foreground': fg1,
    'breadcrumbPicker.background': bg2,

    // ── Symbol Icons ─────────────────────────────────────────────────────
    'symbolIcon.arrayForeground': p.synVar,
    'symbolIcon.booleanForeground': p.synNumber,
    'symbolIcon.classForeground': synType,
    'symbolIcon.colorForeground': p.synString,
    'symbolIcon.constantForeground': p.synNumber,
    'symbolIcon.constructorForeground': synFunc,
    'symbolIcon.enumeratorForeground': synType,
    'symbolIcon.enumeratorMemberForeground': p.synNumber,
    'symbolIcon.eventForeground': accent,
    'symbolIcon.fieldForeground': synAttr,
    'symbolIcon.fileForeground': fg1,
    'symbolIcon.folderForeground': accent,
    'symbolIcon.functionForeground': synFunc,
    'symbolIcon.interfaceForeground': synType,
    'symbolIcon.keyForeground': synAttr,
    'symbolIcon.keywordForeground': synKeyword,
    'symbolIcon.methodForeground': synFunc,
    'symbolIcon.moduleForeground': accent,
    'symbolIcon.namespaceForeground': synType,
    'symbolIcon.nullForeground': p.synNumber,
    'symbolIcon.numberForeground': p.synNumber,
    'symbolIcon.objectForeground': p.synVar,
    'symbolIcon.operatorForeground': p.synPunct,
    'symbolIcon.packageForeground': accent,
    'symbolIcon.propertyForeground': synAttr,
    'symbolIcon.referenceForeground': p.synVar,
    'symbolIcon.snippetForeground': p.synString,
    'symbolIcon.stringForeground': p.synString,
    'symbolIcon.structForeground': synType,
    'symbolIcon.textForeground': fg0,
    'symbolIcon.typeParameterForeground': synType,
    'symbolIcon.unitForeground': p.synNumber,
    'symbolIcon.variableForeground': p.synVar,

    // ── Git Decoration ────────────────────────────────────────────────────
    'gitDecoration.addedResourceForeground': termGreen,
    'gitDecoration.conflictingResourceForeground': termYellow,
    'gitDecoration.deletedResourceForeground': termRed,
    'gitDecoration.ignoredResourceForeground': fg2,
    'gitDecoration.modifiedResourceForeground': accent,
    'gitDecoration.renamedResourceForeground': termCyan,
    'gitDecoration.stageDeletedResourceForeground': termRed,
    'gitDecoration.stageModifiedResourceForeground': accent,
    'gitDecoration.submoduleResourceForeground': termBlue,
    'gitDecoration.untrackedResourceForeground': termGreen,

    // ── Source Control ────────────────────────────────────────────────────
    'scm.providerBorder': '#00000000',

    // ── Terminal ────────────────────────────────────────────────────────
    'terminal.background': bg0,
    'terminal.foreground': fg0,
    'terminal.dropBackground': alpha(accent, 0.10),
    'terminal.findMatchBackground': alpha(accentBright, 0.40),
    'terminal.findMatchBorder': '#00000000',
    'terminal.findMatchHighlightBackground': alpha(accent, 0.20),
    'terminal.findMatchHighlightBorder': '#00000000',
    'terminal.inactiveSelectionBackground': alpha(accent, 0.14),
    'terminal.selectionBackground': alpha(accent, 0.28),
    'terminal.selectionForeground': fg0,
    'terminal.tab.activeBorder': '#00000000', // Removed terminal tab border
    'terminal.ansiBlack': termBlack,
    'terminal.ansiBrightBlack': fg2,
    'terminal.ansiRed': termRed,
    'terminal.ansiBrightRed': chroma(termRed).brighten(0.5).hex(),
    'terminal.ansiGreen': termGreen,
    'terminal.ansiBrightGreen': chroma(termGreen).brighten(0.5).hex(),
    'terminal.ansiYellow': termYellow,
    'terminal.ansiBrightYellow': chroma(termYellow).brighten(0.4).hex(),
    'terminal.ansiBlue': termBlue,
    'terminal.ansiBrightBlue': chroma(termBlue).brighten(0.5).hex(),
    'terminal.ansiMagenta': termMagenta,
    'terminal.ansiBrightMagenta': chroma(termMagenta).brighten(0.5).hex(),
    'terminal.ansiCyan': termCyan,
    'terminal.ansiBrightCyan': chroma(termCyan).brighten(0.5).hex(),
    'terminal.ansiWhite': fg1,
    'terminal.ansiBrightWhite': termWhite,
    'terminalCommandDecoration.defaultBackground': termBlue,
    'terminalCommandDecoration.successBackground': termGreen,
    'terminalCommandDecoration.errorBackground': termRed,
    'terminalCommandGuide.foreground': alpha(fg2, 0.70),
    'terminalCursor.foreground': accentBright,
    'terminalCursor.background': bg0,
    'terminalOverviewRuler.cursorForeground': accentBright,
    'terminalOverviewRuler.findMatchForeground': alpha(accentBright, 0.70),
    'terminalStickyScroll.background': bg1,
    'terminalStickyScrollHover.background': bg2,

    // ── Debug ────────────────────────────────────────────────────────────
    'debugToolBar.background': bg2,
    'debugToolBar.border': '#00000000',
    'editor.stackFrameHighlightBackground': alpha(termYellow, 0.14),
    'editor.focusedStackFrameHighlightBackground': alpha(termGreen, 0.14),
    'debugView.exceptionLabelBackground': alpha(termRed, 0.20),
    'debugView.exceptionLabelForeground': termRed,
    'debugView.stateLabelBackground': alpha(accent, 0.18),
    'debugView.stateLabelForeground': fg0,
    'debugView.valueChangedHighlight': accentBright,
    'debugTokenExpression.name': synAttr,
    'debugTokenExpression.value': synString,
    'debugTokenExpression.string': synString,
    'debugTokenExpression.boolean': p.synNumber,
    'debugTokenExpression.number': p.synNumber,
    'debugTokenExpression.error': termRed,
    'debugConsole.infoForeground': fg1,
    'debugConsole.warningForeground': termYellow,
    'debugConsole.errorForeground': termRed,
    'debugConsole.sourceForeground': accent,
    'debugConsoleInputIcon.foreground': accentBright,
    'debugIcon.breakpointForeground': termRed,
    'debugIcon.breakpointDisabledForeground': alpha(termRed, 0.45),
    'debugIcon.breakpointUnverifiedForeground': termYellow,
    'debugIcon.breakpointCurrentStackframeForeground': accentBright,
    'debugIcon.breakpointStackframeForeground': accent,
    'debugIcon.startForeground': termGreen,
    'debugIcon.pauseForeground': termYellow,
    'debugIcon.stopForeground': termRed,
    'debugIcon.disconnectForeground': termRed,
    'debugIcon.restartForeground': termGreen,
    'debugIcon.stepOverForeground': accent,
    'debugIcon.stepIntoForeground': accent,
    'debugIcon.stepOutForeground': accent,
    'debugIcon.continueForeground': termGreen,
    'debugIcon.stepBackForeground': accentDim,

    // ── Testing ──────────────────────────────────────────────────────────
    'testing.iconFailed': termRed,
    'testing.iconErrored': termRed,
    'testing.iconPassed': termGreen,
    'testing.runAction': termGreen,
    'testing.iconQueued': termYellow,
    'testing.iconUnset': fg2,
    'testing.iconSkipped': accentDim,
    'testing.peekBorder': '#00000000',
    'testing.peekHeaderBackground': bg2,
    'testing.message.error.decorationForeground': termRed,
    'testing.message.error.lineBackground': alpha(termRed, 0.10),
    'testing.message.info.decorationForeground': fg2,
    'testing.message.info.lineBackground': alpha(accent, 0.06),

    // ── Settings ──────────────────────────────────────────────────────────
    'settings.headerForeground': accentBright,
    'settings.headerBorder': '#00000000',
    'settings.modifiedItemIndicator': accent,
    'settings.dropdownBackground': dropBg,
    'settings.dropdownForeground': fg0,
    'settings.dropdownBorder': '#00000000',
    'settings.dropdownListBorder': '#00000000',
    'settings.checkboxBackground': inputBg,
    'settings.checkboxForeground': fg0,
    'settings.checkboxBorder': '#00000000',
    'settings.rowHoverBackground': alpha(accent, 0.06),
    'settings.textInputBackground': inputBg,
    'settings.textInputForeground': fg0,
    'settings.textInputBorder': '#00000000',
    'settings.numberInputBackground': inputBg,
    'settings.numberInputForeground': fg0,
    'settings.numberInputBorder': '#00000000',
    'settings.focusedRowBackground': alpha(accent, 0.08),
    'settings.focusedRowBorder': '#00000000',
    'settings.sashBorder': '#00000000',

    // ── Editor — Extended ────────────────────────────────────────────────
    'editorBracketMatch.background': alpha(accent, 0.15),
    'editorBracketMatch.border': '#00000000',
    'editorBracketHighlight.foreground1': accent,
    'editorBracketHighlight.foreground2': synFunc,
    'editorBracketHighlight.foreground3': synType,
    'editorBracketHighlight.foreground4': p.synNumber,
    'editorBracketHighlight.foreground5': synString,
    'editorBracketHighlight.foreground6': synKeyword,
    'editorBracketHighlight.unexpectedBracket.foreground': termRed,
    'editorBracketPairGuide.activeBackground1': alpha(accent, 0.30),
    'editorBracketPairGuide.activeBackground2': alpha(synFunc, 0.30),
    'editorBracketPairGuide.activeBackground3': alpha(synType, 0.30),
    'editorBracketPairGuide.activeBackground4': alpha(p.synNumber, 0.30),
    'editorBracketPairGuide.activeBackground5': alpha(synString, 0.30),
    'editorBracketPairGuide.activeBackground6': alpha(synKeyword, 0.30),
    'editorBracketPairGuide.background1': alpha(accent, 0.10),
    'editorBracketPairGuide.background2': alpha(synFunc, 0.10),
    'editorBracketPairGuide.background3': alpha(synType, 0.10),
    'editorBracketPairGuide.background4': alpha(p.synNumber, 0.10),
    'editorBracketPairGuide.background5': alpha(synString, 0.10),
    'editorBracketPairGuide.background6': alpha(synKeyword, 0.10),
    'editorCodeLens.foreground': fg2,
    'editorError.foreground': termRed,
    'editorError.border': '#00000000',
    'editorError.background': alpha(termRed, 0.08),
    'editorWarning.foreground': termYellow,
    'editorWarning.border': '#00000000',
    'editorWarning.background': alpha(termYellow, 0.06),
    'editorInfo.foreground': termBlue,
    'editorInfo.border': '#00000000',
    'editorInfo.background': alpha(termBlue, 0.06),
    'editorHint.foreground': accent,
    'editorHint.border': '#00000000',
    'editorGhostText.foreground': alpha(fg0, 0.45),
    'editorGhostText.background': alpha(bg2, 0.25),
    'editorGhostText.border': '#00000000',
    'editorInlayHint.foreground': alpha(fg0, 0.70),
    'editorInlayHint.background': alpha(bg2, 0.50),
    'editorInlayHint.parameterForeground': alpha(fg0, 0.80),
    'editorInlayHint.parameterBackground': alpha(bg2, 0.55),
    'editorInlayHint.typeForeground': alpha(accent, 0.85),
    'editorInlayHint.typeBackground': alpha(bg2, 0.55),
    'editorLightBulb.foreground': termYellow,
    'editorLightBulbAutoFix.foreground': termGreen,
    'editorLightBulbAi.foreground': accentBright,
    'editorOverviewRuler.addedForeground': alpha(termGreen, 0.80),
    'editorOverviewRuler.deletedForeground': alpha(termRed, 0.80),
    'editorOverviewRuler.modifiedForeground': alpha(accent, 0.80),
    'editorOverviewRuler.errorForeground': termRed,
    'editorOverviewRuler.warningForeground': termYellow,
    'editorOverviewRuler.infoForeground': termBlue,
    'editorOverviewRuler.bracketMatchForeground': alpha(accent, 0.55),
    'editorOverviewRuler.border': '#00000000',
    'editorOverviewRuler.findMatchForeground': alpha(accentBright, 0.55),
    'editorOverviewRuler.rangeHighlightForeground': alpha(accent, 0.35),
    'editorOverviewRuler.selectionHighlightForeground': alpha(accent, 0.45),
    'editorOverviewRuler.wordHighlightForeground': alpha(accent, 0.45),
    'editorOverviewRuler.wordHighlightStrongForeground': alpha(accent, 0.65),
    'editorOverviewRuler.wordHighlightTextForeground': alpha(accent, 0.35),
    'editorOverviewRuler.currentContentForeground': alpha(termGreen, 0.55),
    'editorOverviewRuler.incomingContentForeground': alpha(termBlue, 0.55),
    'editorStickyScroll.background': bg0,
    'editorStickyScroll.border': '#00000000',
    'editorStickyScroll.shadow': shadow,
    'editorStickyScrollHover.background': bg2,
    'editorUnnecessaryCode.border': '#00000000',
    'editorUnnecessaryCode.opacity': alpha(fg0, 0.30),

    // ── Inline Chat ───────────────────────────────────────────────────────
    'inlineChat.background': bg2,
    'inlineChat.foreground': fg0,
    'inlineChat.border': '#00000000',
    'inlineChat.shadow': shadow,
    'inlineChatInput.background': inputBg,
    'inlineChatInput.border': '#00000000',
    'inlineChatInput.focusBorder': '#00000000',
    'inlineChatInput.placeholderForeground': fg2,
    'inlineChatDiff.inserted': alpha(termGreen, 0.12),
    'inlineChatDiff.removed': alpha(termRed, 0.12),

    // ── Minimap Gutter ────────────────────────────────────────────────────
    'minimapGutter.addedBackground': alpha(termGreen, 0.80),
    'minimapGutter.deletedBackground': alpha(termRed, 0.80),
    'minimapGutter.modifiedBackground': alpha(accent, 0.80),

    // ─ Problems ──────────────────────────────────────────────────────────
    'problemsErrorIcon.foreground': termRed,
    'problemsWarningIcon.foreground': termYellow,
    'problemsInfoIcon.foreground': termBlue,

    // ── Welcome Page ─────────────────────────────────────────────────────
    'welcomePage.background': bg0,
    'welcomePage.buttonBackground': bg2,
    'welcomePage.buttonHoverBackground': alpha(accent, 0.12),
    'welcomePage.progress.background': bg3,
    'welcomePage.progress.foreground': buttonAccent,
    'welcomePage.tileBackground': bg1,
    'welcomePage.tileHoverBackground': bg2,
    'welcomePage.tileBorder': '#00000000',
    'walkThrough.embeddedEditorBackground': bg1,
    'walkthrough.stepTitle.foreground': accentBright,

    // ─ Chat ──────────────────────────────────────────────────────────────
    'chat.requestBackground': alpha(accent, 0.06),
    'chat.requestBorder': '#00000000',
    'chat.slashCommandBackground': alpha(accent, 0.14),
    'chat.slashCommandForeground': accentBright,
    'chat.avatarBackground': alpha(accent, 0.18),
    'chat.avatarForeground': fg0,

    // ─ Extension ───────────────────────────────────────────────────────
    'extensionButton.prominentBackground': buttonAccent,
    'extensionButton.prominentForeground': '#ffffff',
    'extensionButton.prominentHoverBackground': accentDim,
    'extensionButton.background': alpha(accent, 0.20),
    'extensionButton.foreground': fg0,
    'extensionButton.hoverBackground': alpha(accent, 0.30),
    'extensionButton.separator': '#00000000',
    'extensionBadge.remoteBackground': buttonAccent,
    'extensionBadge.remoteForeground': '#ffffff',
    'extensionIcon.starForeground': termYellow,
    'extensionIcon.verifiedForeground': termGreen,
    'extensionIcon.preReleaseForeground': accentBright,
    'extensionIcon.sponsorForeground': termMagenta,

    // ── Ports ─────────────────────────────────────────────────────────────
    'ports.iconRunningProcessForeground': termGreen,

    // ── Contast ───────────────────────────────────────────────────────────
    'contrastBorder': '#00000000',
    'contrastActiveBorder': '#00000000',

    // ── Sash ──────────────────────────────────────────────────────────────
    'sash.hoverBorder': '#00000000',

    // ── Profiles ──────────────────────────────────────────────────────────
    'profileBadge.background': buttonAccent,
    'profileBadge.foreground': '#ffffff',

    // ─ Notebook ──────────────────────────────────────────────────────────
    'notebook.editorBackground': bg0,
    'notebook.cellBackground': bg0,
    'notebook.cellBorderColor': '#00000000',
    'notebook.cellEditorBackground': bg1,
    'notebook.cellHoverBackground': alpha(accent, 0.05),
    'notebook.cellInsertionIndicator': accentBright,
    'notebook.cellStatusBarItemHoverBackground': alpha(accent, 0.10),
    'notebook.cellToolbarSeparator': '#00000000',
    'notebook.cellActiveEditorIndicator': accentBright,
    'notebook.focusedEditorBorder': '#00000000',
    'notebook.focusedCellBackground': alpha(accent, 0.08),
    'notebook.focusedCellBorder': '#00000000',
    'notebook.focusedRowBorder': '#00000000',
    'notebook.inactiveFocusedCellBorder': '#00000000',
    'notebook.inactiveSelectedCellBorder': '#00000000',
    'notebook.outputContainerBackgroundColor': bg1,
    'notebook.outputContainerBorderColor': '#00000000',
    'notebook.rowHoverBackground': alpha(accent, 0.04),
    'notebook.selectedCellBackground': alpha(accent, 0.10),
    'notebook.selectedCellBorder': '#00000000',
    'notebook.selectedRangeBackground': alpha(accent, 0.14),
    'notebook.symbolHighlightBackground': alpha(accent, 0.12),
    'notebookScrollbarSlider.activeBackground': alpha(accent, 0.55),
    'notebookScrollbarSlider.background': alpha(fg2, 0.18),
    'notebookScrollbarSlider.hoverBackground': alpha(accent, 0.38),
    'notebookStatusErrorIcon.foreground': termRed,
    'notebookStatusRunningIcon.foreground': accent,
    'notebookStatusSuccessIcon.foreground': termGreen,
    'notebookEditorOverviewRuler.runningCellForeground': accent,
  };
}

// ── token colors ─────────────────────────────────────────────────────────────

function buildTokenColors(p) {
  const {
    synKeyword, synFunc, synString, synType, synNumber,
    synComment, synVar, synPunct, synTag, synAttr, fg0,
    termRed,
  } = p;

  return [
    {
      name: 'Comment',
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: synComment, fontStyle: 'italic' }
    },

    {
      name: 'String',
      scope: ['string', 'string.quoted', 'string.template'],
      settings: { foreground: synString }
    },

    {
      name: 'String escape / regexp',
      scope: ['constant.character.escape', 'string.regexp'],
      settings: { foreground: synNumber }
    },

    {
      name: 'Number',
      scope: ['constant.numeric'],
      settings: { foreground: synNumber }
    },

    {
      name: 'Language constant',
      scope: ['constant.language'],
      settings: { foreground: synNumber, fontStyle: 'italic' }
    },

    {
      name: 'Keyword',
      scope: ['keyword', 'keyword.control'],
      settings: { foreground: synKeyword }
    },

    {
      name: 'Storage type',
      scope: ['storage.type'],
      settings: { foreground: synKeyword, fontStyle: 'italic' }
    },

    {
      name: 'Storage modifier',
      scope: ['storage.modifier'],
      settings: { foreground: synKeyword }
    },

    {
      name: 'Operator',
      scope: ['keyword.operator'],
      settings: { foreground: synPunct }
    },

    {
      name: 'Punctuation',
      scope: ['punctuation.separator', 'punctuation.accessor',
        'punctuation.definition.bracket'],
      settings: { foreground: synPunct }
    },

    {
      name: 'Function name',
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: { foreground: synFunc }
    },

    {
      name: 'Function call',
      scope: ['meta.function-call entity.name.function'],
      settings: { foreground: synFunc }
    },

    {
      name: 'Function parameter',
      scope: ['variable.parameter'],
      settings: { foreground: synVar, fontStyle: 'italic' }
    },

    {
      name: 'Type / Class',
      scope: ['entity.name.type', 'entity.name.class', 'entity.name.interface',
        'support.type', 'support.class',
        'entity.other.inherited-class'],
      settings: { foreground: synType }
    },

    {
      name: 'Variable',
      scope: ['variable', 'variable.other'],
      settings: { foreground: synVar }
    },

    {
      name: 'Variable — language (this, self)',
      scope: ['variable.language'],
      settings: { foreground: synKeyword, fontStyle: 'italic' }
    },

    {
      name: 'HTML / JSX tag name',
      scope: ['entity.name.tag'],
      settings: { foreground: synTag }
    },

    {
      name: 'HTML / JSX attribute',
      scope: ['entity.other.attribute-name'],
      settings: { foreground: synAttr }
    },

    {
      name: 'Markdown heading',
      scope: ['markup.heading', 'entity.name.section'],
      settings: { foreground: synKeyword, fontStyle: 'bold' }
    },

    {
      name: 'Markdown bold',
      scope: ['markup.bold'],
      settings: { foreground: fg0, fontStyle: 'bold' }
    },

    {
      name: 'Markdown italic',
      scope: ['markup.italic'],
      settings: { foreground: fg0, fontStyle: 'italic' }
    },

    {
      name: 'Markdown inline code',
      scope: ['markup.inline.raw'],
      settings: { foreground: synString }
    },

    {
      name: 'Markdown link',
      scope: ['string.other.link', 'markup.underline.link'],
      settings: { foreground: synFunc }
    },

    {
      name: 'CSS property name',
      scope: ['support.type.property-name.css'],
      settings: { foreground: synAttr }
    },

    {
      name: 'CSS value',
      scope: ['support.property-value.css', 'constant.other.color'],
      settings: { foreground: synNumber }
    },

    {
      name: 'CSS selector',
      scope: ['entity.other.attribute-name.class',
        'entity.other.attribute-name.id'],
      settings: { foreground: synFunc }
    },

    {
      name: 'JSON key',
      scope: ['support.type.property-name.json'],
      settings: { foreground: synAttr }
    },

    {
      name: 'Import / module path',
      scope: ['string.quoted.double.import', 'string.quoted.single.import'],
      settings: { foreground: synString, fontStyle: 'italic' }
    },

    {
      name: 'JSON source',
      scope: ['source.json', 'meta.structure.dictionary.json'],
      settings: { foreground: synString }
    },

    {
      name: 'JSON keys',
      scope: ['meta.structure.dictionary.key.json', 'string.key.json'],
      settings: { foreground: synAttr, fontStyle: 'bold' }
    },

    {
      name: 'JSON values',
      scope: ['meta.structure.dictionary.value.json', 'string.quoted.double.json',
        'constant.numeric.json', 'constant.language.json', 'variable.other.json'],
      settings: { foreground: synString }
    },

    {
      name: 'JSON punctuation',
      scope: ['punctuation.definition.string.begin.json',
        'punctuation.definition.string.end.json'],
      settings: { foreground: synString }
    },

    {
      name: 'TSX source',
      scope: ['source.tsx', 'meta.tag.tsx', 'meta.embedded.block.tsx',
        'entity.name.tag.tsx', 'meta.jsx.children'],
      settings: { foreground: synTag }
    },

    {
      name: 'TSX punctuation',
      scope: ['punctuation.definition.tag.tsx'],
      settings: { foreground: synPunct }
    },

    {
      name: 'Constant',
      scope: ['constant', 'constant.other', 'entity.name.constant'],
      settings: { foreground: synNumber }
    },

    {
      name: 'Boolean / null',
      scope: ['constant.language.boolean', 'constant.language.null'],
      settings: { foreground: synNumber, fontStyle: 'italic' }
    },

    {
      name: 'Variable extended',
      scope: ['variable.other.readwrite', 'variable.object.property',
        'support.variable', 'variable.other.json'],
      settings: { foreground: synVar }
    },

    {
      name: 'Variable function',
      scope: ['variable.function'],
      settings: { foreground: synFunc }
    },

    {
      name: 'Punctuation extended',
      scope: ['punctuation', 'meta.brace', 'meta.bracket', 'meta.delimiter',
        'punctuation.definition.string'],
      settings: { foreground: synPunct }
    },

    {
      name: 'Invalid',
      scope: ['invalid', 'invalid.illegal'],
      settings: { foreground: termRed, fontStyle: 'underline' }
    },

    {
      name: 'String key',
      scope: ['string.key'],
      settings: { foreground: synAttr }
    },

    {
      name: 'Source / text',
      scope: ['source', 'text'],
      settings: { foreground: fg0 }
    },

    {
      name: 'Decorator / annotation',
      scope: ['meta.decorator', 'punctuation.decorator',
        'storage.type.annotation'],
      settings: { foreground: p.accent, fontStyle: 'italic' }
    },

    {
      name: 'Template expression',
      scope: ['punctuation.definition.template-expression',
        'punctuation.section.embedded'],
      settings: { foreground: synPunct }
    },

    {
      name: 'Shell — built-in command',
      scope: ['support.function.builtin.shell'],
      settings: { foreground: synKeyword }
    },

    {
      name: 'Shell — variable',
      scope: ['variable.other.normal.shell'],
      settings: { foreground: synVar }
    },

    {
      name: 'YAML key',
      scope: ['entity.name.tag.yaml'],
      settings: { foreground: synAttr }
    },

    {
      name: 'TOML key',
      scope: ['keyword.key.toml'],
      settings: { foreground: synAttr }
    },

    {
      name: 'Diff — inserted',
      scope: ['markup.inserted'],
      settings: { foreground: p.termGreen }
    },

    {
      name: 'Diff — deleted',
      scope: ['markup.deleted'],
      settings: { foreground: termRed }
    },

    {
      name: 'Diff — changed',
      scope: ['markup.changed'],
      settings: { foreground: p.termYellow }
    },

    {
      name: 'Markup quote',
      scope: ['markup.quote'],
      settings: { foreground: synComment, fontStyle: 'italic' }
    },

    {
      name: 'Markup raw block',
      scope: ['markup.raw.block'],
      settings: { foreground: synString }
    },
  ];
}

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * @param {string}  displayName  Theme label shown in VS Code picker
 * @param {string}  baseHex      User-chosen hex colour, e.g. "#4a9eff"
 * @param {boolean} isDark
 * @returns {object} VS Code color theme JSON (ready to JSON.stringify)
 */
function generateThemeJson(displayName, baseHex, isDark) {
  if (!chroma.valid(baseHex)) {
    throw new Error(`Invalid colour: "${baseHex}". Must be a valid hex like #4a9eff.`);
  }

  const p = buildPalette(baseHex, isDark);
  const colors = buildColors(p);
  const tokenColors = buildTokenColors(p);

  return {
    name: displayName,
    type: isDark ? 'dark' : 'light',
    colors,
    tokenColors,
    semanticHighlighting: true,
    semanticTokenColors: {
      'class': { foreground: p.synType },
      'interface': { foreground: p.synType, fontStyle: 'italic' },
      'enum': { foreground: p.synType },
      'enumMember': { foreground: p.synNumber },
      'function': { foreground: p.synFunc },
      'method': { foreground: p.synFunc },
      'property': { foreground: p.synAttr },
      'property.readonly': { foreground: p.synNumber },
      'variable': { foreground: p.synVar },
      'variable.readonly': { foreground: p.synNumber },
      'variable.defaultLibrary': { foreground: p.synKeyword },
      'parameter': { foreground: p.synVar, fontStyle: 'italic' },
      'type': { foreground: p.synType },
      'typeAlias': { foreground: p.synType, fontStyle: 'italic' },
      'namespace': { foreground: p.synType, fontStyle: 'italic' },
      'keyword': { foreground: p.synKeyword },
      'string': { foreground: p.synString },
      'number': { foreground: p.synNumber },
      'comment': { foreground: p.synComment, fontStyle: 'italic' },
      'decorator': { foreground: p.accent, fontStyle: 'italic' },
      'macro': { foreground: p.synKeyword },
      'selfKeyword': { foreground: p.synKeyword, fontStyle: 'italic' },
      'label': { foreground: p.synAttr },
      'event': { foreground: p.accent },
      'modifier': { foreground: p.synKeyword },
      'regexp': { foreground: p.synNumber },
      'operator': { foreground: p.synPunct },
      'struct': { foreground: p.synType },
      'builtinType': { foreground: p.synType, fontStyle: 'italic' },
      'lifetime': { foreground: p.accent, fontStyle: 'italic' },
      'generic': { foreground: p.synType },
    },
  };
}

module.exports = { generateThemeJson };