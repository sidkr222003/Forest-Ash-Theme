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
  <span class="kw">const</span> <span class="var">veil</span> = <span class="str">\"forest-ash\"</span>;\n\
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

function buildThemeOfWeekHtml(theme) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Forest Ash Theme of the Week</title>
<style>
  body {
    margin: 0;
    padding: 32px;
    font-family: var(--vscode-font-family);
    background: var(--vscode-editor-background);
    color: var(--vscode-foreground);
  }
  .card {
    border-radius: 18px;
    border: 1px solid var(--vscode-panel-border);
    padding: 24px;
    max-width: 480px;
  }
  h1 {
    font-size: 18px;
    margin: 0 0 12px 0;
  }
  .label {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .mood {
    opacity: 0.8;
    margin-bottom: 16px;
  }
  button {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    padding: 8px 12px;
    border-radius: 10px;
    cursor: pointer;
  }
</style>
</head>
<body>
  <div class="card">
    <h1>Theme of the Week</h1>
    <div class="label">${escHtml(theme.label)}</div>
    <div class="mood">${escHtml(theme.mood)}</div>
    <button data-theme="${escHtml(theme.label)}">Apply Theme</button>
  </div>
<script>
  const vscode = acquireVsCodeApi();
  document.querySelector('button[data-theme]').addEventListener('click', () => {
    vscode.postMessage({ type: 'applyTheme', label: '${escHtml(theme.label)}' });
  });
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
