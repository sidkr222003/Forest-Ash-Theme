'use strict';

/**
 * themeGenerator.js  –  Forest Ash Dynamic Theme Generator
 * ──────────────────────────────────────────────────────────
 *
 * DESIGN PRINCIPLE
 * ════════════════
 * We extract ONLY the hue from the user's chosen colour and apply
 * Forest-Ash–calibrated saturation + lightness to every role.
 * This guarantees readable contrast regardless of how dark/bright
 * or saturated the user's input colour is.
 *
 * Reverse-engineered from the Forest Ash default dark/light themes:
 *
 *   Dark  BG    : hsl(H,  8%, 10-18%)   FG    : hsl(H,  8%, 82%)
 *   Dark  synKw : hsl(H, 28%, 60%)      synSt : hsl(H+40, 48%, 58%)
 *   Dark  synFn : hsl(H+200, 28%, 60%)  synTp : hsl(H+290, 28%, 62%)
 *   Light BG    : hsl(H, 12%, 96-87%)   FG    : hsl(H, 15%, 18%)
 */

const chroma = require('chroma-js');

// ─── low-level helpers ────────────────────────────────────────────────────────

/**
 * Build a colour from hue°, saturation (0-100), lightness (0-100).
 * Hue wraps, S and L are clamped automatically.
 */
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

/** Extract hue degrees (0-360) from any chroma-valid colour. */
function hueOf(hex) {
  const [h] = chroma(hex).hsl();
  return isNaN(h) ? 0 : h; // achromatic greys → treat as 0°
}

// ─── Forest Ash palette builder ───────────────────────────────────────────────

/**
 * Builds the full palette from a single hue-seed and variant flag.
 *
 * Hue offsets mirror Forest Ash's split-complementary triad:
 *   keyword  → base hue       (sage-green family when H≈100°)
 *   string   → H + 40°        (warm amber-ochre family)
 *   function → H + 200°       (cool muted-blue family)
 *   type     → H + 290°       (muted rose/violet family)
 *   number   → H + 55°        (warm golden family)
 */
function buildPalette(baseHex, isDark) {
  const H = hueOf(baseHex);

  if (isDark) {
    // ── backgrounds ───────────────────────────────────────────────────────
    const bg0 = hsl(H,  8, 10);   // editor bg
    const bg1 = hsl(H,  8, 12);   // sidebar / activity bar
    const bg2 = hsl(H,  7, 15);   // panels / dropdowns / widgets
    const bg3 = hsl(H,  7, 18);   // hover list items
    const bg4 = hsl(H,  9, 14);   // highlighted line

    // ── foregrounds ───────────────────────────────────────────────────────
    const fg0 = hsl(H,  9, 82);   // primary text  — warm cream
    const fg1 = hsl(H,  7, 65);   // secondary
    const fg2 = hsl(H,  5, 44);   // comments / placeholders / disabled

    // ── accent (UI chrome, active borders, badges) ─────────────────────────
    const accent       = hsl(H,      44, 62);
    const accentBright = hsl(H,      50, 68);
    const accentDim    = hsl(H,      38, 55);
    const accentFaint  = alpha(accent, 0.15);

    // ── syntax tokens ─────────────────────────────────────────────────────
    const synKeyword  = hsl(H,       28, 60);   // base hue
    const synFunc     = hsl(H + 200, 28, 62);   // cool blue
    const synString   = hsl(H +  40, 48, 58);   // warm amber
    const synType     = hsl(H + 290, 28, 64);   // muted rose
    const synNumber   = hsl(H +  55, 42, 64);   // warm gold
    const synComment  = hsl(H,       10, 40);   // desaturated dim
    const synVar      = hsl(H,        8, 76);   // near-fg
    const synPunct    = hsl(H,        7, 60);   // delimiter
    const synTag      = hsl(H +  15,  32, 62);  // warm tag
    const synAttr     = hsl(H -  15,  30, 64);  // cool attr

    // ── terminal ANSI ─────────────────────────────────────────────────────
    const termBlack   = bg1;
    const termRed     = hsl(H +   0,  55, 58);
    const termGreen   = hsl(H + 100,  45, 56);
    const termYellow  = hsl(H +  50,  55, 60);
    const termBlue    = hsl(H + 220,  45, 60);
    const termMagenta = hsl(H + 280,  40, 60);
    const termCyan    = hsl(H + 170,  42, 58);
    const termWhite   = fg0;

    return {
      isDark,
      bg0, bg1, bg2, bg3, bg4,
      fg0, fg1, fg2,
      accent, accentBright, accentDim, accentFaint,
      synKeyword, synFunc, synString, synType, synNumber,
      synComment, synVar, synPunct, synTag, synAttr,
      termBlack, termRed, termGreen, termYellow,
      termBlue, termMagenta, termCyan, termWhite,
    };

  } else {
    // ══════════════════════════════════════════════════════
    //  LIGHT variant  (paper-like Forest Ash style)
    // ══════════════════════════════════════════════════════

    const bg0 = hsl(H, 14, 96);
    const bg1 = hsl(H, 12, 93);
    const bg2 = hsl(H, 10, 90);
    const bg3 = hsl(H,  9, 87);
    const bg4 = hsl(H, 16, 92);

    const fg0 = hsl(H, 18, 18);
    const fg1 = hsl(H, 14, 34);
    const fg2 = hsl(H,  9, 52);

    const accent       = hsl(H,      50, 42);
    const accentBright = hsl(H,      55, 38);
    const accentDim    = hsl(H,      42, 48);
    const accentFaint  = alpha(accent, 0.12);

    const synKeyword   = hsl(H,       38, 38);
    const synFunc      = hsl(H + 200, 38, 38);
    const synString    = hsl(H +  40, 52, 36);
    const synType      = hsl(H + 290, 35, 40);
    const synNumber    = hsl(H +  55, 46, 36);
    const synComment   = hsl(H,       12, 56);
    const synVar       = hsl(H,       16, 24);
    const synPunct     = hsl(H,       12, 42);
    const synTag       = hsl(H +  15,  40, 38);
    const synAttr      = hsl(H -  15,  36, 40);

    const termBlack   = fg0;
    const termRed     = hsl(H +   0,  52, 38);
    const termGreen   = hsl(H + 100,  42, 36);
    const termYellow  = hsl(H +  50,  52, 36);
    const termBlue    = hsl(H + 220,  42, 38);
    const termMagenta = hsl(H + 280,  38, 38);
    const termCyan    = hsl(H + 170,  40, 36);
    const termWhite   = bg0;

    return {
      isDark,
      bg0, bg1, bg2, bg3, bg4,
      fg0, fg1, fg2,
      accent, accentBright, accentDim, accentFaint,
      synKeyword, synFunc, synString, synType, synNumber,
      synComment, synVar, synPunct, synTag, synAttr,
      termBlack, termRed, termGreen, termYellow,
      termBlue, termMagenta, termCyan, termWhite,
    };
  }
}

