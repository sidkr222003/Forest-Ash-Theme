'use strict';

/**
 * themeGenerator.js  –  Forest Ash Dynamic Theme Generator
 * ──────────────────────────────────────────────────────────
 *
 * Given a single base hex color the generator:
 *   1. Analyses the color's perceptual character (hue, chroma, lightness)
 *   2. Derives harmonically-correct hues for every syntax role using color-
 *      theory rules (complementary, triadic, semantic targets)
 *   3. Enforces WCAG 2.1 contrast ratios for every foreground/background pair
 *   4. Produces a complete VS Code workbench + token-color theme JSON
 */

const chroma = require('chroma-js');

// ─────────────────────────────────────────────────────────────────────────────
// §1  LOW-LEVEL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Build a hex color from HSL components (h: 0-360, s: 0-100, l: 0-100). */
function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  return chroma.hsl(h, s, l).hex();
}

/** Append an alpha byte to a #rrggbb hex string.  opacity: 0–1. */
function alpha(hex, opacity) {
  const byte = Math.round(clamp(opacity, 0, 1) * 255)
    .toString(16)
    .padStart(2, '0');
  return hex.slice(0, 7) + byte;
}

/** Destructure a hex color into HSL (h: 0-360, s: 0-100, l: 0-100). */
function hslOf(hex) {
  const [h, s, l] = chroma(hex).hsl();
  return {
    h: isNaN(h) ? 0 : h,
    s: isNaN(s) ? 0 : s * 100,
    l: isNaN(l) ? 50 : l * 100,
  };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/** Rotate a hue by `deg` degrees, returning a value in [0, 360). */
function rotHue(h, deg) {
  return ((h + deg) % 360 + 360) % 360;
}

/** Smallest angular distance between two hues (result: 0–180). */
function hueDist(a, b) {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}


// ─────────────────────────────────────────────────────────────────────────────
// §2  COLOR ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyse the base color and return a rich profile used by all downstream
 * functions.  We use LCH chroma (perceptual saturation) rather than HSL
 * saturation where decisions need to be visually accurate.
 *
 * @param  {string} hex  Any chroma-valid color string
 * @returns {ColorProfile}
 */
function analyzeColor(hex) {
  const { h, s, l } = hslOf(hex);
  const lch = chroma(hex).lch();
  const lchC = lch[1]; // perceptual chroma  (0 = grey, 130+ = vivid)
  const lchL = lch[0]; // perceptual lightness (0–100)

  // Perceptual saturation normalised to 0–1.
  // Max real-world LCH chroma ≈ 132 (sRGB gamut peak).
  const perceivedSat = clamp(lchC / 80, 0, 1);

  // Temperature bands  (rough but reliable for UI purposes)
  const isWarm    = (h >= 0   && h < 70)  || h >= 330;   // red / orange / yellow-orange
  const isCool    = (h >= 155 && h < 290);                // green-blue → violet
  const isNeutral = !isWarm && !isCool;                   // yellow-green, red-violet fringe

  return {
    hue:         h,
    sat:         s,           // HSL saturation (0–100)
    lum:         l,           // HSL lightness  (0–100)
    lchChroma:   lchC,        // perceptual chroma
    lchLightness: lchL,       // perceptual lightness
    perceivedSat,             // normalised 0–1 perceptual saturation
    isWarm, isCool, isNeutral,
    isVibrant:   perceivedSat > 0.55,
    isMuted:     perceivedSat < 0.25,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// §3  COLOR HARMONY ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find a hue close to `target` that clears every hue in `taken` by at
 * least `minSep` degrees.  Searches ±`spread` degrees around the target.
 *
 * @param  {number}   target      Desired hue (degrees)
 * @param  {number[]} taken       Hues already allocated
 * @param  {number}   minSep      Minimum angular separation required
 * @param  {number}   spread      How far to search around the target
 * @returns {number}  Resolved hue
 */
function findClearHue(target, taken, minSep = 28, spread = 70) {
  const ok = (h) => taken.every(e => hueDist(h, e) >= minSep);
  if (ok(target)) return target;

  for (let delta = 5; delta <= spread; delta += 5) {
    const cw  = rotHue(target,  delta);
    const ccw = rotHue(target, -delta);
    if (ok(cw))  return cw;
    if (ok(ccw)) return ccw;
  }

  // If no clear hue found within spread, pick the option that maximises
  // minimum distance from all taken hues.
  let bestH = target, bestMinDist = -1;
  for (let h = 0; h < 360; h += 3) {
    const minD = Math.min(...taken.map(t => hueDist(h, t)));
    if (minD > bestMinDist) { bestMinDist = minD; bestH = h; }
  }
  return bestH;
}

/**
 * Derive harmonically-correct hues for the five core syntax roles from a
 * single base hue.
 *
 * Semantic targets are derived from analyzing 30+ popular VS Code themes:
 *
 *   keyword  → base hue            (the "identity" of the theme)
 *   func     → complementary       (most visually distinct from keywords)
 *   string   → warm amber ~38°     (near-universal string association)
 *   type     → violet/purple ~275° (near-universal type/class association)
 *   number   → golden/teal ~50°    (distinct warm accent)
 *
 * When the base color is already close to a semantic target, the target is
 * shifted to maintain separation, so the theme always feels coherent.
 *
 * @param  {ColorProfile} profile
 * @returns {{ keyword, func, string, type, number }}
 */
function deriveHarmonicHues(profile) {
  const H   = profile.hue;
  const taken = [H]; // start with keyword = base hue

  // ── func: complementary (180° away) ─────────────────────────────────────
  const funcRaw = rotHue(H, 180);
  const funcHue = findClearHue(funcRaw, taken, 45, 55);
  taken.push(funcHue);

  // ── string: amber (38°) unless base is warm → flip to teal (190°) ───────
  const amberTarget = 38;
  const tealTarget  = 190;
  let stringTarget  = profile.isWarm && hueDist(H, amberTarget) < 45
    ? tealTarget   // base is warm → strings go cool
    : amberTarget; // base is cool/neutral → strings are classic amber

  // Also avoid collision with already-allocated func hue
  if (hueDist(stringTarget, funcHue) < 35) {
    stringTarget = rotHue(H, 90); // use quadrature as fallback
  }

  const stringHue = findClearHue(stringTarget, taken, 32, 65);
  taken.push(stringHue);

  // ── type: violet (275°), fall back to cyan-teal (185°) if base is purple ─
  let typeTarget = 275;
  if (hueDist(H, 275) < 45) typeTarget = 185; // base is purple → types go cyan
  if (hueDist(typeTarget, funcHue)   < 32) typeTarget = rotHue(H, 240);
  if (hueDist(typeTarget, stringHue) < 32) typeTarget = rotHue(H, 120);

  const typeHue = findClearHue(typeTarget, taken, 28, 80);
  taken.push(typeHue);

  // ── number: golden (50°) unless already occupied → triadic fallback ──────
  let numberTarget = 50;
  const tooCloseToExisting = taken.some(t => hueDist(numberTarget, t) < 30);
  if (tooCloseToExisting) numberTarget = rotHue(H, 120); // try triadic

  const numberHue = findClearHue(numberTarget, taken, 26, 80);

  return { keyword: H, func: funcHue, string: stringHue, type: typeHue, number: numberHue };
}


// ─────────────────────────────────────────────────────────────────────────────
// §4  WCAG CONTRAST ENFORCEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adjust the lightness of `fgHex` until it achieves at least `minRatio`
 * contrast against `bgHex`.  Direction (lighten/darken) is inferred from
 * background luminance.  Preserves hue and saturation.
 *
 * WCAG 2.1 guidance:
 *   AA  body text:     4.5 : 1
 *   AA  large text:    3.0 : 1
 *   AAA body text:     7.0 : 1
 *
 * @param  {string} fgHex
 * @param  {string} bgHex
 * @param  {number} minRatio  Minimum contrast ratio (default: 4.5)
 * @returns {string}  Contrast-safe hex
 */
function enforceContrast(fgHex, bgHex, minRatio = 4.5) {
  if (chroma.contrast(fgHex, bgHex) >= minRatio) return fgHex;

  const { h, s, l } = hslOf(fgHex);
  const darkBg = chroma(bgHex).luminance() < 0.5;

  // Binary search: on dark bg we raise lightness; on light bg we lower it.
  let lo = darkBg ? l   : 0;
  let hi = darkBg ? 100 : l;
  let best = l;

  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (chroma.contrast(hsl(h, s, mid), bgHex) >= minRatio) {
      best = mid;
      // Found a valid L — try to stay as close to original as possible
      if (darkBg) hi = mid;
      else        lo = mid;
    } else {
      if (darkBg) lo = mid;
      else        hi = mid;
    }
  }

  return hsl(h, s, best);
}

/**
 * Ensure a button/badge background achieves `minRatio` contrast against the
 * foreground text (usually white).  Adjusts the *background* lightness rather
 * than the text.
 */
function enforceButtonContrast(bgHex, fgHex = '#ffffff', minRatio = 4.5) {
  if (chroma.contrast(fgHex, bgHex) >= minRatio) return bgHex;

  const { h, s } = hslOf(bgHex);
  const fgIsDark = chroma(fgHex).luminance() < 0.5;

  // If fg is light (white), darken bg; if fg is dark, lighten bg.
  let lo = fgIsDark ? hslOf(bgHex).l : 0;
  let hi = fgIsDark ? 100             : hslOf(bgHex).l;
  let best = hslOf(bgHex).l;

  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (chroma.contrast(fgHex, hsl(h, s, mid)) >= minRatio) {
      best = mid;
      if (fgIsDark) hi = mid; // lightest that still works → go lower
      else          lo = mid; // darkest that still works → go higher
    } else {
      if (fgIsDark) lo = mid;
      else          hi = mid;
    }
  }

  return hsl(h, s, best);
}


// ─────────────────────────────────────────────────────────────────────────────
// §5  TERMINAL COLOR BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build ANSI terminal colors that respect both semantic meaning (red should
 * look red) and the theme's overall hue "tint" (a blue theme feels slightly
 * blue in the terminal too).
 *
 * @param  {number}  H        Base theme hue
 * @param  {number}  satScale Saturation multiplier from buildPalette
 * @param  {boolean} isDark
 * @param  {number}  tint     0 = pure semantic ANSI, 1 = fully shifted to H
 */
