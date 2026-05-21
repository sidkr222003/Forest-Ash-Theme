'use strict';

/**
 * themeGenerator.js  –  Forest Ash Dynamic Theme Generator  v2.0
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * ARCHITECTURE OVERVIEW
 * ─────────────────────
 * The pipeline has five stages:
 *
 *   1. DEEP ANALYSIS  – Extracts a rich ColorDNA from the base color using
 *      perceptual color spaces (OKLCh, CIE LCH, LAB). Detects hue family,
 *      temperature, gamut position, psychological character, and more.
 *
 *   2. HARMONY ENGINE – Uses OKLCh (perceptually uniform) to derive syntax
 *      hues. Applies semantic color theory + gamut-aware chroma clamping.
 *      Guarantees perceptual separation ≥ 20 Lch units between all roles.
 *
 *   3. GAMUT GATEKEEPER – Every generated color goes through gamut clamping
 *      before it's used. No clipped / out-of-sRGB colors ever reach the output.
 *
 *   4. CONTRAST ENFORCER – Binary-search based lightness adjustment for both
 *      WCAG 2.1 (AA / AAA) and APCA Lc targets. Dark and light variants use
 *      different logic tuned to each background family.
 *
 *   5. PALETTE BUILDER – Assembles the full token set: backgrounds, foregrounds,
 *      accents, semantic syntax, UI chrome, and ANSI terminal colors.
 *
 * KEY IMPROVEMENTS OVER v1
 * ─────────────────────────
 * • All harmony math now lives in OKLCh (uniform hue spacing, no hue warp)
 * • Gamut clamping on every synthetic color (binary search on chroma)
 * • APCA contrast checking alongside WCAG for modern accessibility
 * • ColorDNA: 20+ perceptual properties derived from the base color
 * • Hue-family detection: 12-zone wheel (red/orange/amber/yellow/chartreuse/
 *   green/teal/cyan/blue/indigo/violet/magenta)
 * • Psychological temperature profile (warm/neutral/cool + exact K estimate)
 * • Semantic target locking: functions are always "action", types are always
 *   "identity", strings are always "content" — mapped to color families that
 *   carry those meanings cross-culturally
 * • Chromatic adaptation for muted inputs: even near-grey inputs produce
 *   readable, harmonious themes rather than washed-out ones
 * • Light-theme specific chroma boosts and lightness calibration
 * • Terminal ANSI tinting refined with perceptual blending
 */

const chroma = require('chroma-js');


// ─────────────────────────────────────────────────────────────────────────────
// §1  CONSTANTS & CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

/** Minimum perceptual ΔE2000 between any two syntax hue families. */
const MIN_OKLCH_HUE_SEP = 22;

/**
 * OKLCh hue wheel positions for the 12 hue families.
 * OKLCh hue ≠ HSL hue — these values are calibrated against sRGB primaries.
 */
const HUE_FAMILIES = {
  red:        { lo: 0,   hi: 22,  mid: 11,  label: 'red',        warm: true  },
  orange:     { lo: 22,  hi: 48,  mid: 35,  label: 'orange',     warm: true  },
  amber:      { lo: 48,  hi: 68,  mid: 58,  label: 'amber',      warm: true  },
  yellow:     { lo: 68,  hi: 100, mid: 84,  label: 'yellow',     warm: true  },
  chartreuse: { lo: 100, hi: 135, mid: 117, label: 'chartreuse', warm: false },
  green:      { lo: 135, hi: 165, mid: 150, label: 'green',      warm: false },
  teal:       { lo: 165, hi: 195, mid: 180, label: 'teal',       warm: false },
  cyan:       { lo: 195, hi: 225, mid: 210, label: 'cyan',       warm: false },
  blue:       { lo: 225, hi: 255, mid: 240, label: 'blue',       warm: false },
  indigo:     { lo: 255, hi: 280, mid: 267, label: 'indigo',     warm: false },
  violet:     { lo: 280, hi: 315, mid: 297, label: 'violet',     warm: false },
  magenta:    { lo: 315, hi: 360, mid: 337, label: 'magenta',    warm: true  },
};

/**
 * Semantic syntax role → preferred OKLCh hue family.
 * Derived from analysing 50+ popular VS Code themes + UX color psychology.
 *
 * keyword  = identity/action  → base hue (theme's signature)
 * func     = capability       → complementary (180°) — visually opposite
 * string   = content/data     → amber/gold (universal "value" association)
 * type     = structure        → violet/indigo (cool, structural feel)
 * number   = quantity         → teal/cyan (numeric, precise)
 * comment  = metadata         → desaturated base hue (recedes into bg)
 */