// ─── VS Code workbench colors ─────────────────────────────────────────────────

function buildColors(p) {
  const {
    isDark,
    bg0, bg1, bg2, bg3, bg4,
    fg0, fg1, fg2,
    accent, accentBright, accentDim,
    termRed, termGreen, termYellow, termBlue,
    termMagenta, termCyan, termBlack, termWhite,
    synKeyword, synFunc, synString, synType,
    synComment, synAttr,
  } = p;

  const border  = isDark ? alpha(fg2, 0.25) : alpha(fg2, 0.30);
  const shadow  = alpha('#000000', isDark ? 0.45 : 0.12);
  const inputBg = isDark ? bg2 : alpha(bg0, 0.90);
  const dropBg  = bg2;

  return {
    // ── Base ──────────────────────────────────────────────────────────────
    'focusBorder':                          alpha(accent, 0.70),
    'foreground':                           fg0,
    'disabledForeground':                   fg2,
    'widget.shadow':                        shadow,
    'selection.background':                 alpha(accent, 0.30),
    'descriptionForeground':                fg1,
    'errorForeground':                      termRed,
    'icon.foreground':                      fg1,

    // ── Text ──────────────────────────────────────────────────────────────
    'textBlockQuote.background':            bg2,
    'textBlockQuote.border':                accent,
    'textCodeBlock.background':             bg2,
    'textLink.activeForeground':            accentBright,
    'textLink.foreground':                  accent,
    'textPreformat.foreground':             fg0,
    'textSeparator.foreground':             border,

    // ── Toolbar ───────────────────────────────────────────────────────────
    'toolbar.hoverBackground':              alpha(accent, 0.10),
    'toolbar.activeBackground':             alpha(accent, 0.18),

    // ── Button ────────────────────────────────────────────────────────────
    'button.background':                    accentBright,
    'button.foreground':                    '#ffffff',
    'button.hoverBackground':               accentDim,
    'button.secondaryBackground':           bg3,
    'button.secondaryForeground':           fg0,
    'button.secondaryHoverBackground':      bg2,

    // ── Checkbox ──────────────────────────────────────────────────────────
    'checkbox.background':                  inputBg,
    'checkbox.foreground':                  fg0,
    'checkbox.border':                      border,

    // ── Dropdown ──────────────────────────────────────────────────────────
    'dropdown.background':                  dropBg,
    'dropdown.listBackground':              dropBg,
    'dropdown.border':                      border,
    'dropdown.foreground':                  fg0,

    // ── Input ─────────────────────────────────────────────────────────────
    'input.background':                     inputBg,
    'input.border':                         border,
    'input.foreground':                     fg0,
    'input.placeholderForeground':          fg2,
    'inputOption.activeBackground':         alpha(accent, 0.22),
    'inputOption.activeBorder':             accent,
    'inputOption.activeForeground':         accentBright,
    'inputValidation.errorBackground':      alpha(termRed,    isDark ? 0.22 : 0.10),
    'inputValidation.errorBorder':          termRed,
    'inputValidation.errorForeground':      fg0,
    'inputValidation.warningBackground':    alpha(termYellow, 0.18),
    'inputValidation.warningBorder':        termYellow,
    'inputValidation.infoBackground':       alpha(accent, 0.18),
    'inputValidation.infoBorder':           accent,

    // ── Scrollbar ─────────────────────────────────────────────────────────
    'scrollbar.shadow':                     shadow,
    'scrollbarSlider.activeBackground':     alpha(accent, 0.55),
    'scrollbarSlider.background':           alpha(fg2, 0.18),
    'scrollbarSlider.hoverBackground':      alpha(accent, 0.38),

    // ── Badge ─────────────────────────────────────────────────────────────
    'badge.background':                     accentBright,
    'badge.foreground':                     '#ffffff',
    'progressBar.background':               accentBright,

    // ── List / Tree ───────────────────────────────────────────────────────
    'list.activeSelectionBackground':       alpha(accent, 0.24),
    'list.activeSelectionForeground':       fg0,
    'list.dropBackground':                  alpha(accent, 0.14),
    'list.focusBackground':                 alpha(accent, 0.18),
    'list.focusForeground':                 fg0,
    'list.highlightForeground':             accentBright,
    'list.hoverBackground':                 alpha(accent, 0.10),
    'list.hoverForeground':                 fg0,
    'list.inactiveSelectionBackground':     alpha(accent, 0.14),
    'list.inactiveSelectionForeground':     fg0,
    'list.errorForeground':                 termRed,
    'list.warningForeground':               termYellow,
    'listFilterWidget.background':          dropBg,
    'listFilterWidget.outline':             accent,
    'listFilterWidget.noMatchesOutline':    termRed,
    'tree.indentGuidesStroke':              alpha(accent, 0.28),

    // ── Activity Bar ──────────────────────────────────────────────────────
    'activityBar.background':               bg1,
    'activityBar.border':                   border,
    'activityBar.foreground':               fg0,
    'activityBar.inactiveForeground':       fg2,
    'activityBar.dropBorder':               accent,
    'activityBarBadge.background':          accentBright,
    'activityBarBadge.foreground':          '#ffffff',

    // ── Side Bar ──────────────────────────────────────────────────────────
    'sideBar.background':                   bg1,
    'sideBar.foreground':                   fg0,
    'sideBar.border':                       border,
    'sideBarTitle.foreground':              fg0,
    'sideBarSectionHeader.background':      bg2,
    'sideBarSectionHeader.foreground':      fg1,
    'sideBarSectionHeader.border':          border,

    // ── Minimap ───────────────────────────────────────────────────────────
    'minimap.findMatchHighlight':           alpha(accentBright, 0.60),
    'minimap.selectionHighlight':           alpha(accent, 0.40),
    'minimap.errorHighlight':               termRed,
    'minimap.warningHighlight':             termYellow,
    'minimap.background':                   bg0,
    'minimapSlider.background':             alpha(fg2, 0.18),
    'minimapSlider.hoverBackground':        alpha(accent, 0.38),
    'minimapSlider.activeBackground':       alpha(accent, 0.55),

    // ── Editor Groups / Tabs ──────────────────────────────────────────────
    'editorGroup.border':                   border,
    'editorGroupHeader.tabsBackground':     bg1,
    'editorGroupHeader.tabsBorder':         border,
    'tab.activeBackground':                 bg0,
    'tab.activeForeground':                 fg0,
    'tab.border':                           border,
    'tab.activeBorder':                     bg0,
    'tab.activeBorderTop':                  accent,    // ← Forest Ash signature top accent bar
    'tab.inactiveBackground':               bg1,
    'tab.inactiveForeground':               fg2,
    'tab.hoverBackground':                  alpha(accent, 0.08),
    'tab.unfocusedActiveForeground':        fg1,
    'tab.unfocusedInactiveForeground':      fg2,
    'tab.lastPinnedBorder':                 alpha(accent, 0.40),

    // ── Editor ────────────────────────────────────────────────────────────
    'editor.background':                    bg0,
    'editor.foreground':                    fg0,
    'editorLineNumber.foreground':          fg2,
    'editorLineNumber.activeForeground':    fg1,
    'editorCursor.foreground':              accentBright,
    'editor.selectionBackground':           alpha(accent, 0.28),
    'editor.selectionHighlightBackground':  alpha(accent, 0.14),
    'editor.wordHighlightBackground':       alpha(accent, 0.16),
    'editor.wordHighlightStrongBackground': alpha(accent, 0.26),
    'editor.findMatchBackground':           alpha(accentBright, 0.38),
    'editor.findMatchHighlightBackground':  alpha(accent, 0.18),
    'editor.hoverHighlightBackground':      alpha(accent, 0.12),
    'editor.lineHighlightBackground':       bg4,
    'editorLink.activeForeground':          accentBright,
    'editor.rangeHighlightBackground':      alpha(accent, 0.08),
    'editorWhitespace.foreground':          alpha(fg2, 0.40),
    'editorIndentGuide.background':         alpha(fg2, 0.18),
    'editorIndentGuide.activeBackground':   alpha(accent, 0.38),
    'editorRuler.foreground':               alpha(fg2, 0.18),

    // ── Editor Widgets ────────────────────────────────────────────────────
    'editorWidget.background':              bg2,
    'editorWidget.border':                  border,
    'editorWidget.foreground':              fg0,
    'editorWidget.resizeBorder':            accent,
    'editorSuggestWidget.background':       bg2,
    'editorSuggestWidget.border':           border,
    'editorSuggestWidget.foreground':       fg0,
    'editorSuggestWidget.highlightForeground': accentBright,
    'editorSuggestWidget.selectedBackground':  alpha(accent, 0.22),
    'editorHoverWidget.background':         bg2,
    'editorHoverWidget.border':             border,
    'editorHoverWidget.foreground':         fg0,

    // ── Gutter ────────────────────────────────────────────────────────────
    'editorGutter.background':              bg0,
    'editorGutter.modifiedBackground':      alpha(accent, 0.80),
    'editorGutter.addedBackground':         alpha(termGreen, 0.80),
    'editorGutter.deletedBackground':       alpha(termRed, 0.80),

    // ── Diff Editor ───────────────────────────────────────────────────────
    'diffEditor.insertedTextBackground':    alpha(termGreen, 0.12),
    'diffEditor.removedTextBackground':     alpha(termRed,   0.12),
    'diffEditor.insertedLineBackground':    alpha(termGreen, 0.07),
    'diffEditor.removedLineBackground':     alpha(termRed,   0.07),

    // ── Peek View ─────────────────────────────────────────────────────────
    'peekView.border':                      accentDim,
    'peekViewEditor.background':            bg0,
    'peekViewEditor.matchHighlightBackground': alpha(accent, 0.26),
    'peekViewResult.background':            bg2,
    'peekViewResult.fileForeground':        fg0,
    'peekViewResult.lineForeground':        fg1,
    'peekViewResult.matchHighlightBackground': alpha(accent, 0.22),
    'peekViewResult.selectionBackground':   alpha(accent, 0.18),
    'peekViewResult.selectionForeground':   fg0,
    'peekViewTitle.background':             bg2,
    'peekViewTitleDescription.foreground':  fg1,
    'peekViewTitleLabel.foreground':        fg0,

    // ── Merge ─────────────────────────────────────────────────────────────
    'merge.currentHeaderBackground':        alpha(termGreen, 0.20),
    'merge.currentContentBackground':       alpha(termGreen, 0.08),
    'merge.incomingHeaderBackground':       alpha(termBlue,  0.20),
    'merge.incomingContentBackground':      alpha(termBlue,  0.08),

    // ── Panel ─────────────────────────────────────────────────────────────
    'panel.background':                     bg1,
    'panel.border':                         border,
    'panelTitle.activeBorder':              accent,
    'panelTitle.activeForeground':          fg0,
    'panelTitle.inactiveForeground':        fg2,

    // ── Status Bar ────────────────────────────────────────────────────────
    'statusBar.background':                 bg1,
    'statusBar.foreground':                 fg0,
    'statusBar.border':                     border,
    'statusBar.debuggingBackground':        accentDim,
    'statusBar.debuggingForeground':        '#ffffff',
    'statusBar.noFolderBackground':         bg2,
    'statusBar.noFolderForeground':         fg0,
    'statusBarItem.activeBackground':       alpha(accent, 0.28),
    'statusBarItem.hoverBackground':        alpha(accent, 0.14),
    'statusBarItem.prominentBackground':    accentBright,
    'statusBarItem.prominentForeground':    '#ffffff',
    'statusBarItem.remoteBackground':       accent,
    'statusBarItem.remoteForeground':       '#ffffff',

    // ── Title Bar ─────────────────────────────────────────────────────────
    'titleBar.activeBackground':            bg1,
    'titleBar.activeForeground':            fg0,
    'titleBar.border':                      border,
    'titleBar.inactiveBackground':          bg1,
    'titleBar.inactiveForeground':          fg2,

    // ── Notifications ─────────────────────────────────────────────────────
    'notifications.background':             bg2,
    'notifications.border':                 border,
    'notifications.foreground':             fg0,
    'notificationsErrorIcon.foreground':    termRed,
    'notificationsWarningIcon.foreground':  termYellow,
    'notificationsInfoIcon.foreground':     accent,

    // ── Quick Pick ────────────────────────────────────────────────────────
    'pickerGroup.border':                   border,
    'pickerGroup.foreground':               accentBright,
    'quickInput.background':                bg2,
    'quickInput.foreground':                fg0,
    'quickInputList.focusBackground':       alpha(accent, 0.22),

    // ── Keybinding Label ──────────────────────────────────────────────────
    'keybindingLabel.background':           alpha(accent, 0.12),
    'keybindingLabel.border':               border,
    'keybindingLabel.bottomBorder':         alpha(accent, 0.45),
    'keybindingLabel.foreground':           fg0,

    // ── Breadcrumb ────────────────────────────────────────────────────────
    'breadcrumb.activeSelectionForeground': accentBright,
    'breadcrumb.background':                bg0,
    'breadcrumb.focusForeground':           accent,
    'breadcrumb.foreground':                fg1,

    // ── Symbol Icons ──────────────────────────────────────────────────────
    'symbolIcon.classForeground':           synType,
    'symbolIcon.functionForeground':        synFunc,
    'symbolIcon.keywordForeground':         synKeyword,
    'symbolIcon.methodForeground':          synFunc,
    'symbolIcon.moduleForeground':          accent,
    'symbolIcon.stringForeground':          synString,
    'symbolIcon.variableForeground':        p.synVar,

    // ── Git Decoration ────────────────────────────────────────────────────
    'gitDecoration.addedResourceForeground':         termGreen,
    'gitDecoration.conflictingResourceForeground':   termYellow,
    'gitDecoration.deletedResourceForeground':       termRed,
    'gitDecoration.ignoredResourceForeground':       fg2,
    'gitDecoration.modifiedResourceForeground':      accent,
    'gitDecoration.stageDeletedResourceForeground':  termRed,
    'gitDecoration.stageModifiedResourceForeground': accent,
    'gitDecoration.untrackedResourceForeground':     termGreen,

    // ── Terminal ──────────────────────────────────────────────────────────
    'terminal.background':                  bg0,
    'terminal.border':                      border,
    'terminal.foreground':                  fg0,
    'terminal.ansiBlack':                   termBlack,
    'terminal.ansiBrightBlack':             fg2,
    'terminal.ansiRed':                     termRed,
    'terminal.ansiBrightRed':               chroma(termRed).brighten(0.5).hex(),
    'terminal.ansiGreen':                   termGreen,
    'terminal.ansiBrightGreen':             chroma(termGreen).brighten(0.5).hex(),
    'terminal.ansiYellow':                  termYellow,
    'terminal.ansiBrightYellow':            chroma(termYellow).brighten(0.4).hex(),
    'terminal.ansiBlue':                    termBlue,
    'terminal.ansiBrightBlue':              chroma(termBlue).brighten(0.5).hex(),
    'terminal.ansiMagenta':                 termMagenta,
    'terminal.ansiBrightMagenta':           chroma(termMagenta).brighten(0.5).hex(),
    'terminal.ansiCyan':                    termCyan,
    'terminal.ansiBrightCyan':              chroma(termCyan).brighten(0.5).hex(),
    'terminal.ansiWhite':                   fg1,
    'terminal.ansiBrightWhite':             termWhite,
    'terminal.selectionBackground':         alpha(accent, 0.28),
    'terminalCursor.foreground':            accentBright,

    // ── Debug ─────────────────────────────────────────────────────────────
    'debugToolBar.background':              bg2,
    'debugToolBar.border':                  border,
    'editor.stackFrameHighlightBackground': alpha(termYellow, 0.14),
    'editor.focusedStackFrameHighlightBackground': alpha(termGreen, 0.14),

    // ── Settings ──────────────────────────────────────────────────────────
    'settings.headerForeground':            accentBright,
    'settings.modifiedItemIndicator':       accent,
    'settings.dropdownBackground':          dropBg,
    'settings.dropdownBorder':              border,
    'settings.checkboxBackground':          inputBg,
    'settings.checkboxBorder':              border,
    'settings.textInputBackground':         inputBg,
    'settings.textInputBorder':             border,
    'settings.numberInputBackground':       inputBg,
    'settings.numberInputBorder':           border,

    // ── Missing Editor Keys ─────────────────────────────────────────────
    'editor.inactiveSelectionBackground':        alpha(accent, isDark ? 0.14 : 0.10),
    'editor.findRangeHighlightBackground':       alpha(accent, 0.08),
    'editor.lineHighlightBorder':                border,
    'editorBracketMatch.background':             alpha(accent, 0.15),
    'editorBracketMatch.border':                 accent,
    'editorCodeLens.foreground':                 fg2,
    'editorError.foreground':                    termRed,
    'editorWarning.foreground':                  termYellow,
    'editorInfo.foreground':                     termBlue,
    'editorHint.foreground':                     accent,
    'editorGhostText.foreground':                alpha(fg0, 0.45),
    'editorGhostText.background':                alpha(bg2, 0.25),
    'editorGhostText.border':                    alpha(accent, 0.25),
    'editorGroup.dropBackground':                alpha(accent, 0.12),
    'editorIndentGuide.background1':             alpha(fg2, 0.18),
    'editorIndentGuide.activeBackground1':       alpha(accent, 0.38),
    'editorInlayHint.foreground':                alpha(fg0, 0.70),
    'editorInlayHint.background':                alpha(bg2, 0.50),
    'editorInlayHint.parameterForeground':       alpha(fg0, 0.80),
    'editorInlayHint.parameterBackground':       alpha(bg2, 0.55),
    'editorInlayHint.typeForeground':            alpha(accent, 0.85),
    'editorInlayHint.typeBackground':            alpha(bg2, 0.55),
    'editorLightBulb.foreground':                termYellow,
    'editorLightBulbAutoFix.foreground':         termGreen,
    'editorLineNumber.dimmedForeground':         alpha(fg2, 0.55),
    'editorOverviewRuler.addedForeground':       alpha(termGreen, 0.80),
    'editorOverviewRuler.deletedForeground':     alpha(termRed, 0.80),
    'editorOverviewRuler.modifiedForeground':    alpha(accent, 0.80),
    'editorOverviewRuler.border':                border,
    'editorStickyScroll.background':             bg0,
    'editorStickyScrollHover.background':        bg2,
    'editorSuggestWidget.selectedForeground':    fg0,
    'editorUnnecessaryCode.opacity':             alpha(fg0, 0.30),

    // ── Missing Terminal Keys ───────────────────────────────────────────
    'terminal.dropBackground':                   alpha(accent, 0.10),
    'terminal.findMatchBackground':              alpha(accentBright, 0.40),
    'terminal.findMatchBorder':                  accent,
    'terminal.findMatchHighlightBackground':     alpha(accent, 0.20),
    'terminal.inactiveSelectionBackground':      alpha(accent, 0.14),
    'terminal.tab.activeBorder':                 accent,
    'terminalCommandDecoration.defaultBackground':termBlue,
    'terminalCommandDecoration.successBackground':termGreen,
    'terminalCommandDecoration.errorBackground': termRed,
    'terminalCommandGuide.foreground':           alpha(fg2, 0.70),
    'terminalCursor.background':                 bg0,

    // ── Missing Diff / Merge Keys ───────────────────────────────────────
    'diffEditor.diagonalFill':                   alpha(termBlue, 0.30),
    'diffEditorGutter.insertedLineBackground':   alpha(termGreen, 0.70),
    'diffEditorGutter.removedLineBackground':    alpha(termRed, 0.70),
    'merge.border':                              border,
    'merge.commonHeaderBackground':              alpha(accent, 0.18),
    'merge.commonContentBackground':             alpha(accent, 0.08),

    // ── Missing UI Keys ─────────────────────────────────────────────────
    'gitDecoration.submoduleResourceForeground': termBlue,
    'inlineChat.background':                     bg2,
    'inlineChat.foreground':                     fg0,
    'inlineChat.border':                         border,
    'inlineChatInput.background':                inputBg,
    'inlineChatInput.border':                    border,
    'minimapGutter.addedBackground':             alpha(termGreen, 0.80),
    'minimapGutter.deletedBackground':           alpha(termRed, 0.80),
    'minimapGutter.modifiedBackground':          alpha(accent, 0.80),
    'peekViewEditorGutter.background':           bg0,
    'problemsErrorIcon.foreground':              termRed,
    'problemsWarningIcon.foreground':            termYellow,
    'problemsInfoIcon.foreground':               termBlue,
    'quickInputList.focusForeground':            fg0,
    'quickInputList.focusIconForeground':        accent,
    'symbolIcon.interfaceForeground':            synType,
    'tab.hoverBorder':                           accent,
    'menu.background':                           bg2,
    'menu.foreground':                           fg0,
    'list.inactiveFocusBackground':              alpha(accent, 0.10),
    'contrastBorder':                            border,

    // ── Welcome Page ──────────────────────────────────────────────────────
    'welcomePage.background':               bg0,
    'welcomePage.buttonBackground':         bg2,
    'welcomePage.buttonHoverBackground':    alpha(accent, 0.12),
    'walkThrough.embeddedEditorBackground': bg1,
  };
}

