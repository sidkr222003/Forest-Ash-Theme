'use strict';

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, match => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[match]);
}

function normalizeScopeList(scope) {
  if (!scope) return [];
  return Array.isArray(scope) ? scope : [scope];
}

function extractSyntaxColors(themeJson) {
  const fallback = themeJson?.colors?.['editor.foreground'] || '#cccccc';
  const result = {
    comment: fallback,
    string: fallback,
    keyword: fallback,
    function: fallback,
    type: fallback,
    number: fallback,
    variable: fallback,
  };

  const rules = themeJson?.tokenColors || [];

  const pick = (keys) => {
    for (const rule of rules) {
      const scopes = normalizeScopeList(rule.scope).map(s => String(s).toLowerCase());
      if (!scopes.length) continue;
      const match = keys.some(key => scopes.some(scope => scope.includes(key)));
      if (match && rule.settings?.foreground) return rule.settings.foreground;
    }
    return null;
  };

  result.comment = pick(['comment']) || result.comment;
  result.string = pick(['string']) || result.string;
  result.keyword = pick(['keyword', 'storage']) || result.keyword;
  result.function = pick(['entity.name.function', 'support.function']) || result.function;
  result.type = pick(['entity.name.type', 'support.type', 'entity.name.class']) || result.type;
  result.number = pick(['constant.numeric']) || result.number;
  result.variable = pick(['variable']) || result.variable;

  return result;
}