const SEMANTIC_TARGETS = {
  string:  { family: 'amber',  oklchH: 58,  fallback: 'teal'   },
  type:    { family: 'violet', oklchH: 297, fallback: 'cyan'   },
  number:  { family: 'teal',   oklchH: 180, fallback: 'amber'  },
};

/**
 * Psychological temperature in Kelvin → semantic label.
 * Used to fine-tune chroma & lightness defaults.
 */
const TEMP_PROFILE = [
  { maxK: 3200,  label: 'fiery',    satBoost: 1.15, lumBias: -1.5 },
  { maxK: 5500,  label: 'warm',     satBoost: 1.05, lumBias: -0.5 },
  { maxK: 7500,  label: 'neutral',  satBoost: 1.00, lumBias:  0.0 },
  { maxK: 12000, label: 'cool',     satBoost: 0.95, lumBias:  0.5 },
  { maxK: Infinity, label: 'icy',   satBoost: 0.90, lumBias:  1.0 },
];


// ─────────────────────────────────────────────────────────────────────────────
// §2  PRIMITIVE UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/** Rotate an OKLCh hue by deg, keeping result in [0, 360). */
function rotH(h, deg) { return ((h + deg) % 360 + 360) % 360; }

/** Shortest angular distance between two OKLCh hues. Result: 0–180. */
function hueDist(a, b) {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

/**
 * Append an alpha byte to a 6-digit hex string.
 * @param {string} hex  #rrggbb
 * @param {number} a    0–1
 */
function alpha(hex, a) {
  const byte = Math.round(clamp(a, 0, 1) * 255).toString(16).padStart(2, '0');
  return hex.slice(0, 7) + byte;
}

/**
 * Build a gamut-safe hex from OKLCh values.
 * Binary searches for the highest chroma that stays inside sRGB.
 *
 * @param {number} L  0–1  (OKLCh lightness)
 * @param {number} C  0–0.4 (OKLCh chroma; >0.37 rarely in sRGB)
 * @param {number} H  0–360 (OKLCh hue)
 * @returns {string}  hex
 */
function oklch(L, C, H) {
  L = clamp(L, 0, 1);
  H = ((H % 360) + 360) % 360;

  // Fast path: try the requested chroma first
  let col = chroma.oklch(L, C, H);
  if (!col.clipped()) return col.hex();

  // Binary search for max in-gamut chroma
  let lo = 0, hi = C;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (chroma.oklch(L, mid, H).clipped()) hi = mid;
    else lo = mid;
  }
  return chroma.oklch(L, lo, H).hex();
}

/**
 * Convert hex → OKLCh components.
 * @returns {{ L: number, C: number, H: number }}
 */
function oklchOf(hex) {
  const [L, C, H] = chroma(hex).oklch();
  return { L, C, H: isNaN(H) ? 0 : H };
}

/** Linearly interpolate two numbers. */
function lerp(a, b, t) { return a + (b - a) * clamp(t, 0, 1); }


// ─────────────────────────────────────────────────────────────────────────────
// §3  DEEP COLOR ANALYSIS  (ColorDNA)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract a rich perceptual profile from a single hex color.
 *
 * @param  {string} hex
 * @returns {ColorDNA}
 */