// ─── token colors ─────────────────────────────────────────────────────────────

function buildTokenColors(p) {
  const {
    synKeyword, synFunc, synString, synType, synNumber,
    synComment, synVar, synPunct, synTag, synAttr, fg0,
    termRed,
  } = p;

  return [
    { name: 'Comment',
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: synComment, fontStyle: 'italic' } },

    { name: 'String',
      scope: ['string', 'string.quoted', 'string.template'],
      settings: { foreground: synString } },

    { name: 'String escape / regexp',
      scope: ['constant.character.escape', 'string.regexp'],
      settings: { foreground: synNumber } },

    { name: 'Number',
      scope: ['constant.numeric'],
      settings: { foreground: synNumber } },

    { name: 'Language constant',
      scope: ['constant.language'],
      settings: { foreground: synNumber, fontStyle: 'italic' } },

    { name: 'Keyword',
      scope: ['keyword', 'keyword.control'],
      settings: { foreground: synKeyword } },

    { name: 'Storage type',
      scope: ['storage.type'],
      settings: { foreground: synKeyword, fontStyle: 'italic' } },

    { name: 'Storage modifier',
      scope: ['storage.modifier'],
      settings: { foreground: synKeyword } },

    { name: 'Operator',
      scope: ['keyword.operator'],
      settings: { foreground: synPunct } },

    { name: 'Punctuation',
      scope: ['punctuation.separator', 'punctuation.accessor',
              'punctuation.definition.bracket'],
      settings: { foreground: synPunct } },

    { name: 'Function name',
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: { foreground: synFunc } },

    { name: 'Function call',
      scope: ['meta.function-call entity.name.function'],
      settings: { foreground: synFunc } },

    { name: 'Function parameter',
      scope: ['variable.parameter'],
      settings: { foreground: synVar, fontStyle: 'italic' } },

    { name: 'Type / Class',
      scope: ['entity.name.type', 'entity.name.class', 'entity.name.interface',
              'support.type', 'support.class',
              'entity.other.inherited-class'],
      settings: { foreground: synType } },

    { name: 'Variable',
      scope: ['variable', 'variable.other'],
      settings: { foreground: synVar } },

    { name: 'Variable — language (this, self)',
      scope: ['variable.language'],
      settings: { foreground: synKeyword, fontStyle: 'italic' } },

    { name: 'HTML / JSX tag name',
      scope: ['entity.name.tag'],
      settings: { foreground: synTag } },

    { name: 'HTML / JSX attribute',
      scope: ['entity.other.attribute-name'],
      settings: { foreground: synAttr } },

    { name: 'Markdown heading',
      scope: ['markup.heading', 'entity.name.section'],
      settings: { foreground: synKeyword, fontStyle: 'bold' } },

    { name: 'Markdown bold',
      scope: ['markup.bold'],
      settings: { foreground: fg0, fontStyle: 'bold' } },

    { name: 'Markdown italic',
      scope: ['markup.italic'],
      settings: { foreground: fg0, fontStyle: 'italic' } },

    { name: 'Markdown inline code',
      scope: ['markup.inline.raw'],
      settings: { foreground: synString } },

    { name: 'Markdown link',
      scope: ['string.other.link', 'markup.underline.link'],
      settings: { foreground: synFunc } },

    { name: 'CSS property name',
      scope: ['support.type.property-name.css'],
      settings: { foreground: synAttr } },

    { name: 'CSS value',
      scope: ['support.property-value.css', 'constant.other.color'],
      settings: { foreground: synNumber } },

    { name: 'CSS selector',
      scope: ['entity.other.attribute-name.class',
              'entity.other.attribute-name.id'],
      settings: { foreground: synFunc } },

    { name: 'JSON key',
      scope: ['support.type.property-name.json'],
      settings: { foreground: synAttr } },

    { name: 'Import / module path',
      scope: ['string.quoted.double.import', 'string.quoted.single.import'],
      settings: { foreground: synString, fontStyle: 'italic' } },
    { name: 'JSON source',
      scope: ['source.json', 'meta.structure.dictionary.json'],
      settings: { foreground: synString } },

    { name: 'JSON keys',
      scope: ['meta.structure.dictionary.key.json', 'string.key.json'],
      settings: { foreground: synAttr, fontStyle: 'bold' } },

    { name: 'JSON values',
      scope: ['meta.structure.dictionary.value.json', 'string.quoted.double.json', 'constant.numeric.json', 'constant.language.json', 'variable.other.json'],
      settings: { foreground: synString } },

    { name: 'JSON punctuation',
      scope: ['punctuation.definition.string.begin.json', 'punctuation.definition.string.end.json'],
      settings: { foreground: synString } },

    { name: 'TSX source',
      scope: ['source.tsx', 'meta.tag.tsx', 'meta.embedded.block.tsx', 'entity.name.tag.tsx', 'meta.jsx.children'],
      settings: { foreground: synTag } },

    { name: 'TSX punctuation',
      scope: ['punctuation.definition.tag.tsx'],
      settings: { foreground: synPunct } },

    { name: 'Constant',
      scope: ['constant', 'constant.other', 'entity.name.constant'],
      settings: { foreground: synNumber } },

    { name: 'Boolean / null',
      scope: ['constant.language.boolean', 'constant.language.null'],
      settings: { foreground: synNumber, fontStyle: 'italic' } },

    { name: 'Variable extended',
      scope: ['variable.other.readwrite', 'variable.object.property', 'support.variable', 'variable.other.json'],
      settings: { foreground: synVar } },

    { name: 'Variable function',
      scope: ['variable.function'],
      settings: { foreground: synFunc } },

    { name: 'Punctuation extended',
      scope: ['punctuation', 'meta.brace', 'meta.bracket', 'meta.delimiter', 'punctuation.definition.string'],
      settings: { foreground: synPunct } },

    { name: 'Invalid',
      scope: ['invalid', 'invalid.illegal'],
      settings: { foreground: termRed, fontStyle: 'underline' } },

    { name: 'String key',
      scope: ['string.key'],
      settings: { foreground: synAttr } },

    { name: 'Source / text',
      scope: ['source', 'text'],
      settings: { foreground: fg0 } },
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

  const p           = buildPalette(baseHex, isDark);
  const colors      = buildColors(p);
  const tokenColors = buildTokenColors(p);

  return {
    name:   displayName,
    type:   isDark ? 'dark' : 'light',
    colors,
    tokenColors,
    semanticHighlighting: true,
    semanticTokenColors: {
      'class':             { foreground: p.synType },
      'interface':         { foreground: p.synType, fontStyle: 'italic' },
      'enum':              { foreground: p.synType },
      'enumMember':        { foreground: p.synNumber },
      'function':          { foreground: p.synFunc },
      'method':            { foreground: p.synFunc },
      'property':          { foreground: p.synAttr },
      'variable':          { foreground: p.synVar  },
      'variable.readonly': { foreground: p.synNumber },
      'parameter':         { foreground: p.synVar, fontStyle: 'italic' },
      'type':              { foreground: p.synType },
      'namespace':         { foreground: p.synType, fontStyle: 'italic' },
      'keyword':           { foreground: p.synKeyword },
      'string':            { foreground: p.synString  },
      'number':            { foreground: p.synNumber  },
      'comment':           { foreground: p.synComment, fontStyle: 'italic' },
      'decorator':         { foreground: p.accent     },
      'macro':             { foreground: p.synKeyword },
      'selfKeyword':       { foreground: p.synKeyword, fontStyle: 'italic' },
    },
  };
}

module.exports = { generateThemeJson };