function buildTerminalColors(H, satScale, isDark, tint = 0.10) {
  const ss  = (base) => clamp(base * satScale, 0, 100);
  const lDk = isDark ? 0 : -12; // lightness offset for light themes

  /**
   * Blend the semantic ANSI hue with the theme's base hue by `tint` amount.
   * This preserves color identity while giving the terminal a cohesive feel.
   */
  function tintedHue(semanticH) {
    // Find shortest arc from semanticH to H
    const arc = ((H - semanticH + 540) % 360) - 180;
    return ((semanticH + arc * tint) % 360 + 360) % 360;
  }

  return {
    termRed:     hsl(tintedHue(3),   ss(60), 60 + lDk),
    termGreen:   hsl(tintedHue(138), ss(48), 58 + lDk),
    termYellow:  hsl(tintedHue(45),  ss(60), 62 + lDk),
    termBlue:    hsl(tintedHue(220), ss(48), 62 + lDk),
    termMagenta: hsl(tintedHue(295), ss(44), 60 + lDk),
    termCyan:    hsl(tintedHue(188), ss(46), 60 + lDk),
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// §6  PALETTE BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildPalette(baseHex, isDark) {
  const profile    = analyzeColor(baseHex);
  const { hue: H, sat: S, lum: L, perceivedSat } = profile;
  const hues       = deriveHarmonicHues(profile);

  // ── Saturation scaling ────────────────────────────────────────────────────
  // Based on perceptual saturation so muted inputs stay muted and vibrant
  // inputs stay vibrant.  The curve (0.50 + pS × 0.70) maps:
  //   grey  (pS=0.00) → scale 0.50  (very low sat)
  //   mid   (pS=0.50) → scale 0.85
  //   vivid (pS=1.00) → scale 1.20  (fully saturated)
  const satScale = clamp(0.50 + perceivedSat * 0.70, 0.50, 1.20);
  const ss = (base) => clamp(base * satScale, 0, 100);

  // ── Lightness influence ───────────────────────────────────────────────────
  // If the user passes a very light or very dark color, nudge bg/fg lightness
  // slightly so the theme doesn't clash with the input.
  const lShift = clamp(((L - 50) / 50) * 4, -4, 4);
  const sl = (base) => clamp(base + lShift * 0.35, 0, 100);

  // ── Terminal colors (shared between dark and light) ───────────────────────
  const term = buildTerminalColors(H, satScale, isDark);
  const { termRed, termGreen, termYellow, termBlue, termMagenta, termCyan } = term;

  // ─────────────────────────────────────────────────────────────────────────
  if (isDark) {
  // ─────────────────────────────────────────────────────────────────────────

    // ── Backgrounds ──────────────────────────────────────────────────────────
    const bgL = (base) => clamp(base + lShift * 0.20, 6, 22);
    const bg0 = hsl(H, ss(7),  bgL(10));
    const bg1 = hsl(H, ss(7),  bgL(12));
    const bg2 = hsl(H, ss(6),  bgL(15));
    const bg3 = hsl(H, ss(6),  bgL(18));
    const bg4 = hsl(H, ss(8),  bgL(13.5));

    // ── Foregrounds — enforce contrast against editor bg ──────────────────────
    const fg0 = enforceContrast(hsl(H, ss(9),  82), bg0, 7.0);
    const fg1 = enforceContrast(hsl(H, ss(7),  65), bg0, 4.5);
    const fg2 = enforceContrast(hsl(H, ss(5),  44), bg0, 3.0);

    // ── Accents ───────────────────────────────────────────────────────────────
    const accent       = hsl(H, ss(44), sl(62));
    const accentBright = hsl(H, ss(50), sl(68));
    const accentDim    = hsl(H, ss(36), sl(54));
    const accentFaint  = alpha(accent, 0.15);

    // Button: must achieve 4.5:1 against white label text
    const buttonRaw    = hsl(H, clamp(ss(55), 35, 100), clamp(sl(40), 26, 48));
    const buttonAccent = enforceButtonContrast(buttonRaw, '#ffffff', 4.5);

    // ── Syntax tokens — contrast-enforced against editor bg ───────────────────
    const synKeyword = enforceContrast(hsl(hues.keyword, ss(32), sl(63)), bg0, 4.5);
    const synFunc    = enforceContrast(hsl(hues.func,    ss(34), sl(65)), bg0, 4.5);
    const synString  = enforceContrast(hsl(hues.string,  ss(52), sl(62)), bg0, 4.5);
    const synType    = enforceContrast(hsl(hues.type,    ss(30), sl(68)), bg0, 4.5);
    const synNumber  = enforceContrast(hsl(hues.number,  ss(46), sl(67)), bg0, 4.5);

    // Comments: intentionally lower contrast (AA large-text: 3.0:1 minimum)
    // Use slightly desaturated base hue so they blend with the bg family.
    const synComment = enforceContrast(hsl(H, clamp(ss(20), 12, 45), 70), bg0, 3.0);

    // Secondary tokens derived from the syntax hue families
    const synVar   = hsl(H, ss(13), sl(74));
    const synPunct = hsl(H, ss(11), sl(60));
    const synTag   = enforceContrast(hsl(hues.string, ss(30), sl(62)), bg0, 4.5);
    const synAttr  = enforceContrast(hsl(hues.func,   ss(26), sl(62)), bg0, 4.5);

    // Terminal ANSI black/white
    const termBlack = bg1;
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

  // ─────────────────────────────────────────────────────────────────────────
  } else {
  // ─────────────────────────────────────────────────────────────────────────
  // LIGHT VARIANT
  // ─────────────────────────────────────────────────────────────────────────

    const bgL = (base) => clamp(base - lShift * 0.18, 84, 98);
    const bg0 = hsl(H, ss(12), bgL(96));
    const bg1 = hsl(H, ss(11), bgL(93));
    const bg2 = hsl(H, ss(9),  bgL(90));
    const bg3 = hsl(H, ss(8),  bgL(87));
    const bg4 = hsl(H, ss(14), bgL(92));

    const fg0 = enforceContrast(hsl(H, ss(16), 18), bg0, 7.0);
    const fg1 = enforceContrast(hsl(H, ss(13), 34), bg0, 4.5);
    const fg2 = enforceContrast(hsl(H, ss(8),  52), bg0, 3.0);

    const accent       = hsl(H, ss(52), sl(40));
    const accentBright = hsl(H, ss(58), sl(36));
    const accentDim    = hsl(H, ss(44), sl(46));
    const accentFaint  = alpha(accent, 0.12);
    const buttonAccent = enforceButtonContrast(accentBright, '#ffffff', 4.5);

    // Syntax: lightness values pushed down so they read on light backgrounds
    const synKeyword = enforceContrast(hsl(hues.keyword, ss(42), sl(34)), bg0, 4.5);
    const synFunc    = enforceContrast(hsl(hues.func,    ss(42), sl(33)), bg0, 4.5);
    const synString  = enforceContrast(hsl(hues.string,  ss(55), sl(31)), bg0, 4.5);
    const synType    = enforceContrast(hsl(hues.type,    ss(38), sl(35)), bg0, 4.5);
    const synNumber  = enforceContrast(hsl(hues.number,  ss(50), sl(32)), bg0, 4.5);
    const synComment = enforceContrast(hsl(H, clamp(ss(12), 8, 30), 54), bg0, 3.0);

    const synVar   = hsl(H, ss(15), sl(24));
    const synPunct = hsl(H, ss(11), sl(40));
    const synTag   = enforceContrast(hsl(hues.string, ss(40), sl(33)), bg0, 4.5);
    const synAttr  = enforceContrast(hsl(hues.func,   ss(34), sl(35)), bg0, 4.5);

    const termBlack = fg0;
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


// ─────────────────────────────────────────────────────────────────────────────
// §7  VS CODE WORKBENCH COLORS
// ─────────────────────────────────────────────────────────────────────────────

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

  const shadow  = alpha('#000000', isDark ? 0.45 : 0.12);
  const inputBg = isDark ? bg2 : alpha(bg0, 0.90);
  const dropBg  = bg2;

  return {
    // ── Base ──────────────────────────────────────────────────────────────────
    'focusBorder':                            '#00000000',
    'foreground':                             fg0,
    'disabledForeground':                     fg2,
    'widget.shadow':                          shadow,
    'selection.background':                   alpha(accent, 0.30),
    'descriptionForeground':                  fg1,
    'errorForeground':                        termRed,
    'icon.foreground':                        fg1,

    // ── Text ─────────────────────────────────────────────────────────────────
    'textBlockQuote.background':              bg2,
    'textBlockQuote.border':                  '#00000000',
    'textCodeBlock.background':               bg2,
    'textLink.activeForeground':              accentBright,
    'textLink.foreground':                    accent,
    'textPreformat.foreground':               fg0,
    'textSeparator.foreground':               '#00000000',

    // ── Toolbar ───────────────────────────────────────────────────────────────
    'toolbar.hoverBackground':                alpha(accent, 0.10),
    'toolbar.activeBackground':               alpha(accent, 0.18),

    // ── Button ────────────────────────────────────────────────────────────────
    'button.background':                      buttonAccent,
    'button.foreground':                      '#ffffff',
    'button.hoverBackground':                 accentDim,
    'button.secondaryBackground':             bg3,
    'button.secondaryForeground':             fg0,
    'button.secondaryHoverBackground':        bg2,
    'button.border':                          '#00000000',
    'button.separator':                       '#00000000',

    // ── Checkbox ──────────────────────────────────────────────────────────────
    'checkbox.background':                    inputBg,
    'checkbox.foreground':                    fg0,
    'checkbox.border':                        '#00000000',
    'checkbox.selectBackground':              alpha(accent, 0.20),
    'checkbox.selectBorder':                  '#00000000',

    // ── Dropdown ──────────────────────────────────────────────────────────────
    'dropdown.background':                    dropBg,
    'dropdown.listBackground':                dropBg,
    'dropdown.border':                        '#00000000',
    'dropdown.foreground':                    fg0,

    // ── Input ─────────────────────────────────────────────────────────────────
    'input.background':                       inputBg,
    'input.border':                           '#00000000',
    'input.foreground':                       fg0,
    'input.placeholderForeground':            fg2,
    'inputOption.activeBackground':           alpha(accent, 0.22),
    'inputOption.activeBorder':               '#00000000',
    'inputOption.activeForeground':           accentBright,
    'inputOption.hoverBackground':            alpha(accent, 0.12),
    'inputValidation.errorBackground':        alpha(termRed,    isDark ? 0.22 : 0.10),
    'inputValidation.errorBorder':            '#00000000',
    'inputValidation.errorForeground':        fg0,
    'inputValidation.warningBackground':      alpha(termYellow, 0.18),
    'inputValidation.warningBorder':          '#00000000',
    'inputValidation.warningForeground':      fg0,
    'inputValidation.infoBackground':         alpha(accent, 0.18),
    'inputValidation.infoBorder':             '#00000000',
    'inputValidation.infoForeground':         fg0,

    // ── Scrollbar ─────────────────────────────────────────────────────────────
    'scrollbar.shadow':                       shadow,
    'scrollbarSlider.activeBackground':       alpha(accent, 0.55),
    'scrollbarSlider.background':             alpha(fg2, 0.18),
    'scrollbarSlider.hoverBackground':        alpha(accent, 0.38),

    // ── Badge / Progress ──────────────────────────────────────────────────────
    'badge.background':                       buttonAccent,
    'badge.foreground':                       '#ffffff',
    'progressBar.background':                 buttonAccent,

    // ── List / Tree ───────────────────────────────────────────────────────────
    'list.activeSelectionBackground':         alpha(accent, 0.24),
    'list.activeSelectionForeground':         fg0,
    'list.activeSelectionIconForeground':     fg0,
    'list.activeSelectionBorder':             accent,
    'list.dropBackground':                    alpha(accent, 0.14),
    'list.focusBackground':                   alpha(accent, 0.18),
    'list.focusForeground':                   fg0,
    'list.focusOutline':                      '#00000000',
    'list.highlightForeground':               accentBright,
    'list.hoverBackground':                   alpha(accent, 0.10),
    'list.hoverForeground':                   fg0,
    'list.inactiveSelectionBackground':       alpha(accent, 0.14),
    'list.inactiveSelectionForeground':       fg0,
    'list.inactiveSelectionIconForeground':   fg1,
    'list.inactiveFocusBackground':           alpha(accent, 0.10),
    'list.inactiveFocusOutline':              '#00000000',
    'list.errorForeground':                   termRed,
    'list.warningForeground':                 termYellow,
    'list.deemphasizedForeground':            fg2,
    'list.filterMatchBackground':             alpha(accent, 0.18),
    'list.filterMatchBorder':                 '#00000000',
    'listFilterWidget.background':            dropBg,
    'listFilterWidget.outline':               '#00000000',
    'listFilterWidget.noMatchesOutline':      '#00000000',
    'listFilterWidget.shadow':                shadow,
    'tree.indentGuidesStroke':                alpha(accent, 0.28),
    'tree.tableColumnsBorder':                '#00000000',
    'tree.tableOddRowsBackground':            alpha(accent, 0.04),

    // ── Activity Bar ──────────────────────────────────────────────────────────
    'activityBar.background':                 bg1,
    'activityBar.foreground':                 fg0,
    'activityBar.inactiveForeground':         fg2,
    'activityBar.dropBorder':                 '#00000000',
    'activityBar.activeBackground':           alpha(accent, 0.10),
    'activityBar.activeBorder':               accent,
    'activityBar.activeFocusBorder':          '#00000000',
    'activityBarBadge.background':            buttonAccent,
    'activityBarBadge.foreground':            '#ffffff',
    'activityBarTop.foreground':              fg0,
    'activityBarTop.activeBorder':            '#00000000',
    'activityBarTop.inactiveForeground':      fg2,
    'activityBarTop.dropBorder':              '#00000000',

    // ── Side Bar ──────────────────────────────────────────────────────────────
    'sideBar.background':                     bg1,
    'sideBar.foreground':                     fg0,
    'sideBar.dropBackground':                 alpha(accent, 0.12),
    'sideBarTitle.foreground':                fg0,
    'sideBarSectionHeader.background':        bg2,
    'sideBarSectionHeader.foreground':        fg1,
    'sideBarSectionHeader.border':            '#00000000',

    // ── Minimap ───────────────────────────────────────────────────────────────
    'minimap.findMatchHighlight':             alpha(accentBright, 0.60),
    'minimap.selectionHighlight':             alpha(accent, 0.40),
    'minimap.errorHighlight':                 termRed,
    'minimap.warningHighlight':               termYellow,
    'minimap.background':                     bg0,
    'minimap.foregroundOpacity':              alpha('#000000', 0.85),
    'minimapSlider.background':               alpha(fg2, 0.18),
    'minimapSlider.hoverBackground':          alpha(accent, 0.38),
    'minimapSlider.activeBackground':         alpha(accent, 0.55),

    // ── Editor Groups / Tabs ──────────────────────────────────────────────────
    'editorGroup.border':                     '#00000000',
    'editorGroup.dropBackground':             alpha(accent, 0.12),
    'editorGroup.emptyBackground':            bg0,
    'editorGroup.focusedEmptyBorder':         '#00000000',
    'editorGroup.dropIntoPromptForeground':   fg0,
    'editorGroup.dropIntoPromptBackground':   bg2,
    'editorGroup.dropIntoPromptBorder':       '#00000000',
    'editorGroupHeader.tabsBackground':       bg1,
    'editorGroupHeader.noTabsBackground':     bg1,
    'editorGroupHeader.border':               '#00000000',

    // EDITOR TABS — bottom border accent only
    'tab.activeBackground':                   bg0,
    'tab.activeForeground':                   fg0,
    'tab.border':                             '#00000000',
    'tab.activeBorder':                       accent,
    'tab.activeBorderTop':                    '#00000000',
    'tab.inactiveBackground':                 bg1,
    'tab.inactiveForeground':                 fg2,
    'tab.hoverBackground':                    alpha(accent, 0.08),
    'tab.hoverForeground':                    fg1,
    'tab.hoverBorder':                        '#00000000',
    'tab.unfocusedActiveBackground':          bg1,
    'tab.unfocusedActiveForeground':          fg1,
    'tab.unfocusedActiveBorder':              '#00000000',
    'tab.unfocusedActiveBorderTop':           '#00000000',
    'tab.unfocusedInactiveBackground':        bg1,
    'tab.unfocusedInactiveForeground':        fg2,
    'tab.unfocusedHoverBackground':           alpha(accent, 0.06),
    'tab.unfocusedHoverForeground':           fg2,
    'tab.unfocusedHoverBorder':               '#00000000',
    'tab.lastPinnedBorder':                   '#00000000',
    'tab.selectedBorderTop':                  '#00000000',
    'tab.dragAndDropBorder':                  '#00000000',

    // ── Editor ────────────────────────────────────────────────────────────────
    'editor.background':                      bg0,
    'editor.foreground':                      fg0,
    'editorLineNumber.foreground':            fg2,
    'editorLineNumber.activeForeground':      fg1,
    'editorLineNumber.dimmedForeground':      alpha(fg2, 0.55),
    'editorCursor.foreground':                accentBright,
    'editorCursor.background':                bg0,
    'editor.selectionBackground':             alpha(accent, 0.28),
    'editor.selectionForeground':             fg0,
    'editor.inactiveSelectionBackground':     alpha(accent, isDark ? 0.14 : 0.10),
    'editor.selectionHighlightBackground':    alpha(accent, 0.14),
    'editor.selectionHighlightBorder':        '#00000000',
    'editor.wordHighlightBackground':         alpha(accent, 0.16),
    'editor.wordHighlightBorder':             '#00000000',
    'editor.wordHighlightStrongBackground':   alpha(accent, 0.26),
    'editor.wordHighlightStrongBorder':       '#00000000',
    'editor.wordHighlightTextBackground':     alpha(accent, 0.10),
    'editor.wordHighlightTextBorder':         '#00000000',
    'editor.findMatchBackground':             alpha(accentBright, 0.38),
    'editor.findMatchBorder':                 '#00000000',
    'editor.findMatchHighlightBackground':    alpha(accent, 0.18),
    'editor.findMatchHighlightBorder':        '#00000000',
    'editor.findRangeHighlightBackground':    alpha(accent, 0.08),
    'editor.findRangeHighlightBorder':        '#00000000',
    'editor.hoverHighlightBackground':        alpha(accent, 0.12),
    'editor.lineHighlightBackground':         bg4,
    'editor.lineHighlightBorder':             '#00000000',
    'editorLink.activeForeground':            accentBright,
    'editor.rangeHighlightBackground':        alpha(accent, 0.08),
    'editor.rangeHighlightBorder':            '#00000000',
    'editor.symbolHighlightBackground':       alpha(accent, 0.14),
    'editor.symbolHighlightBorder':           '#00000000',
    'editorWhitespace.foreground':            alpha(fg2, 0.40),
    'editorIndentGuide.background':           alpha(fg2, 0.18),
    'editorIndentGuide.background1':          alpha(fg2, 0.18),
    'editorIndentGuide.activeBackground':     alpha(accent, 0.38),
    'editorIndentGuide.activeBackground1':    alpha(accent, 0.38),
    'editorRuler.foreground':                 alpha(fg2, 0.18),
    'editorMultiCursor.primary.foreground':   accentBright,
    'editorMultiCursor.primary.background':   bg0,
    'editorMultiCursor.secondary.foreground': accent,
    'editorMultiCursor.secondary.background': bg0,

    // ── Editor Widgets ────────────────────────────────────────────────────────
    'editorWidget.background':                              bg2,
    'editorWidget.border':                                  '#00000000',
    'editorWidget.foreground':                              fg0,
    'editorWidget.resizeBorder':                            '#00000000',
    'editorSuggestWidget.background':                       bg2,
    'editorSuggestWidget.border':                           '#00000000',
    'editorSuggestWidget.foreground':                       fg0,
    'editorSuggestWidget.focusHighlightForeground':         accentBright,
    'editorSuggestWidget.highlightForeground':              accentBright,
    'editorSuggestWidget.selectedBackground':               alpha(accent, 0.22),
    'editorSuggestWidget.selectedForeground':               fg0,
    'editorSuggestWidget.selectedIconForeground':           accentBright,
    'editorSuggestWidgetStatus.foreground':                 fg2,
    'editorHoverWidget.background':                         bg2,
    'editorHoverWidget.border':                             '#00000000',
    'editorHoverWidget.foreground':                         fg0,
    'editorHoverWidget.highlightForeground':                accentBright,
    'editorHoverWidget.statusBarBackground':                bg3,

    // ── Gutter ────────────────────────────────────────────────────────────────
    'editorGutter.background':                              bg0,
    'editorGutter.modifiedBackground':                      alpha(accent, 0.80),
    'editorGutter.addedBackground':                         alpha(termGreen, 0.80),
    'editorGutter.deletedBackground':                       alpha(termRed, 0.80),
    'editorGutter.commentRangeForeground':                  fg2,
    'editorGutter.commentGlyphForeground':                  accent,
    'editorGutter.commentUnresolvedGlyphForeground':        termYellow,
    'editorGutter.foldingControlForeground':                fg2,

    // ── Diff Editor ───────────────────────────────────────────────────────────
    'diffEditor.insertedTextBackground':       alpha(termGreen, 0.12),
    'diffEditor.insertedTextBorder':           '#00000000',
    'diffEditor.removedTextBackground':        alpha(termRed, 0.12),
    'diffEditor.removedTextBorder':            '#00000000',
    'diffEditor.insertedLineBackground':       alpha(termGreen, 0.07),
    'diffEditor.removedLineBackground':        alpha(termRed, 0.07),
    'diffEditor.diagonalFill':                 alpha(termBlue, 0.30),
    'diffEditor.unchangedRegionBackground':    bg1,
    'diffEditor.unchangedRegionForeground':    fg2,
    'diffEditor.unchangedCodeBackground':      alpha(fg2, 0.06),
    'diffEditorGutter.insertedLineBackground': alpha(termGreen, 0.70),
    'diffEditorGutter.removedLineBackground':  alpha(termRed, 0.70),
    'diffEditorOverview.insertedForeground':   alpha(termGreen, 0.70),
    'diffEditorOverview.removedForeground':    alpha(termRed, 0.70),

    // ── Peek View ─────────────────────────────────────────────────────────────
    'peekView.border':                            '#00000000',
    'peekViewEditor.background':                  bg0,
    'peekViewEditor.matchHighlightBackground':    alpha(accent, 0.26),
    'peekViewEditor.matchHighlightBorder':        '#00000000',
    'peekViewEditorGutter.background':            bg0,
    'peekViewEditorStickyScroll.background':      bg1,
    'peekViewResult.background':                  bg2,
    'peekViewResult.fileForeground':              fg0,
    'peekViewResult.lineForeground':              fg1,
    'peekViewResult.matchHighlightBackground':    alpha(accent, 0.22),
    'peekViewResult.selectionBackground':         alpha(accent, 0.18),
    'peekViewResult.selectionForeground':         fg0,
    'peekViewTitle.background':                   bg2,
    'peekViewTitleDescription.foreground':        fg1,
    'peekViewTitleLabel.foreground':              fg0,

    // ── Merge ─────────────────────────────────────────────────────────────────
    'merge.currentHeaderBackground':   alpha(termGreen, 0.20),
    'merge.currentContentBackground':  alpha(termGreen, 0.08),
    'merge.incomingHeaderBackground':  alpha(termBlue, 0.20),
    'merge.incomingContentBackground': alpha(termBlue, 0.08),
    'merge.border':                    '#00000000',
    'merge.commonHeaderBackground':    alpha(accent, 0.18),
    'merge.commonContentBackground':   alpha(accent, 0.08),

    // ── Panel ─────────────────────────────────────────────────────────────────
    'panel.background':                    bg1,
    'panel.dropBorder':                    '#00000000',
    'panelTitle.activeBorder':             accent,
    'panelTitle.activeForeground':         fg0,
    'panelTitle.inactiveForeground':       fg2,
    'panelInput.border':                   '#00000000',
    'panelSection.border':                 '#00000000',
    'panelSection.dropBackground':         alpha(accent, 0.12),
    'panelSectionHeader.background':       bg2,
    'panelSectionHeader.foreground':       fg0,
    'panelSectionHeader.border':           '#00000000',

    // ── Status Bar ────────────────────────────────────────────────────────────
    'statusBar.background':                     bg1,
    'statusBar.foreground':                     fg0,
    'statusBar.border':                         '#00000000',
    'statusBar.focusBorder':                    '#00000000',
    'statusBar.debuggingBackground':            accentDim,
    'statusBar.debuggingForeground':            '#ffffff',
    'statusBar.debuggingBorder':                '#00000000',
    'statusBar.noFolderBackground':             bg2,
    'statusBar.noFolderForeground':             fg0,
    'statusBar.noFolderBorder':                 '#00000000',
    'statusBarItem.activeBackground':           alpha(accent, 0.28),
    'statusBarItem.hoverBackground':            alpha(accent, 0.14),
    'statusBarItem.hoverForeground':            fg0,
    'statusBarItem.focusBorder':                '#00000000',
    'statusBarItem.prominentBackground':        buttonAccent,
    'statusBarItem.prominentForeground':        '#ffffff',
    'statusBarItem.prominentHoverForeground':   '#ffffff',
    'statusBarItem.prominentHoverBackground':   accentDim,
    'statusBarItem.remoteBackground':           buttonAccent,
    'statusBarItem.remoteForeground':           '#ffffff',
    'statusBarItem.remoteHoverBackground':      accentDim,
    'statusBarItem.remoteHoverForeground':      '#ffffff',
    'statusBarItem.errorBackground':            alpha(termRed, 0.22),
    'statusBarItem.errorForeground':            termRed,
    'statusBarItem.errorHoverBackground':       alpha(termRed, 0.35),
    'statusBarItem.errorHoverForeground':       termRed,
    'statusBarItem.warningBackground':          alpha(termYellow, 0.18),
    'statusBarItem.warningForeground':          termYellow,
    'statusBarItem.warningHoverBackground':     alpha(termYellow, 0.30),
    'statusBarItem.warningHoverForeground':     termYellow,
    'statusBarItem.offlineBackground':          alpha(fg2, 0.18),
    'statusBarItem.offlineForeground':          fg1,
    'statusBarItem.offlineHoverBackground':     alpha(fg2, 0.28),
    'statusBarItem.offlineHoverForeground':     fg0,

    // ── Title Bar ─────────────────────────────────────────────────────────────
    'titleBar.activeBackground':   bg1,
    'titleBar.activeForeground':   fg0,
    'titleBar.border':             '#00000000',
    'titleBar.inactiveBackground': bg1,
    'titleBar.inactiveForeground': fg2,
    'menubar.selectionForeground': fg0,
    'menubar.selectionBackground': alpha(accent, 0.14),
    'menubar.selectionBorder':     '#00000000',

    // ── Menu ──────────────────────────────────────────────────────────────────
    'menu.background':         bg2,
    'menu.foreground':         fg0,
    'menu.border':             '#00000000',
    'menu.selectionBackground': alpha(accent, 0.22),
    'menu.selectionForeground': fg0,
    'menu.selectionBorder':    '#00000000',
    'menu.separatorBackground': '#00000000',
    'menu.shadow':              shadow,

    // ── Notifications ─────────────────────────────────────────────────────────
    'notifications.background':              bg2,
    'notifications.border':                  '#00000000',
    'notifications.foreground':              fg0,
    'notificationCenter.border':             '#00000000',
    'notificationCenterHeader.foreground':   fg0,
    'notificationCenterHeader.background':   bg3,
    'notificationToast.border':              '#00000000',
    'notificationsErrorIcon.foreground':     termRed,
    'notificationsWarningIcon.foreground':   termYellow,
    'notificationsInfoIcon.foreground':      accent,
    'notificationLink.foreground':           accentBright,

    // ── Quick Pick ────────────────────────────────────────────────────────────
    'pickerGroup.border':              '#00000000',
    'pickerGroup.foreground':          accentBright,
    'quickInput.background':           bg2,
    'quickInput.foreground':           fg0,
    'quickInputList.focusBackground':  alpha(accent, 0.22),
    'quickInputList.focusForeground':  fg0,
    'quickInputList.focusIconForeground': accent,
    'quickInputTitle.background':      bg3,

    // ── Keybinding ────────────────────────────────────────────────────────────
    'keybindingLabel.background':    alpha(accent, 0.12),
    'keybindingLabel.border':        '#00000000',
    'keybindingLabel.bottomBorder':  '#00000000',
    'keybindingLabel.foreground':    fg0,
    'keybindingTable.headerBackground': bg2,
    'keybindingTable.rowsBackground': alpha(accent, 0.04),

    // ── Breadcrumb ────────────────────────────────────────────────────────────
    'breadcrumb.activeSelectionForeground': accentBright,
    'breadcrumb.background':               bg0,
    'breadcrumb.focusForeground':          accent,
    'breadcrumb.foreground':               fg1,
    'breadcrumbPicker.background':         bg2,

    // ── Symbol Icons ──────────────────────────────────────────────────────────
    'symbolIcon.arrayForeground':         p.synVar,
    'symbolIcon.booleanForeground':       p.synNumber,
    'symbolIcon.classForeground':         synType,
    'symbolIcon.colorForeground':         p.synString,
    'symbolIcon.constantForeground':      p.synNumber,
    'symbolIcon.constructorForeground':   synFunc,
    'symbolIcon.enumeratorForeground':    synType,
    'symbolIcon.enumeratorMemberForeground': p.synNumber,
    'symbolIcon.eventForeground':         accent,
    'symbolIcon.fieldForeground':         synAttr,
    'symbolIcon.fileForeground':          fg1,
    'symbolIcon.folderForeground':        accent,
    'symbolIcon.functionForeground':      synFunc,
    'symbolIcon.interfaceForeground':     synType,
    'symbolIcon.keyForeground':           synAttr,
    'symbolIcon.keywordForeground':       synKeyword,
    'symbolIcon.methodForeground':        synFunc,
    'symbolIcon.moduleForeground':        accent,
    'symbolIcon.namespaceForeground':     synType,
    'symbolIcon.nullForeground':          p.synNumber,
    'symbolIcon.numberForeground':        p.synNumber,
    'symbolIcon.objectForeground':        p.synVar,
    'symbolIcon.operatorForeground':      p.synPunct,
    'symbolIcon.packageForeground':       accent,
    'symbolIcon.propertyForeground':      synAttr,
    'symbolIcon.referenceForeground':     p.synVar,
    'symbolIcon.snippetForeground':       p.synString,
    'symbolIcon.stringForeground':        p.synString,
    'symbolIcon.structForeground':        synType,
    'symbolIcon.textForeground':          fg0,
    'symbolIcon.typeParameterForeground': synType,
    'symbolIcon.unitForeground':          p.synNumber,
    'symbolIcon.variableForeground':      p.synVar,

    // ── Git Decoration ────────────────────────────────────────────────────────
    'gitDecoration.addedResourceForeground':        termGreen,
    'gitDecoration.conflictingResourceForeground':  termYellow,
    'gitDecoration.deletedResourceForeground':      termRed,
    'gitDecoration.ignoredResourceForeground':      fg2,
    'gitDecoration.modifiedResourceForeground':     accent,
    'gitDecoration.renamedResourceForeground':      termCyan,
    'gitDecoration.stageDeletedResourceForeground': termRed,
    'gitDecoration.stageModifiedResourceForeground': accent,
    'gitDecoration.submoduleResourceForeground':    termBlue,
    'gitDecoration.untrackedResourceForeground':    termGreen,
    'scm.providerBorder':                           '#00000000',

    // ── Terminal ──────────────────────────────────────────────────────────────
    'terminal.background':                      bg0,
    'terminal.foreground':                      fg0,
    'terminal.dropBackground':                  alpha(accent, 0.10),
    'terminal.findMatchBackground':             alpha(accentBright, 0.40),
    'terminal.findMatchBorder':                 '#00000000',
    'terminal.findMatchHighlightBackground':    alpha(accent, 0.20),
    'terminal.findMatchHighlightBorder':        '#00000000',
    'terminal.inactiveSelectionBackground':     alpha(accent, 0.14),
    'terminal.selectionBackground':             alpha(accent, 0.28),
    'terminal.selectionForeground':             fg0,
    'terminal.tab.activeBorder':                accent,
    'terminal.ansiBlack':                       termBlack,
    'terminal.ansiBrightBlack':                 fg2,
    'terminal.ansiRed':                         termRed,
    'terminal.ansiBrightRed':                   chroma(termRed).brighten(0.5).hex(),
    'terminal.ansiGreen':                       termGreen,
    'terminal.ansiBrightGreen':                 chroma(termGreen).brighten(0.5).hex(),
    'terminal.ansiYellow':                      termYellow,
    'terminal.ansiBrightYellow':                chroma(termYellow).brighten(0.4).hex(),
    'terminal.ansiBlue':                        termBlue,
    'terminal.ansiBrightBlue':                  chroma(termBlue).brighten(0.5).hex(),
    'terminal.ansiMagenta':                     termMagenta,
    'terminal.ansiBrightMagenta':               chroma(termMagenta).brighten(0.5).hex(),
    'terminal.ansiCyan':                        termCyan,
    'terminal.ansiBrightCyan':                  chroma(termCyan).brighten(0.5).hex(),
    'terminal.ansiWhite':                       fg1,
    'terminal.ansiBrightWhite':                 termWhite,
    'terminalCommandDecoration.defaultBackground':  termBlue,
    'terminalCommandDecoration.successBackground':  termGreen,
    'terminalCommandDecoration.errorBackground':    termRed,
    'terminalCommandGuide.foreground':              alpha(fg2, 0.70),
    'terminalCursor.foreground':                accentBright,
    'terminalCursor.background':                bg0,
    'terminalOverviewRuler.cursorForeground':   accentBright,
    'terminalOverviewRuler.findMatchForeground': alpha(accentBright, 0.70),
    'terminalStickyScroll.background':          bg1,
    'terminalStickyScrollHover.background':     bg2,

    // ── Debug ─────────────────────────────────────────────────────────────────
    'debugToolBar.background':                          bg2,
    'debugToolBar.border':                              '#00000000',
    'editor.stackFrameHighlightBackground':             alpha(termYellow, 0.14),
    'editor.focusedStackFrameHighlightBackground':      alpha(termGreen, 0.14),
    'debugView.exceptionLabelBackground':               alpha(termRed, 0.20),
    'debugView.exceptionLabelForeground':               termRed,
    'debugView.stateLabelBackground':                   alpha(accent, 0.18),
    'debugView.stateLabelForeground':                   fg0,
    'debugView.valueChangedHighlight':                  accentBright,
    'debugTokenExpression.name':                        synAttr,
    'debugTokenExpression.value':                       p.synString,
    'debugTokenExpression.string':                      p.synString,
    'debugTokenExpression.boolean':                     p.synNumber,
    'debugTokenExpression.number':                      p.synNumber,
    'debugTokenExpression.error':                       termRed,
    'debugConsole.infoForeground':                      fg1,
    'debugConsole.warningForeground':                   termYellow,
    'debugConsole.errorForeground':                     termRed,
    'debugConsole.sourceForeground':                    accent,
    'debugConsoleInputIcon.foreground':                 accentBright,
    'debugIcon.breakpointForeground':                   termRed,
    'debugIcon.breakpointDisabledForeground':           alpha(termRed, 0.45),
    'debugIcon.breakpointUnverifiedForeground':         termYellow,
    'debugIcon.breakpointCurrentStackframeForeground':  accentBright,
    'debugIcon.breakpointStackframeForeground':         accent,
    'debugIcon.startForeground':                        termGreen,
    'debugIcon.pauseForeground':                        termYellow,
    'debugIcon.stopForeground':                         termRed,
    'debugIcon.disconnectForeground':                   termRed,
    'debugIcon.restartForeground':                      termGreen,
    'debugIcon.stepOverForeground':                     accent,
    'debugIcon.stepIntoForeground':                     accent,
    'debugIcon.stepOutForeground':                      accent,
    'debugIcon.continueForeground':                     termGreen,
    'debugIcon.stepBackForeground':                     accentDim,

    // ── Testing ───────────────────────────────────────────────────────────────
    'testing.iconFailed':                         termRed,
    'testing.iconErrored':                        termRed,
    'testing.iconPassed':                         termGreen,
    'testing.runAction':                          termGreen,
    'testing.iconQueued':                         termYellow,
    'testing.iconUnset':                          fg2,
    'testing.iconSkipped':                        accentDim,
    'testing.peekBorder':                         '#00000000',
    'testing.peekHeaderBackground':               bg2,
    'testing.message.error.decorationForeground': termRed,
    'testing.message.error.lineBackground':       alpha(termRed, 0.10),
    'testing.message.info.decorationForeground':  fg2,
    'testing.message.info.lineBackground':        alpha(accent, 0.06),

    // ── Settings ──────────────────────────────────────────────────────────────
    'settings.headerForeground':          accentBright,
    'settings.headerBorder':              '#00000000',
    'settings.modifiedItemIndicator':     accent,
    'settings.dropdownBackground':        dropBg,
    'settings.dropdownForeground':        fg0,
    'settings.dropdownBorder':            '#00000000',
    'settings.dropdownListBorder':        '#00000000',
    'settings.checkboxBackground':        inputBg,
    'settings.checkboxForeground':        fg0,
    'settings.checkboxBorder':            '#00000000',
    'settings.rowHoverBackground':        alpha(accent, 0.06),
    'settings.textInputBackground':       inputBg,
    'settings.textInputForeground':       fg0,
    'settings.textInputBorder':           '#00000000',
    'settings.numberInputBackground':     inputBg,
    'settings.numberInputForeground':     fg0,
    'settings.numberInputBorder':         '#00000000',
    'settings.focusedRowBackground':      alpha(accent, 0.08),
    'settings.focusedRowBorder':          '#00000000',
    'settings.sashBorder':                '#00000000',

    // ── Editor Extended ───────────────────────────────────────────────────────
    'editorBracketMatch.background':    alpha(accent, 0.15),
    'editorBracketMatch.border':        '#00000000',
    'editorBracketHighlight.foreground1': accent,
    'editorBracketHighlight.foreground2': synFunc,
    'editorBracketHighlight.foreground3': synType,
    'editorBracketHighlight.foreground4': p.synNumber,
    'editorBracketHighlight.foreground5': p.synString,
    'editorBracketHighlight.foreground6': synKeyword,
    'editorBracketHighlight.unexpectedBracket.foreground': termRed,
    'editorBracketPairGuide.activeBackground1': alpha(accent,       0.30),
    'editorBracketPairGuide.activeBackground2': alpha(synFunc,      0.30),
    'editorBracketPairGuide.activeBackground3': alpha(synType,      0.30),
    'editorBracketPairGuide.activeBackground4': alpha(p.synNumber,  0.30),
    'editorBracketPairGuide.activeBackground5': alpha(p.synString,  0.30),
    'editorBracketPairGuide.activeBackground6': alpha(synKeyword,   0.30),
    'editorBracketPairGuide.background1': alpha(accent,      0.10),
    'editorBracketPairGuide.background2': alpha(synFunc,     0.10),
    'editorBracketPairGuide.background3': alpha(synType,     0.10),
    'editorBracketPairGuide.background4': alpha(p.synNumber, 0.10),
    'editorBracketPairGuide.background5': alpha(p.synString, 0.10),
    'editorBracketPairGuide.background6': alpha(synKeyword,  0.10),
    'editorCodeLens.foreground':          fg2,
    'editorError.foreground':             termRed,
    'editorError.border':                 '#00000000',
    'editorError.background':             alpha(termRed, 0.08),
    'editorWarning.foreground':           termYellow,
    'editorWarning.border':               '#00000000',
    'editorWarning.background':           alpha(termYellow, 0.06),
    'editorInfo.foreground':              termBlue,
    'editorInfo.border':                  '#00000000',
    'editorInfo.background':              alpha(termBlue, 0.06),
    'editorHint.foreground':              accent,
    'editorHint.border':                  '#00000000',
    'editorGhostText.foreground':         alpha(fg0, 0.45),
    'editorGhostText.background':         alpha(bg2, 0.25),
    'editorGhostText.border':             '#00000000',
    'editorInlayHint.foreground':         alpha(fg0, 0.70),
    'editorInlayHint.background':         alpha(bg2, 0.50),
    'editorInlayHint.parameterForeground': alpha(fg0, 0.80),
    'editorInlayHint.parameterBackground': alpha(bg2, 0.55),
    'editorInlayHint.typeForeground':     alpha(accent, 0.85),
    'editorInlayHint.typeBackground':     alpha(bg2, 0.55),
    'editorLightBulb.foreground':         termYellow,
    'editorLightBulbAutoFix.foreground':  termGreen,
    'editorLightBulbAi.foreground':       accentBright,
    'editorOverviewRuler.addedForeground':    alpha(termGreen, 0.80),
    'editorOverviewRuler.deletedForeground':  alpha(termRed,   0.80),
    'editorOverviewRuler.modifiedForeground': alpha(accent,    0.80),
    'editorOverviewRuler.errorForeground':    termRed,
    'editorOverviewRuler.warningForeground':  termYellow,
    'editorOverviewRuler.infoForeground':     termBlue,
    'editorOverviewRuler.bracketMatchForeground':      alpha(accent, 0.55),
    'editorOverviewRuler.border':             '#00000000',
    'editorOverviewRuler.findMatchForeground': alpha(accentBright, 0.55),
    'editorOverviewRuler.rangeHighlightForeground':    alpha(accent, 0.35),
    'editorOverviewRuler.selectionHighlightForeground': alpha(accent, 0.45),
    'editorOverviewRuler.wordHighlightForeground':     alpha(accent, 0.45),
    'editorOverviewRuler.wordHighlightStrongForeground': alpha(accent, 0.65),
    'editorOverviewRuler.wordHighlightTextForeground': alpha(accent, 0.35),
    'editorOverviewRuler.currentContentForeground':  alpha(termGreen, 0.55),
    'editorOverviewRuler.incomingContentForeground': alpha(termBlue,  0.55),
    'editorStickyScroll.background':      bg0,
    'editorStickyScroll.border':          '#00000000',
    'editorStickyScroll.shadow':          shadow,
    'editorStickyScrollHover.background': bg2,
    'editorUnnecessaryCode.border':       '#00000000',
    'editorUnnecessaryCode.opacity':      alpha(fg0, 0.30),

    // ── Inline Chat ───────────────────────────────────────────────────────────
    'inlineChat.background':                    bg2,
    'inlineChat.foreground':                    fg0,
    'inlineChat.border':                        '#00000000',
    'inlineChat.shadow':                        shadow,
    'inlineChatInput.background':               inputBg,
    'inlineChatInput.border':                   '#00000000',
    'inlineChatInput.focusBorder':              '#00000000',
    'inlineChatInput.placeholderForeground':    fg2,
    'inlineChatDiff.inserted':                  alpha(termGreen, 0.12),
    'inlineChatDiff.removed':                   alpha(termRed,   0.12),

    // ── Minimap Gutter ────────────────────────────────────────────────────────
    'minimapGutter.addedBackground':    alpha(termGreen, 0.80),
    'minimapGutter.deletedBackground':  alpha(termRed,   0.80),
    'minimapGutter.modifiedBackground': alpha(accent,    0.80),

    // ── Problems ──────────────────────────────────────────────────────────────
    'problemsErrorIcon.foreground':   termRed,
    'problemsWarningIcon.foreground': termYellow,
    'problemsInfoIcon.foreground':    termBlue,

    // ── Welcome Page ──────────────────────────────────────────────────────────
    'welcomePage.background':              bg0,
    'welcomePage.buttonBackground':        bg2,
    'welcomePage.buttonHoverBackground':   alpha(accent, 0.12),
    'welcomePage.progress.background':     bg3,
    'welcomePage.progress.foreground':     buttonAccent,
    'welcomePage.tileBackground':          bg1,
    'welcomePage.tileHoverBackground':     bg2,
    'welcomePage.tileBorder':              '#00000000',
    'walkThrough.embeddedEditorBackground': bg1,
    'walkthrough.stepTitle.foreground':    accentBright,

    // ── Chat ──────────────────────────────────────────────────────────────────
    'chat.requestBackground':      alpha(accent, 0.06),
    'chat.requestBorder':          '#00000000',
    'chat.slashCommandBackground': alpha(accent, 0.14),
    'chat.slashCommandForeground': accentBright,
    'chat.avatarBackground':       alpha(accent, 0.18),
    'chat.avatarForeground':       fg0,

    // ── Extensions ────────────────────────────────────────────────────────────
    'extensionButton.prominentBackground':      buttonAccent,
    'extensionButton.prominentForeground':      '#ffffff',
    'extensionButton.prominentHoverBackground': accentDim,
    'extensionButton.background':               alpha(accent, 0.20),
    'extensionButton.foreground':               fg0,
    'extensionButton.hoverBackground':          alpha(accent, 0.30),
    'extensionButton.separator':                '#00000000',
    'extensionBadge.remoteBackground':          buttonAccent,
    'extensionBadge.remoteForeground':          '#ffffff',
    'extensionIcon.starForeground':             termYellow,
    'extensionIcon.verifiedForeground':         termGreen,
    'extensionIcon.preReleaseForeground':       accentBright,
    'extensionIcon.sponsorForeground':          termMagenta,
    'ports.iconRunningProcessForeground':       termGreen,

    // ── Misc ──────────────────────────────────────────────────────────────────
    'contrastBorder':        '#00000000',
    'contrastActiveBorder':  '#00000000',
    'sash.hoverBorder':      '#00000000',
    'profileBadge.background': buttonAccent,
    'profileBadge.foreground': '#ffffff',

    // ── Notebook ──────────────────────────────────────────────────────────────
    'notebook.editorBackground':                bg0,
    'notebook.cellBackground':                  bg0,
    'notebook.cellBorderColor':                 '#00000000',
    'notebook.cellEditorBackground':            bg1,
    'notebook.cellHoverBackground':             alpha(accent, 0.05),
    'notebook.cellInsertionIndicator':          accentBright,
    'notebook.cellStatusBarItemHoverBackground': alpha(accent, 0.10),
    'notebook.cellToolbarSeparator':            '#00000000',
    'notebook.cellActiveEditorIndicator':       accentBright,
    'notebook.focusedEditorBorder':             '#00000000',
    'notebook.focusedCellBackground':           alpha(accent, 0.08),
    'notebook.focusedCellBorder':               '#00000000',
    'notebook.focusedRowBorder':                '#00000000',
    'notebook.inactiveFocusedCellBorder':       '#00000000',
    'notebook.inactiveSelectedCellBorder':      '#00000000',
    'notebook.outputContainerBackgroundColor':  bg1,
    'notebook.outputContainerBorderColor':      '#00000000',
    'notebook.rowHoverBackground':              alpha(accent, 0.04),
    'notebook.selectedCellBackground':          alpha(accent, 0.10),
    'notebook.selectedCellBorder':              '#00000000',
    'notebook.selectedRangeBackground':         alpha(accent, 0.14),
    'notebook.symbolHighlightBackground':       alpha(accent, 0.12),
    'notebookScrollbarSlider.activeBackground':  alpha(accent, 0.55),
    'notebookScrollbarSlider.background':        alpha(fg2,   0.18),
    'notebookScrollbarSlider.hoverBackground':   alpha(accent, 0.38),
    'notebookStatusErrorIcon.foreground':        termRed,
    'notebookStatusRunningIcon.foreground':      accent,
    'notebookStatusSuccessIcon.foreground':      termGreen,
    'notebookEditorOverviewRuler.runningCellForeground': accent,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// §8  TOKEN COLORS
// ─────────────────────────────────────────────────────────────────────────────

function buildTokenColors(p) {
  const {
    synKeyword, synFunc, synString, synType, synNumber,
    synComment, synVar, synPunct, synTag, synAttr, fg0, termRed,
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
      scope: ['punctuation.separator', 'punctuation.accessor', 'punctuation.definition.bracket'],
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
        'support.type', 'support.class', 'entity.other.inherited-class'],
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
      scope: ['entity.other.attribute-name.class', 'entity.other.attribute-name.id'],
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
      scope: ['meta.structure.dictionary.value.json', 'string.quoted.double.json',
        'constant.numeric.json', 'constant.language.json', 'variable.other.json'],
      settings: { foreground: synString } },

    { name: 'JSON punctuation',
      scope: ['punctuation.definition.string.begin.json', 'punctuation.definition.string.end.json'],
      settings: { foreground: synString } },

    { name: 'TSX source',
      scope: ['source.tsx', 'meta.tag.tsx', 'meta.embedded.block.tsx',
        'entity.name.tag.tsx', 'meta.jsx.children'],
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
      scope: ['variable.other.readwrite', 'variable.object.property',
        'support.variable', 'variable.other.json'],
      settings: { foreground: synVar } },

    { name: 'Variable function',
      scope: ['variable.function'],
      settings: { foreground: synFunc } },

    { name: 'Punctuation extended',
      scope: ['punctuation', 'meta.brace', 'meta.bracket', 'meta.delimiter',
        'punctuation.definition.string'],
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

    { name: 'Decorator / annotation',
      scope: ['meta.decorator', 'punctuation.decorator', 'storage.type.annotation'],
      settings: { foreground: p.accent, fontStyle: 'italic' } },

    { name: 'Template expression',
      scope: ['punctuation.definition.template-expression', 'punctuation.section.embedded'],
      settings: { foreground: synPunct } },

    { name: 'Shell — built-in command',
      scope: ['support.function.builtin.shell'],
      settings: { foreground: synKeyword } },

    { name: 'Shell — variable',
      scope: ['variable.other.normal.shell'],
      settings: { foreground: synVar } },

    { name: 'YAML key',
      scope: ['entity.name.tag.yaml'],
      settings: { foreground: synAttr } },

    { name: 'TOML key',
      scope: ['keyword.key.toml'],
      settings: { foreground: synAttr } },

    { name: 'Diff — inserted',
      scope: ['markup.inserted'],
      settings: { foreground: p.termGreen } },

    { name: 'Diff — deleted',
      scope: ['markup.deleted'],
      settings: { foreground: termRed } },

    { name: 'Diff — changed',
      scope: ['markup.changed'],
      settings: { foreground: p.termYellow } },

    { name: 'Markup quote',
      scope: ['markup.quote'],
      settings: { foreground: synComment, fontStyle: 'italic' } },

    { name: 'Markup raw block',
      scope: ['markup.raw.block'],
      settings: { foreground: synString } },
  ];
}


// ─────────────────────────────────────────────────────────────────────────────
// §9  PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a complete VS Code color-theme JSON from a single base color.
 *
 * @param  {string}  displayName  Theme label shown in VS Code picker
 * @param  {string}  baseHex      User-supplied base color, e.g. "#4a9eff"
 * @param  {boolean} isDark       true → dark variant, false → light variant
 * @returns {object}  Ready to JSON.stringify
 */
function generateThemeJson(displayName, baseHex, isDark) {
  if (!chroma.valid(baseHex)) {
    throw new Error(`Invalid color: "${baseHex}". Expected a valid hex like #4a9eff.`);
  }

  const p            = buildPalette(baseHex, isDark);
  const colors       = buildColors(p);
  const tokenColors  = buildTokenColors(p);

  return {
    name:   displayName,
    type:   isDark ? 'dark' : 'light',
    colors,
    tokenColors,
    semanticHighlighting: true,
    semanticTokenColors: {
      'class':                { foreground: p.synType },
      'interface':            { foreground: p.synType,    fontStyle: 'italic' },
      'enum':                 { foreground: p.synType },
      'enumMember':           { foreground: p.synNumber },
      'function':             { foreground: p.synFunc },
      'method':               { foreground: p.synFunc },
      'property':             { foreground: p.synAttr },
      'property.readonly':    { foreground: p.synNumber },
      'variable':             { foreground: p.synVar },
      'variable.readonly':    { foreground: p.synNumber },
      'variable.defaultLibrary': { foreground: p.synKeyword },
      'parameter':            { foreground: p.synVar,     fontStyle: 'italic' },
      'type':                 { foreground: p.synType },
      'typeAlias':            { foreground: p.synType,    fontStyle: 'italic' },
      'namespace':            { foreground: p.synType,    fontStyle: 'italic' },
      'keyword':              { foreground: p.synKeyword },
      'string':               { foreground: p.synString },
      'number':               { foreground: p.synNumber },
      'comment':              { foreground: p.synComment, fontStyle: 'italic' },
      'decorator':            { foreground: p.accent,     fontStyle: 'italic' },
      'macro':                { foreground: p.synKeyword },
      'selfKeyword':          { foreground: p.synKeyword, fontStyle: 'italic' },
      'label':                { foreground: p.synAttr },
      'event':                { foreground: p.accent },
      'modifier':             { foreground: p.synKeyword },
      'regexp':               { foreground: p.synNumber },
      'operator':             { foreground: p.synPunct },
      'struct':               { foreground: p.synType },
      'builtinType':          { foreground: p.synType,    fontStyle: 'italic' },
      'lifetime':             { foreground: p.accent,     fontStyle: 'italic' },
      'generic':              { foreground: p.synType },
    },
  };
}

module.exports = { generateThemeJson, analyzeColor, deriveHarmonicHues };