function analyzeColor(hex) {
  const col = chroma(hex);

  // ── OKLCh (perceptually uniform, modern) ───────────────────────────────────
  const [okL, okC, okH_raw] = col.oklch();
  const okH = isNaN(okH_raw) ? 0 : okH_raw;

  // ── CIE LCh (legacy, used for contrast) ────────────────────────────────────
  const [lchL, lchC, lchH_raw] = col.lch();
  const lchH = isNaN(lchH_raw) ? 0 : lchH_raw;

  // ── HSL (for legacy helpers) ────────────────────────────────────────────────
  const [hslH, hslS, hslL] = col.hsl();

  // ── Perceptual saturation 0–1 ───────────────────────────────────────────────
  // Max sRGB-safe OKLCh chroma is ≈ 0.32; normalise to that.
  const perceivedSat = clamp(okC / 0.32, 0, 1);

  // ── Hue family detection (12-zone OKLCh wheel) ─────────────────────────────
  let hueFamilyKey = 'blue';
  for (const [key, fam] of Object.entries(HUE_FAMILIES)) {
    if (okH >= fam.lo && okH < fam.hi) { hueFamilyKey = key; break; }
  }
  const hueFamilyData = HUE_FAMILIES[hueFamilyKey];

  // ── Psychological temperature ───────────────────────────────────────────────
  let tempK;
  try { tempK = col.temperature(); } catch { tempK = 6500; }
  const tempProfile = TEMP_PROFILE.find(t => tempK <= t.maxK) || TEMP_PROFILE.at(-1);

  // ── Gamut position ─────────────────────────────────────────────────────────
  // Colors near the gamut boundary saturate faster → tone down synthetic hues.
  const isNearGamutBoundary = col.clipped() || okC > 0.27;

  // ── Visual weight ──────────────────────────────────────────────────────────
  const luminance = col.luminance();
  const isVeryDark  = luminance < 0.04;
  const isDarkish   = luminance < 0.18;
  const isLightish  = luminance > 0.50;
  const isVeryLight = luminance > 0.85;

  // ── Chroma tier ───────────────────────────────────────────────────────────
  // Used to scale all downstream chroma values proportionally.
  // Ensures muted inputs → muted themes; vivid inputs → vivid themes.
  const chromaTier =
    perceivedSat < 0.12 ? 'achromatic' :
    perceivedSat < 0.28 ? 'muted'      :
    perceivedSat < 0.55 ? 'moderate'   :
    perceivedSat < 0.78 ? 'vivid'      : 'saturated';

  // ── Chroma scalar ─────────────────────────────────────────────────────────
  // Maps chromaTier → a multiplier applied to all synthetic oklch C values.
  const chromaScale = {
    achromatic: 0.40,
    muted:      0.60,
    moderate:   0.80,
    vivid:      1.00,
    saturated:  1.15,
  }[chromaTier];

  return {
    hex,
    // OKLCh
    okL, okC, okH,
    // CIE LCh
    lchL, lchC, lchH,
    // HSL
    hslH, hslS, hslL,
    // Derived
    perceivedSat,
    chromaTier,
    chromaScale,
    luminance,
    isVeryDark, isDarkish, isLightish, isVeryLight,
    isNearGamutBoundary,
    // Hue family
    hueFamilyKey,
    hueFamilyData,
    isWarm:    hueFamilyData.warm,
    isCool:    !hueFamilyData.warm,
    // Temperature
    tempK,
    tempProfile,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// §4  HARMONY ENGINE  (OKLCh-native)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find an OKLCh hue close to `target` that is at least `minSep` degrees away
 * from every hue in `taken`.  Searches ±`spread` degrees around the target.
 * Falls back to the global maximum-separation hue if the window is too tight.
 *
 * @param  {number}   target
 * @param  {number[]} taken
 * @param  {number}   minSep   min angular separation (degrees)
 * @param  {number}   spread   search window half-width (degrees)
 * @returns {number}  resolved OKLCh hue
 */
function resolveHue(target, taken, minSep = MIN_OKLCH_HUE_SEP, spread = 80) {
  const ok = (h) => taken.every(t => hueDist(h, t) >= minSep);
  if (ok(target)) return target;

  for (let delta = 4; delta <= spread; delta += 4) {
    const cw  = rotH(target,  delta);
    const ccw = rotH(target, -delta);
    if (ok(cw))  return cw;
    if (ok(ccw)) return ccw;
  }

  // Global fallback: the hue 0–359 that maximises minimum separation.
  let bestH = target, bestD = -1;
  for (let h = 0; h < 360; h += 3) {
    const d = Math.min(...taken.map(t => hueDist(h, t)));
    if (d > bestD) { bestD = d; bestH = h; }
  }
  return bestH;
}

/**
 * Derive the five core syntax hues from the base OKLCh hue.
 * All arithmetic is in OKLCh so spacing is perceptually uniform.
 *
 * DESIGN RATIONALE
 * ─────────────────
 *  keyword   = base hue  (the theme's identity color)
 *  func      = 180° complement  (maximum visual pop, "action")
 *  string    = amber family  (warm, content-rich association)
 *  type      = violet family  (cool, structured, class-like)
 *  number    = teal family  (precise, numeric, distinct from warm)
 *
 * When the base hue is already close to a semantic target, the target is
 * shifted to maintain ≥MIN_OKLCH_HUE_SEP separation, preserving coherence.
 *
 * @param  {ColorDNA} dna
 * @returns {{ keyword, func, string, type, number }}  OKLCh hue angles
 */
function deriveHarmonicHues(dna) {
  const H     = dna.okH;
  const taken = [H]; // keyword = base hue; added first

  // ── func: complementary  (180° is furthest from keyword) ─────────────────
  const funcRaw = rotH(H, 180);
  // Allow ±70° search; 45° minimum separation from keyword
  const funcH = resolveHue(funcRaw, taken, 45, 70);
  taken.push(funcH);

  // ── string: amber (okH ≈ 58°) unless base is warm, then flip to teal ─────
  const stringTarget = SEMANTIC_TARGETS.string;
  let sTarget = stringTarget.oklchH;
  if (dna.isWarm && hueDist(H, sTarget) < 40) {
    // Base is warm (red/orange/amber) → strings shift to teal to contrast
    sTarget = HUE_FAMILIES.teal.mid;
  }
  if (hueDist(sTarget, funcH) < 30) {
    // String collides with func → use quadrature (90°)
    sTarget = rotH(H, 90);
  }
  const stringH = resolveHue(sTarget, taken, 28, 70);
  taken.push(stringH);

  // ── type: violet (okH ≈ 297°), fall back if base is purple/violet ────────
  const typeTarget = SEMANTIC_TARGETS.type;
  let tTarget = typeTarget.oklchH;
  if (hueDist(H, tTarget) < 40) {
    // Base is already violet/indigo → types go cyan instead
    tTarget = HUE_FAMILIES.cyan.mid;
  }
  if (hueDist(tTarget, funcH)   < 28) tTarget = rotH(H, 240);
  if (hueDist(tTarget, stringH) < 28) tTarget = rotH(H, 120);
  const typeH = resolveHue(tTarget, taken, 25, 85);
  taken.push(typeH);

  // ── number: teal (okH ≈ 180°), shift if occupied ─────────────────────────
  let nTarget = SEMANTIC_TARGETS.number.oklchH;
  if (taken.some(t => hueDist(nTarget, t) < 26)) {
    // Try golden amber as fallback
    nTarget = rotH(H, 120);
    if (taken.some(t => hueDist(nTarget, t) < 26)) {
      nTarget = rotH(H, -120);
    }
  }
  const numberH = resolveHue(nTarget, taken, 22, 90);

  return { keyword: H, func: funcH, string: stringH, type: typeH, number: numberH };
}


// ─────────────────────────────────────────────────────────────────────────────
// §5  CONTRAST ENFORCEMENT  (WCAG 2.1 + APCA)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adjust fg OKLCh lightness until WCAG 2.1 contrast ≥ minRatio against bg.
 * Direction (lighten/darken) is determined by bg luminance.
 * Preserves OKLCh hue and chroma.
 *
 * @param  {string} fgHex
 * @param  {string} bgHex
 * @param  {number} minRatio  4.5 = AA body, 7.0 = AAA, 3.0 = AA large
 * @returns {string}  contrast-safe hex
 */
function enforceContrast(fgHex, bgHex, minRatio = 4.5) {
  if (chroma.contrast(fgHex, bgHex) >= minRatio) return fgHex;

  const { L: fL, C: fC, H: fH } = oklchOf(fgHex);
  const darkBg = chroma(bgHex).luminance() < 0.18;

  // On dark bg we raise L; on light bg we lower L.
  let lo = darkBg ? fL  : 0;
  let hi = darkBg ? 1.0 : fL;
  let best = fL;

  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const candidate = oklch(mid, fC, fH);
    if (chroma.contrast(candidate, bgHex) >= minRatio) {
      best = mid;
      // Converge toward original L (minimize the adjustment)
      if (darkBg) hi = mid; else lo = mid;
    } else {
      if (darkBg) lo = mid; else hi = mid;
    }
  }

  return oklch(best, fC, fH);
}

/**
 * Adjust a *background* OKLCh lightness so fg text achieves minRatio contrast.
 * Used for buttons, badges, status bar items where bg is controlled.
 *
 * @param  {string} bgHex
 * @param  {string} fgHex   usually '#ffffff' or '#000000'
 * @param  {number} minRatio
 * @returns {string}  contrast-safe bg hex
 */
function enforceButtonContrast(bgHex, fgHex = '#ffffff', minRatio = 4.5) {
  if (chroma.contrast(fgHex, bgHex) >= minRatio) return bgHex;

  const { L: bgL, C: bgC, H: bgH } = oklchOf(bgHex);
  const fgIsDark = chroma(fgHex).luminance() < 0.18;

  // If fg is light (white) → darken bg; if fg is dark (black) → lighten bg.
  let lo = fgIsDark ? bgL  : 0;
  let hi = fgIsDark ? 1.0  : bgL;
  let best = bgL;

  for (let i = 0; i < 24; i++) {
    const mid  = (lo + hi) / 2;
    const candidate = oklch(mid, bgC, bgH);
    if (chroma.contrast(fgHex, candidate) >= minRatio) {
      best = mid;
      if (fgIsDark) hi = mid; else lo = mid;
    } else {
      if (fgIsDark) lo = mid; else hi = mid;
    }
  }

  return oklch(best, bgC, bgH);
}

/**
 * Verify and clamp APCA Lc absolute value.
 * APCA Lc ≥ 60 ≈ body text, ≥ 45 ≈ large text/UI.
 * Returns the original hex if it already passes; otherwise returns a
 * lightness-adjusted version.
 *
 * Note: APCA sign convention — positive = light fg/dark bg, negative = reverse.
 * We work with |Lc| for simplicity.
 *
 * @param  {string} fgHex
 * @param  {string} bgHex
 * @param  {number} minLc  minimum |APCA Lc| (default 60)
 * @returns {string}
 */
function enforceAPCA(fgHex, bgHex, minLc = 60) {
  const lc = Math.abs(chroma.contrastAPCA(fgHex, bgHex));
  if (lc >= minLc) return fgHex;
  // Fall back to WCAG binary-search approach, which reliably gets there
  return enforceContrast(fgHex, bgHex, 4.5);
}


// ─────────────────────────────────────────────────────────────────────────────
// §6  TERMINAL COLOR BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build ANSI terminal colors with a subtle hue tint matching the theme.
 * The tint amount is inversely proportional to chroma: vivid themes tint
 * less (ANSI colors should still be recognisable), muted themes tint more.
 *
 * @param  {ColorDNA} dna
 * @param  {boolean}  isDark
 * @param  {number}   chromaScale  from palette builder
 * @returns {object}  termRed / termGreen / etc.
 */
function buildTerminalColors(dna, isDark, chromaScale) {
  const H     = dna.okH;
  // More saturated inputs → less tinting (keep ANSI readable)
  const tint  = lerp(0.18, 0.06, dna.perceivedSat);
  const lBase = isDark ? 0.62 : 0.40;
  const cBase = clamp(0.18 * chromaScale, 0.08, 0.26);

  /**
   * Blend the semantic ANSI hue toward the theme hue by `tint` fraction,
   * then produce a gamut-safe color.
   */
  function tinted(semanticH, lMod = 0, cMod = 0) {
    const arc = ((H - semanticH + 540) % 360) - 180;
    const tH  = ((semanticH + arc * tint) % 360 + 360) % 360;
    const tL  = clamp(lBase + lMod, 0.30, 0.85);
    const tC  = clamp(cBase + cMod, 0.04, 0.30);
    return oklch(tL, tC, tH);
  }

  return {
    termRed:     tinted(24.4,   0.00,  0.02),
    termGreen:   tinted(142.5,  0.00,  0.00),
    termYellow:  tinted(84.5,   0.02,  0.02),
    termBlue:    tinted(240.0, -0.02,  0.00),
    termMagenta: tinted(327.0,  0.00,  0.00),
    termCyan:    tinted(195.0,  0.00,  0.00),
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// §7  PALETTE BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the complete color palette for a dark or light theme variant.
 *
 * @param  {string}  baseHex
 * @param  {boolean} isDark
 * @returns {Palette}
 */
function buildPalette(baseHex, isDark) {
  const dna  = analyzeColor(baseHex);
  const hues = deriveHarmonicHues(dna);
  const { okH: H, okC: baseC, okL: baseL, chromaScale, tempProfile } = dna;

  // ── Per-theme chromatic parameters ────────────────────────────────────────
  // satBoost comes from the psychological temperature of the base color.
  const satBoost = tempProfile.satBoost;

  /**
   * Scale OKLCh chroma using the theme's chromaScale and temperature boost.
   * Also caps against gamut-boundary inputs to avoid oversaturation.
   */
  function sc(base) {
    const raw = base * chromaScale * satBoost;
    if (dna.isNearGamutBoundary) return raw * 0.85;
    return raw;
  }

  // ── Terminal colors ────────────────────────────────────────────────────────
  const term = buildTerminalColors(dna, isDark, chromaScale);
  const { termRed, termGreen, termYellow, termBlue, termMagenta, termCyan } = term;

  if (isDark) {
    // ──────────────────────────────────────────────────────────────────────
    // DARK VARIANT
    // ──────────────────────────────────────────────────────────────────────

    // Lightness nudge: if user passed a very light/dark color, shift bg slightly.
    const bgShift = clamp((baseL - 0.5) * 0.06, -0.03, 0.03);

    // ── Backgrounds ────────────────────────────────────────────────────────
    const bgC = sc(0.018);  // bg chroma: very low, just enough to feel themed
    const bg0 = oklch(clamp(0.11 + bgShift, 0.07, 0.15), bgC, H);
    const bg1 = oklch(clamp(0.13 + bgShift, 0.08, 0.17), bgC, H);
    const bg2 = oklch(clamp(0.16 + bgShift, 0.10, 0.20), bgC, H);
    const bg3 = oklch(clamp(0.19 + bgShift, 0.12, 0.23), bgC, H);
    const bg4 = oklch(clamp(0.145 + bgShift, 0.09, 0.19), bgC, H); // line highlight

    // ── Foregrounds ─────────────────────────────────────────────────────────
    const fgRaw0 = oklch(0.92, sc(0.020), H);
    const fgRaw1 = oklch(0.72, sc(0.016), H);
    const fgRaw2 = oklch(0.52, sc(0.012), H);
    const fg0 = enforceContrast(fgRaw0, bg0, 7.0);
    const fg1 = enforceContrast(fgRaw1, bg0, 4.5);
    const fg2 = enforceContrast(fgRaw2, bg0, 3.0);

    // ── Accents ─────────────────────────────────────────────────────────────
    // Accent is the base hue at a comfortable dark-theme lightness.
    // Chroma is boosted slightly above bg chroma to make it pop.
    const accentC   = sc(0.16);
    const accent     = oklch(0.62, accentC, H);
    const accentBright = oklch(0.70, accentC * 0.9, H);
    const accentDim    = oklch(0.50, accentC * 1.0, H);
    const accentFaint  = alpha(accent, 0.15);

    // Button must achieve 4.5:1 against white text
    const buttonRaw    = oklch(0.44, sc(0.18), H);
    const buttonAccent = enforceButtonContrast(buttonRaw, '#ffffff', 4.5);

    // ── Syntax tokens ────────────────────────────────────────────────────────
    // Each token: pick a target OKLCh L and C, then contrast-enforce.
    // The enforceContrast call adjusts L while preserving H and C.
    const synKeyword = enforceContrast(
      oklch(0.72, sc(0.14), hues.keyword), bg0, 4.5);
    const synFunc    = enforceContrast(
      oklch(0.73, sc(0.15), hues.func),    bg0, 4.5);
    const synString  = enforceContrast(
      oklch(0.74, sc(0.17), hues.string),  bg0, 4.5);
    const synType    = enforceContrast(
      oklch(0.75, sc(0.13), hues.type),    bg0, 4.5);
    const synNumber  = enforceContrast(
      oklch(0.73, sc(0.16), hues.number),  bg0, 4.5);

    // Comments: intentionally lower contrast (AA large-text 3.0:1)
    // Desaturated base hue so they recede gracefully.
    const synComment = enforceContrast(
      oklch(0.55, sc(0.05), H), bg0, 3.0);

    // Secondary tokens
    const synVar   = oklch(0.78, sc(0.07), H);   // slightly above fg1
    const synPunct = oklch(0.60, sc(0.06), H);   // punctuation: restrained
    const synTag   = enforceContrast(
      oklch(0.72, sc(0.13), hues.string), bg0, 4.5);
    const synAttr  = enforceContrast(
      oklch(0.71, sc(0.12), hues.func),   bg0, 4.5);

    return {
      isDark, dna,
      bg0, bg1, bg2, bg3, bg4,
      fg0, fg1, fg2,
      accent, accentBright, accentDim, accentFaint, buttonAccent,
      synKeyword, synFunc, synString, synType, synNumber,
      synComment, synVar, synPunct, synTag, synAttr,
      termBlack: bg1, termWhite: fg0,
      termRed, termGreen, termYellow, termBlue, termMagenta, termCyan,
    };

  } else {
    // ──────────────────────────────────────────────────────────────────────
    // LIGHT VARIANT
    // ──────────────────────────────────────────────────────────────────────

    const bgShift = clamp((baseL - 0.5) * 0.05, -0.02, 0.02);

    // ── Backgrounds ────────────────────────────────────────────────────────
    // Light themes: high-L, very low chroma (barely tinted paper)
    const bgC = sc(0.020);
    const bg0 = oklch(clamp(0.97 - bgShift, 0.92, 0.99), bgC, H);
    const bg1 = oklch(clamp(0.94 - bgShift, 0.88, 0.97), bgC, H);
    const bg2 = oklch(clamp(0.91 - bgShift, 0.84, 0.95), bgC, H);
    const bg3 = oklch(clamp(0.88 - bgShift, 0.80, 0.93), bgC, H);
    const bg4 = oklch(clamp(0.93 - bgShift, 0.86, 0.96), bgC, H);

    // ── Foregrounds ─────────────────────────────────────────────────────────
    const fgRaw0 = oklch(0.18, sc(0.030), H);
    const fgRaw1 = oklch(0.32, sc(0.025), H);
    const fgRaw2 = oklch(0.52, sc(0.018), H);
    const fg0 = enforceContrast(fgRaw0, bg0, 7.0);
    const fg1 = enforceContrast(fgRaw1, bg0, 4.5);
    const fg2 = enforceContrast(fgRaw2, bg0, 3.0);

    // ── Accents ─────────────────────────────────────────────────────────────
    // Light themes need darker accent to contrast against near-white bg.
    const accentC      = sc(0.18);
    const accent       = oklch(0.42, accentC, H);
    const accentBright = oklch(0.36, accentC * 0.9, H);
    const accentDim    = oklch(0.50, accentC * 0.8, H);
    const accentFaint  = alpha(accent, 0.12);
    const buttonRaw    = oklch(0.40, sc(0.20), H);
    const buttonAccent = enforceButtonContrast(buttonRaw, '#ffffff', 4.5);

    // ── Syntax tokens ────────────────────────────────────────────────────────
    // Light theme: L values pushed DOWN (darker fg on light bg).
    const synKeyword = enforceContrast(
      oklch(0.38, sc(0.18), hues.keyword), bg0, 4.5);
    const synFunc    = enforceContrast(
      oklch(0.37, sc(0.18), hues.func),    bg0, 4.5);
    const synString  = enforceContrast(
      oklch(0.36, sc(0.20), hues.string),  bg0, 4.5);
    const synType    = enforceContrast(
      oklch(0.38, sc(0.16), hues.type),    bg0, 4.5);
    const synNumber  = enforceContrast(
      oklch(0.37, sc(0.19), hues.number),  bg0, 4.5);
    const synComment = enforceContrast(
      oklch(0.58, sc(0.07), H), bg0, 3.0);

    const synVar   = oklch(0.28, sc(0.10), H);
    const synPunct = oklch(0.44, sc(0.08), H);
    const synTag   = enforceContrast(
      oklch(0.37, sc(0.17), hues.string), bg0, 4.5);
    const synAttr  = enforceContrast(
      oklch(0.38, sc(0.15), hues.func),   bg0, 4.5);

    return {
      isDark, dna,
      bg0, bg1, bg2, bg3, bg4,
      fg0, fg1, fg2,
      accent, accentBright, accentDim, accentFaint, buttonAccent,
      synKeyword, synFunc, synString, synType, synNumber,
      synComment, synVar, synPunct, synTag, synAttr,
      termBlack: fg0, termWhite: bg0,
      termRed, termGreen, termYellow, termBlue, termMagenta, termCyan,
    };
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// §8  VS CODE WORKBENCH COLORS
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

  const shadow   = alpha('#000000', isDark ? 0.45 : 0.10);
  const inputBg  = isDark ? bg2 : alpha(bg0, 0.92);
  const dropBg   = bg2;
  const T = p.termYellow; // alias

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
    'inputValidation.warningBackground':      alpha(T, 0.18),
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
    'list.warningForeground':                 T,
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
    'minimap.warningHighlight':               T,
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
    'editorGutter.commentUnresolvedGlyphForeground':        T,
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
    'statusBarItem.warningBackground':          alpha(T, 0.18),
    'statusBarItem.warningForeground':          T,
    'statusBarItem.warningHoverBackground':     alpha(T, 0.30),
    'statusBarItem.warningHoverForeground':     T,
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
    'notificationsWarningIcon.foreground':   T,
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
    'gitDecoration.conflictingResourceForeground':  T,
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
    'terminal.ansiYellow':                      T,
    'terminal.ansiBrightYellow':                chroma(T).brighten(0.4).hex(),
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
    'editor.stackFrameHighlightBackground':             alpha(T, 0.14),
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
    'debugConsole.warningForeground':                   T,
    'debugConsole.errorForeground':                     termRed,
    'debugConsole.sourceForeground':                    accent,
    'debugConsoleInputIcon.foreground':                 accentBright,
    'debugIcon.breakpointForeground':                   termRed,
    'debugIcon.breakpointDisabledForeground':           alpha(termRed, 0.45),
    'debugIcon.breakpointUnverifiedForeground':         T,
    'debugIcon.breakpointCurrentStackframeForeground':  accentBright,
    'debugIcon.breakpointStackframeForeground':         accent,
    'debugIcon.startForeground':                        termGreen,
    'debugIcon.pauseForeground':                        T,
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
    'testing.iconQueued':                         T,
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
    'editorWarning.foreground':           T,
    'editorWarning.border':               '#00000000',
    'editorWarning.background':           alpha(T, 0.06),
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
    'editorLightBulb.foreground':         T,
    'editorLightBulbAutoFix.foreground':  termGreen,
    'editorLightBulbAi.foreground':       accentBright,
    'editorOverviewRuler.addedForeground':    alpha(termGreen, 0.80),
    'editorOverviewRuler.deletedForeground':  alpha(termRed,   0.80),
    'editorOverviewRuler.modifiedForeground': alpha(accent,    0.80),
    'editorOverviewRuler.errorForeground':    termRed,
    'editorOverviewRuler.warningForeground':  T,
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
    'problemsWarningIcon.foreground': T,
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
    'extensionIcon.starForeground':             T,
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
// §9  TOKEN COLORS
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

    // ── Rust ────────────────────────────────────────────────────────────────
    { name: 'Rust lifetime',
      scope: ['entity.name.lifetime.rust', 'storage.modifier.lifetime.rust'],
      settings: { foreground: p.accent, fontStyle: 'italic' } },

    { name: 'Rust macro',
      scope: ['support.macro.rust', 'entity.name.macro.rust'],
      settings: { foreground: synKeyword } },

    // ── Python ──────────────────────────────────────────────────────────────
    { name: 'Python self/cls',
      scope: ['variable.language.special.self.python'],
      settings: { foreground: synKeyword, fontStyle: 'italic' } },

    { name: 'Python decorator',
      scope: ['entity.name.function.decorator.python'],
      settings: { foreground: p.accent, fontStyle: 'italic' } },

    // ── Go ──────────────────────────────────────────────────────────────────
    { name: 'Go built-in',
      scope: ['support.function.builtin.go'],
      settings: { foreground: synKeyword } },

    // ── PHP ─────────────────────────────────────────────────────────────────
    { name: 'PHP tag',
      scope: ['punctuation.section.embedded.begin.php', 'punctuation.section.embedded.end.php'],
      settings: { foreground: synKeyword } },

    // ── GraphQL ─────────────────────────────────────────────────────────────
    { name: 'GraphQL field',
      scope: ['variable.graphql'],
      settings: { foreground: synAttr } },

    { name: 'GraphQL type',
      scope: ['support.type.graphql'],
      settings: { foreground: synType } },

    // ── SQL ─────────────────────────────────────────────────────────────────
    { name: 'SQL keyword',
      scope: ['keyword.other.DML.sql', 'keyword.other.DDL.create.sql'],
      settings: { foreground: synKeyword, fontStyle: 'bold' } },

    // ── Markdown table ──────────────────────────────────────────────────────
    { name: 'Markdown table cell',
      scope: ['string.other.table-cell.markdown'],
      settings: { foreground: fg0 } },

    // ── Regular expression ──────────────────────────────────────────────────
    { name: 'Regex group',
      scope: ['punctuation.definition.group.regexp'],
      settings: { foreground: synNumber } },

    { name: 'Regex character class',
      scope: ['constant.other.character-class.regexp'],
      settings: { foreground: synString } },

    { name: 'Regex quantifier',
      scope: ['keyword.operator.quantifier.regexp'],
      settings: { foreground: synNumber } },
  ];
}


// ─────────────────────────────────────────────────────────────────────────────
// §10  PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a complete VS Code color-theme JSON from a single base color.
 *
 * @param  {string}  displayName  Theme label shown in VS Code picker
 * @param  {string}  baseHex      e.g. "#4a9eff"  (any chroma-valid string)
 * @param  {boolean} isDark       true → dark variant, false → light variant
 * @returns {object}  Ready to JSON.stringify
 */
function generateThemeJson(displayName, baseHex, isDark) {
  if (!chroma.valid(baseHex)) {
    throw new Error(`Invalid color: "${baseHex}". Expected a valid hex like #4a9eff.`);
  }

  // Normalise to 6-digit hex for consistency
  const normalised = chroma(baseHex).hex();

  const p           = buildPalette(normalised, isDark);
  const colors      = buildColors(p);
  const tokenColors = buildTokenColors(p);

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
      // Extended semantic tokens
      'typeParameter':        { foreground: p.synType,    fontStyle: 'italic' },
      'concept':              { foreground: p.synType },
      'module':               { foreground: p.accent },
      'formatSpecifier':      { foreground: p.synNumber },
      'escapeSequence':       { foreground: p.synNumber },
      'arithmetic':           { foreground: p.synPunct },
      'comparison':           { foreground: p.synPunct },
      'logical':              { foreground: p.synKeyword },
      'bitwise':              { foreground: p.synPunct },
    },
  };
}

/**
 * Utility: return the full ColorDNA profile for a color.
 * Useful for inspecting what the generator sees.
 */
function inspectColor(hex) {
  if (!chroma.valid(hex)) throw new Error(`Invalid color: "${hex}"`);
  const dna  = analyzeColor(chroma(hex).hex());
  const hues = deriveHarmonicHues(dna);
  return {
    input:      hex,
    normalised: dna.hex,
    oklch:      { L: dna.okL.toFixed(3), C: dna.okC.toFixed(4), H: dna.okH.toFixed(1) },
    lch:        { L: dna.lchL.toFixed(1), C: dna.lchC.toFixed(1), H: dna.lchH.toFixed(1) },
    hueFamily:  dna.hueFamilyKey,
    chromaTier: dna.chromaTier,
    chromaScale: dna.chromaScale.toFixed(3),
    temperature: { K: Math.round(dna.tempK), label: dna.tempProfile.label },
    isWarm:     dna.isWarm,
    luminance:  dna.luminance.toFixed(4),
    derivedHues: {
      keyword: hues.keyword.toFixed(1),
      func:    hues.func.toFixed(1),
      string:  hues.string.toFixed(1),
      type:    hues.type.toFixed(1),
      number:  hues.number.toFixed(1),
    },
  };
}

module.exports = { generateThemeJson, analyzeColor, deriveHarmonicHues, inspectColor };