function buildThemePreviewHtml(cards) {
  const cardHtml = cards.map(card => {
    const sample = `\
<span class="kw">function</span> <span class="fn">kintsugi</span>(<span class="var">ash</span>) {\n\
  <span class="com">// restore broken lines</span>\n\
  <span class="kw">const</span> <span class="var">veil</span> = <span class="str">"forest-ash"</span>;\n\
  <span class="kw">return</span> <span class="fn">polish</span>(<span class="var">ash</span>) + <span class="num">7</span>;\n\
}`;

    return `
      <article class="card" style="--bg:${escHtml(card.bg)};--fg:${escHtml(card.fg)};--accent:${escHtml(card.accent)};--comment:${escHtml(card.syntax.comment)};--string:${escHtml(card.syntax.string)};--keyword:${escHtml(card.syntax.keyword)};--function:${escHtml(card.syntax.function)};--type:${escHtml(card.syntax.type)};--number:${escHtml(card.syntax.number)};--variable:${escHtml(card.syntax.variable)};">
        <div class="card-header">
          <div>
            <div class="title">${escHtml(card.label)}</div>
            <div class="meta">${escHtml(card.typeLabel)} Edition</div>
          </div>
          <button class="apply" data-theme="${escHtml(card.label)}">Apply</button>
        </div>
        <div class="swatch-strip">
          <span style="background:var(--accent)"></span>
          <span style="background:var(--string)"></span>
          <span style="background:var(--keyword)"></span>
          <span style="background:var(--function)"></span>
          <span style="background:var(--comment)"></span>
        </div>
        <pre class="code">${sample}</pre>
      </article>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Forest Ash Theme Preview</title>
<style>
  :root {
    color-scheme: light dark;
    --glass: rgba(16, 18, 20, 0.82);
    --glass-border: rgba(255, 255, 255, 0.08);
    --glow: rgba(0, 0, 0, 0.45);
    --ink: rgba(255, 255, 255, 0.08);
  }
  body {
    margin: 0;
    min-height: 100vh;
    font-family: "Palatino", "Book Antiqua", "Georgia", serif;
    color: var(--vscode-foreground);
    background:
      radial-gradient(800px circle at 15% 10%, rgba(255, 255, 255, 0.10), transparent 55%),
      radial-gradient(900px circle at 80% -10%, rgba(0, 0, 0, 0.35), transparent 60%),
      linear-gradient(150deg, rgba(15, 18, 21, 0.95), rgba(26, 30, 34, 0.85));
  }
  .backdrop {
    position: fixed;
    inset: 0;
    background: radial-gradient(700px circle at 70% 20%, rgba(255,255,255,0.06), transparent 60%);
    pointer-events: none;
  }
  .modal {
    position: relative;
    margin: 32px auto 48px auto;
    max-width: 1220px;
    padding: 28px;
    border-radius: 26px;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    box-shadow: 0 34px 90px var(--glow);
    backdrop-filter: blur(18px);
  }
  .hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 22px;
  }
  .hero-title {
    font-size: 26px;
    letter-spacing: 0.6px;
    margin: 0 0 6px 0;
  }
  .hero-sub {
    font-size: 13px;
    opacity: 0.75;
    margin: 0;
  }
  .hero-pills {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .pill {
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid var(--glass-border);
    background: rgba(255, 255, 255, 0.04);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 18px;
  }
  .card {
    background: linear-gradient(160deg, rgba(0,0,0,0.24), rgba(255,255,255,0.02)), var(--bg);
    color: var(--fg);
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.10);
    padding: 16px;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.30);
    transform: translateY(0);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .card:hover {
    transform: translateY(-6px);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .title {
    font-size: 15px;
    font-weight: 700;
  }
  .meta {
    font-size: 11px;
    opacity: 0.75;
  }
  .apply {
    background: linear-gradient(120deg, var(--accent), rgba(255,255,255,0.22));
    border: none;
    color: #fff;
    padding: 6px 12px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 11px;
    letter-spacing: 0.4px;
  }
  .swatch-strip {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    margin-bottom: 12px;
  }
  .swatch-strip span {
    height: 8px;
    border-radius: 999px;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);
  }
  .code {
    background: rgba(0, 0, 0, 0.24);
    padding: 12px;
    border-radius: 12px;
    margin: 0;
    font-family: var(--vscode-editor-font-family);
    font-size: 12px;
    line-height: 1.5;
    white-space: pre;
  }
  .com { color: var(--comment); font-style: italic; }
  .str { color: var(--string); }
  .kw { color: var(--keyword); font-weight: 600; }
  .fn { color: var(--function); }
  .type { color: var(--type); }
  .num { color: var(--number); }
  .var { color: var(--variable); }

  @media (max-width: 720px) {
    .modal { margin: 18px; padding: 20px; }
    .hero { flex-direction: column; align-items: flex-start; }
  }
  @media (prefers-reduced-motion: reduce) {
    .card { transition: none; }
  }
</style>
</head>
<body>
  <div class="backdrop"></div>
  <main class="modal">
    <div class="hero">
      <div>
        <h1 class="hero-title">Forest Ash Theme Preview</h1>
        <p class="hero-sub">A floating gallery of every Forest Ash palette. Apply instantly without leaving the preview.</p>
      </div>
      <div class="hero-pills">
        <span class="pill">${cards.length} Palettes</span>
        <span class="pill">Live Apply</span>
        <span class="pill">Forest Ash Studio</span>
      </div>
    </div>
    <div class="grid">
      ${cardHtml}
    </div>
  </main>
<script>
  const vscode = acquireVsCodeApi();
  document.querySelectorAll('button[data-theme]').forEach(button => {
    button.addEventListener('click', () => {
      vscode.postMessage({ type: 'applyTheme', label: button.dataset.theme });
    });
  });
</script>
</body>
</html>`;
}

function buildPaletteInspectorHtml(themeLabel, colors, options = {}) {
  const entries = Object.entries(colors || {});
  const emptyMessage = options.emptyMessage || 'Palette data is unavailable.';
  const subtitle = options.subtitle || 'Click any swatch to copy the color value.';

  const tiles = entries
    .map(([key, value]) => {
      return `
        <button class="tile" data-color="${escHtml(value)}">
          <span class="swatch" style="--swatch:${escHtml(value)}"></span>
          <span class="token">${escHtml(key)}</span>
          <span class="hex">${escHtml(value)}</span>
        </button>
      `;
    })
    .join('');

  const grid = entries.length
    ? `<div class="grid">${tiles}</div>`
    : `<div class="empty">${escHtml(emptyMessage)}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Forest Ash Palette Inspector</title>
<style>
  :root {
    color-scheme: light dark;
  }
  body {
    margin: 0;
    padding: 20px;
    font-family: "Palatino", "Book Antiqua", "Georgia", serif;
    color: var(--vscode-foreground);
    background:
      radial-gradient(700px circle at 10% 0%, rgba(255,255,255,0.08), transparent 60%),
      linear-gradient(165deg, var(--vscode-editor-background), rgba(0,0,0,0.18));
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }
  h1 {
    font-size: 18px;
    margin: 0;
  }
  .subtitle {
    font-size: 12px;
    opacity: 0.7;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }
  .tile {
    display: grid;
    gap: 8px;
    padding: 12px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    text-align: left;
    cursor: pointer;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }
  .tile:hover {
    transform: translateY(-3px);
    border-color: var(--vscode-focusBorder);
  }
  .swatch {
    height: 46px;
    border-radius: 10px;
    background: var(--swatch);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18);
  }
  .token {
    font-size: 11px;
    letter-spacing: 0.3px;
  }
  .hex {
    font-family: var(--vscode-editor-font-family);
    font-size: 11px;
    opacity: 0.75;
  }
  .tile.copied {
    border-color: rgba(120, 200, 170, 0.8);
    box-shadow: 0 0 0 1px rgba(120, 200, 170, 0.5);
  }
  .empty {
    padding: 18px;
    border-radius: 12px;
    border: 1px dashed rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    font-size: 12px;
  }
  @media (prefers-reduced-motion: reduce) {
    .tile { transition: none; }
  }
</style>
</head>
<body>
  <header>
    <div>
      <h1>${escHtml(themeLabel)} Palette</h1>
      <div class="subtitle">${escHtml(subtitle)}</div>
    </div>
  </header>
  ${grid}
<script>
  const vscode = acquireVsCodeApi();
  document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const value = tile.dataset.color;
      vscode.postMessage({ type: 'copy', value });
      tile.classList.add('copied');
      setTimeout(() => tile.classList.remove('copied'), 700);
    });
  });
</script>
</body>
</html>`;
}

// ─── Theme of the Week — VS Code native-style overlay ────────────────────────
//
// Designed to feel like a first-party VS Code modal: the command-palette chrome,
// tight information density, live mini editor mockup, colour palette row, and
// syntax token legend — all within a single self-contained HTML string.

function buildThemeOfWeekHtml(theme) {
  // Derive a predictable accent from the theme label (used for glow/highlight)
  // so the panel has colour personality even without reading the full theme JSON.
  // The caller may optionally pass theme.colors and theme.syntax for richer data.
  const colors  = theme.colors  || {};
  const syntax  = theme.syntax  || {};

  const bg      = colors['editor.background']       || '#1e2227';
  const fg      = colors['editor.foreground']        || '#abb2bf';
  const accent  = colors['editorCursor.foreground']  || colors['textLink.foreground'] || '#61afef';
  const comment = syntax.comment || colors['editorLineNumber.foreground'] || '#5c6370';
  const str     = syntax.string  || '#98c379';
  const kw      = syntax.keyword || '#c678dd';
  const fn      = syntax.function|| '#61afef';
  const num     = syntax.number  || '#d19a66';
  const variable= syntax.variable|| fg;

  // Derive a small palette strip from known color keys (fallback to accent tints)
  const paletteKeys = [
    ['editor.background',        bg],
    ['editor.foreground',        fg],
    ['editorCursor.foreground',  accent],
    ['statusBar.background',     colors['statusBar.background']     || accent],
    ['activityBar.background',   colors['activityBar.background']   || bg],
    ['tab.activeBackground',     colors['tab.activeBackground']     || bg],
    ['sideBar.background',       colors['sideBar.background']       || bg],
    ['titleBar.activeBackground',colors['titleBar.activeBackground']|| bg],
  ];

  const swatchHtml = paletteKeys.map(([label, hex]) => {
    // Perceived luminance for contrast-safe label
    let r = 0, g = 0, b = 0;
    try {
      const h = hex.replace('#','').slice(0,6);
      r = parseInt(h.slice(0,2),16); g = parseInt(h.slice(2,4),16); b = parseInt(h.slice(4,6),16);
    } catch(_) {}
    const lum  = (0.299*r + 0.587*g + 0.114*b);
    const text = lum > 128 ? '#111' : '#eee';
    return `<div class="sw-tile" title="${escHtml(label)}" style="background:${escHtml(hex)};color:${text};">
      <span class="sw-hex">${escHtml(hex.toUpperCase())}</span>
      <span class="sw-label">${escHtml(label.split('.').pop())}</span>
    </div>`;
  }).join('');

  // Token legend rows
  const tokens = [
    { role: 'Keyword',   color: kw,      sample: 'function · const · return' },
    { role: 'String',    color: str,     sample: '"forest-ash" · `template`' },
    { role: 'Function',  color: fn,      sample: 'kintsugi() · polish()' },
    { role: 'Number',    color: num,     sample: '42 · 3.14 · 0xff' },
    { role: 'Comment',   color: comment, sample: '// restore broken lines' },
  ];
  const tokenRows = tokens.map(t => `
    <div class="tok-row">
      <span class="tok-dot" style="background:${escHtml(t.color)};box-shadow:0 0 6px ${escHtml(t.color)}88;"></span>
      <span class="tok-role">${escHtml(t.role)}</span>
      <span class="tok-sample" style="color:${escHtml(t.color)};">${escHtml(t.sample)}</span>
    </div>`).join('');

  // Mini editor mockup (inline SVG-style using divs)
  const codeLines = [
    { parts: [
      { t: 'kw', v: 'function' }, { t: 'sp', v: ' ' },
      { t: 'fn', v: 'kintsugi' }, { t: 'pl', v: '(' },
      { t: 'vr', v: 'ash' },      { t: 'pl', v: ')' }, { t: 'sp', v: ' {' },
    ]},
    { parts: [
      { t: 'sp', v: '  ' },
      { t: 'cm', v: '// restore broken lines' },
    ]},
    { parts: [
      { t: 'sp', v: '  ' },
      { t: 'kw', v: 'const' }, { t: 'sp', v: ' ' },
      { t: 'vr', v: 'veil' },  { t: 'sp', v: ' = ' },
      { t: 'st', v: '"forest-ash"' }, { t: 'pl', v: ';' },
    ]},
    { parts: [
      { t: 'sp', v: '  ' },
      { t: 'kw', v: 'return' }, { t: 'sp', v: ' ' },
      { t: 'fn', v: 'polish' }, { t: 'pl', v: '(' },
      { t: 'vr', v: 'ash' },   { t: 'pl', v: ') + ' },
      { t: 'nm', v: '7' },     { t: 'pl', v: ';' },
    ]},
    { parts: [{ t: 'pl', v: '}' }] },
  ];

  const typeColorMap = { kw, fn, cm: comment, st: str, nm: num, vr: variable, pl: fg+'bb', sp: fg };
  const editorLines = codeLines.map((line, i) => {
    const spans = line.parts.map(p => {
      const c = typeColorMap[p.t] || fg;
      const style = `color:${escHtml(c)};${p.t === 'cm' ? 'font-style:italic;opacity:.75;' : ''}`;
      return `<span style="${style}">${escHtml(p.v)}</span>`;
    }).join('');
    return `<div class="ed-line">
      <span class="ed-ln">${i + 1}</span>
      <span class="ed-code">${spans}</span>
    </div>`;
  }).join('');

  const shortName = theme.label.replace(/^Forest Ash\s*/i, '') || theme.label;
  const isLight   = (theme.type || 'dark') === 'light';
  const typeTag   = isLight ? 'Light' : 'Dark';
  const iconHtml  = theme.icon
    ? `<img src="${escHtml(theme.icon)}" alt="Forest Ash icon" />`
    : '<span class="identity-fallback">FA</span>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Forest Ash · Theme of the Week</title>
<style>
/* ── Reset & base ─────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--vscode-font-family, 'Segoe UI', system-ui, sans-serif);
  font-size: 13px;
  line-height: 1.5;
  color: var(--vscode-foreground, #cccccc);
  background: var(--vscode-editor-background, #1e1e1e);
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0;
  overflow-x: hidden;
}

/* ── Scrim layer (mimics VS Code dialog backdrop) ─────────── */
.scrim {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(2px);
  z-index: 0;
}

/* ── Main panel — VS Code command-palette proportions ──────── */
.panel {
  position: relative;
  z-index: 1;
  margin: 48px auto;
  width: min(780px, calc(100vw - 32px));
  background: var(--vscode-quickInput-background, #252526);
  border: 1px solid var(--vscode-widget-border, #454545);
  border-radius: 6px;
  box-shadow:
    0 20px 60px rgba(0,0,0,0.65),
    0 0 0 1px rgba(255,255,255,0.04);
  overflow: hidden;
  animation: slideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-14px) scale(0.985); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}

/* ── Titlebar strip ────────────────────────────────────────── */
.titlebar {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 14px;
  height: 35px;
  background: var(--vscode-titleBar-activeBackground, #3c3c3c);
  border-bottom: 1px solid var(--vscode-widget-border, #454545);
  user-select: none;
}
.titlebar-dots {
  display: flex;
  gap: 6px;
  margin-right: 12px;
}
.dot {
  width: 12px; height: 12px;
  border-radius: 50%;
}
.dot-r { background: #ff5f57; }
.dot-y { background: #febc2e; }
.dot-g { background: #28c840; }
.titlebar-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: var(--vscode-titleBar-activeForeground, rgba(255,255,255,0.7));
  flex: 1;
}
.titlebar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.titlebar-badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${escHtml(accent)}22;
  color: ${escHtml(accent)};
  border: 1px solid ${escHtml(accent)}44;
}

/* ── Body layout ───────────────────────────────────────────── */
.body {
  display: grid;
  grid-template-columns: 1fr 220px;
  min-height: 0;
}

/* ── Left column ───────────────────────────────────────────── */
.left {
  padding: 20px 20px 20px 20px;
  border-right: 1px solid var(--vscode-widget-border, #454545);
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

/* ── Theme identity block ──────────────────────────────────── */
.identity {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.identity-icon {
  width: 44px; height: 44px;
  border-radius: 8px;
  background: ${escHtml(accent)}18;
  border: 1px solid ${escHtml(accent)}33;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.identity-icon img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  display: block;
}
.identity-fallback {
  font-weight: 700;
  letter-spacing: 0.6px;
  color: ${escHtml(accent)};
}
.identity-meta { flex: 1; min-width: 0; }
.identity-name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.2px;
  color: var(--vscode-foreground, #e8e8e8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.identity-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  font-size: 11px;
  color: var(--vscode-descriptionForeground, #9d9d9d);
}
.tag {
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  background: rgba(255,255,255,0.07);
}

/* ── Mood blurb ────────────────────────────────────────────── */
.mood {
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--vscode-descriptionForeground, #9d9d9d);
  padding: 12px 14px;
  background: rgba(255,255,255,0.03);
  border-radius: 4px;
  border-left: 2px solid ${escHtml(accent)}66;
}

/* ── Mini editor mockup ─────────────────────────────────────── */
.editor-mockup {
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
  background: ${escHtml(bg)};
  flex-shrink: 0;
}
.ed-topbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: ${escHtml(bg)}f0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.ed-tab {
  font-size: 11px;
  padding: 2px 10px 2px;
  border-radius: 3px 3px 0 0;
  color: ${escHtml(fg)};
  background: ${escHtml(bg)};
  border-bottom: 2px solid ${escHtml(accent)};
  opacity: 0.9;
}
.ed-body {
  display: flex;
  padding: 8px 0 10px;
  font-family: var(--vscode-editor-font-family, 'Cascadia Code', 'Fira Code', monospace);
  font-size: 12px;
  line-height: 1.7;
}
.ed-gutter {
  padding: 0 10px 0 12px;
  text-align: right;
  color: ${escHtml(fg)}44;
  font-size: 11px;
  user-select: none;
  min-width: 36px;
  flex-shrink: 0;
}
.ed-lines { flex: 1; padding-right: 12px; overflow-x: auto; }
.ed-line { display: flex; align-items: baseline; white-space: pre; }
.ed-ln {
  display: block;
  line-height: 1.7;
  font-size: 11px;
  color: ${escHtml(fg)}44;
  text-align: right;
  padding-right: 10px;
  min-width: 24px;
  flex-shrink: 0;
  user-select: none;
}
.ed-code { flex: 1; }
.ed-statusbar {
  display: flex;
  align-items: center;
  padding: 0 10px;
  height: 20px;
  background: ${escHtml(accent)};
  font-size: 10px;
  color: #fff;
  gap: 10px;
  opacity: 0.92;
}

/* ── Token legend ────────────────────────────────────────────── */
.legend-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--vscode-descriptionForeground, #777);
  margin-bottom: 8px;
}
.tok-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.tok-row:last-child { border-bottom: none; }
.tok-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.tok-role {
  font-size: 11px;
  font-weight: 600;
  width: 66px;
  flex-shrink: 0;
  color: var(--vscode-foreground, #ccc);
  opacity: 0.8;
}
.tok-sample {
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 10.5px;
  opacity: 0.85;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Right column ─────────────────────────────────────────── */
.right {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

/* ── Section labels ──────────────────────────────────────── */
.section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--vscode-descriptionForeground, #777);
  margin-bottom: 8px;
}

/* ── Palette strip ───────────────────────────────────────── */
.palette-grid {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.sw-tile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.1s, border-color 0.1s;
  gap: 6px;
}
.sw-tile:hover {
  transform: scale(1.02);
  border-color: rgba(255,255,255,0.15);
}
.sw-tile.copied {
  border-color: rgba(120,200,170,0.7);
}
.sw-hex {
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  opacity: 0.95;
}
.sw-label {
  font-size: 9px;
  opacity: 0.75;
  text-align: right;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Stats block ─────────────────────────────────────────── */
.stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  font-size: 11px;
}
.stat-row:last-child { border-bottom: none; }
.stat-key { color: var(--vscode-descriptionForeground, #888); }
.stat-val { font-weight: 600; color: var(--vscode-foreground, #ddd); }

/* ── Action footer ─────────────────────────────────────────── */
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid var(--vscode-widget-border, #454545);
  background: rgba(0,0,0,0.12);
}
.footer-left {
  font-size: 11px;
  color: var(--vscode-descriptionForeground, #888);
}
.footer-left kbd {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.06);
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 10px;
}
.footer-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.btn {
  padding: 6px 14px;
  border-radius: 3px;
  border: none;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  letter-spacing: 0.2px;
  transition: opacity 0.15s, background 0.15s;
  font-family: inherit;
}
.btn:hover { opacity: 0.88; }
.btn-secondary {
  background: var(--vscode-button-secondaryBackground, #3a3d41);
  color: var(--vscode-button-secondaryForeground, #cccccc);
}
.btn-primary {
  background: var(--vscode-button-background, #0e639c);
  color: var(--vscode-button-foreground, #ffffff);
  font-weight: 600;
}
.btn-accent {
  background: ${escHtml(accent)};
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 10px ${escHtml(accent)}55;
}
.btn-accent:hover { opacity: 0.9; }

/* ── Dismiss ─────────────────────────────────────────────── */
.close-btn {
  background: none;
  border: none;
  color: var(--vscode-titleBar-activeForeground, rgba(255,255,255,0.7));
  font-size: 14px;
  cursor: pointer;
  opacity: 0.6;
  line-height: 1;
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}
.close-btn:hover { opacity: 0.95; background: rgba(255,255,255,0.08); }

/* ── Toast ───────────────────────────────────────────────── */
#toast {
  position: fixed;
  bottom: 18px; left: 50%;
  transform: translateX(-50%) translateY(16px);
  background: var(--vscode-badge-background, #4d4d4d);
  color: var(--vscode-badge-foreground, #fff);
  padding: 5px 14px;
  border-radius: 3px;
  font-size: 11px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
  z-index: 100;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}
#toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

/* ── Responsive collapse ─────────────────────────────────── */
@media (max-width: 560px) {
  .body { grid-template-columns: 1fr; }
  .left { border-right: none; border-bottom: 1px solid var(--vscode-widget-border, #454545); }
}
</style>
</head>
<body>

<div class="scrim"></div>

<div class="panel" role="dialog" aria-modal="true" aria-label="Theme of the Week">

  <!-- ── Titlebar ──────────────────────────────────────────── -->
  <div class="titlebar">
    <div class="titlebar-dots">
      <div class="dot dot-r"></div>
      <div class="dot dot-y"></div>
      <div class="dot dot-g"></div>
    </div>
    <span class="titlebar-label">Forest Ash · Theme of the Week</span>
    <div class="titlebar-actions">
      <span class="titlebar-badge">✦ Weekly Pick</span>
      <button class="close-btn" id="closeBtn" title="Close (Escape)" aria-label="Close">✕</button>
    </div>
  </div>

  <!-- ── Body ──────────────────────────────────────────────── -->
  <div class="body">

    <!-- Left column -->
    <div class="left">

      <!-- Identity -->
      <div class="identity">
        <div class="identity-icon">${iconHtml}</div>
        <div class="identity-meta">
          <div class="identity-name">${escHtml(theme.label)}</div>
          <div class="identity-sub">
            <span class="tag">${escHtml(typeTag)}</span>
            <span>Forest Ash Studio</span>
          </div>
        </div>
      </div>

      <!-- Mood -->
      <div class="mood">${escHtml(theme.mood)}</div>

      <!-- Mini editor preview -->
      <div>
        <div class="legend-title" style="margin-bottom:8px;">Preview</div>
        <div class="editor-mockup">
          <div class="ed-topbar">
            <span class="ed-tab">kintsugi.js</span>
          </div>
          <div class="ed-body">
            <div class="ed-gutter">${[1,2,3,4,5].map(n=>`<div>${n}</div>`).join('')}</div>
            <div class="ed-lines">${editorLines}</div>
          </div>
          <div class="ed-statusbar">
            <span>${escHtml(shortName)}</span>
            <span>JavaScript</span>
            <span>UTF-8</span>
          </div>
        </div>
      </div>

      <!-- Token legend -->
      <div>
        <div class="legend-title">Syntax Tokens</div>
        ${tokenRows}
      </div>

    </div><!-- /left -->

    <!-- Right column -->
    <div class="right">

      <!-- Color palette -->
      <div>
        <div class="section-label">Colour Palette</div>
        <div class="palette-grid">${swatchHtml}</div>
      </div>

      <!-- Stats -->
      <div>
        <div class="section-label">Details</div>
        <div class="stats">
          <div class="stat-row">
            <span class="stat-key">Variant</span>
            <span class="stat-val">${escHtml(typeTag)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-key">Publisher</span>
            <span class="stat-val">Forest Ash</span>
          </div>
          <div class="stat-row">
            <span class="stat-key">Category</span>
            <span class="stat-val">Themes</span>
          </div>
          <div class="stat-row">
            <span class="stat-key">Refreshes</span>
            <span class="stat-val">Weekly</span>
          </div>
        </div>
      </div>

    </div><!-- /right -->

  </div><!-- /body -->

  <!-- ── Footer ────────────────────────────────────────────── -->
  <div class="footer">
    <div class="footer-left">
      Press <kbd>Escape</kbd> to dismiss &nbsp;·&nbsp; Click a swatch to copy its hex
    </div>
    <div class="footer-actions">
      <button class="btn btn-secondary" id="dismissBtn">Dismiss</button>
      <button class="btn btn-secondary" id="applyBtn" data-theme="${escHtml(theme.label)}">
        Apply Theme
      </button>
    </div>
  </div>

</div><!-- /panel -->

<div id="toast"></div>

<script>
  const vscode = acquireVsCodeApi();

  // ── Apply theme ───────────────────────────────────────────
  document.getElementById('applyBtn').addEventListener('click', () => {
    const label = document.getElementById('applyBtn').dataset.theme;
    vscode.postMessage({ type: 'applyTheme', label });
    showToast('Theme applied: ' + label.replace(/^Forest Ash\\s*/i, ''));
  });

  // ── Dismiss (close panel)  ────────────────────────────────
  function dismissPanel() {
    document.querySelector('.panel').style.animation = 'none';
    document.querySelector('.panel').style.opacity = '0';
    document.querySelector('.panel').style.transform = 'translateY(-10px) scale(0.99)';
    document.querySelector('.panel').style.transition = 'opacity 0.18s ease, transform 0.18s ease';
    setTimeout(() => vscode.postMessage({ type: 'dismiss' }), 200);
  }
  document.getElementById('dismissBtn').addEventListener('click', dismissPanel);
  document.getElementById('closeBtn').addEventListener('click', dismissPanel);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') dismissPanel(); });

  // ── Swatch copy ───────────────────────────────────────────
  document.querySelectorAll('.sw-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const hex = tile.querySelector('.sw-hex')?.textContent?.trim() || '';
      if (!hex) return;
      vscode.postMessage({ type: 'copy', value: hex });
      tile.classList.add('copied');
      setTimeout(() => tile.classList.remove('copied'), 700);
      showToast('Copied ' + hex);
    });
  });

  // ── Toast ─────────────────────────────────────────────────
  let toastTimer;
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
  }
</script>

</body>
</html>`;
}

module.exports = {
  extractSyntaxColors,
  buildThemePreviewHtml,
  buildPaletteInspectorHtml,
  buildThemeOfWeekHtml,
};
