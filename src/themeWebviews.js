'use strict';

const crypto = require('crypto');

/* ──────────────────────────────────────────────────────────────────────────
 * Forest Ash — gallery, palette inspector and Theme of the Week
 * Exports (unchanged): extractSyntaxColors, buildThemePreviewHtml,
 *                      buildPaletteInspectorHtml, buildThemeOfWeekHtml
 *
 * Messages  webview → extension
 *   applyTheme { label }     copy { value }     dismiss {}     generate {}
 * Optional last argument `options` on every builder: { nonce, cspSource }
 * ────────────────────────────────────────────────────────────────────────── */

/* ───────────────────────────── helpers ───────────────────────────── */

function escHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[match]);
}

const HEX_RE = /^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i;

/** Returns a lowercase #rrggbb / #rrggbbaa string, or the fallback. Also keeps CSS injection out of style attributes. */
function safeHex(value, fallback = null) {
  if (typeof value !== 'string') return fallback;
  const v = value.trim();
  if (!HEX_RE.test(v)) return fallback;
  let h = v.slice(1).toLowerCase();
  if (h.length === 3) h = [...h].map(c => c + c).join('');
  return '#' + h;
}

function rgbOf(hex) {
  const n = safeHex(hex); if (!n) return null;
  return [1, 3, 5].map(i => parseInt(n.slice(i, i + 2), 16));
}

function luminance(hex) {
  const rgb = rgbOf(hex); if (!rgb) return 0;
  const [r, g, b] = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Black or white, whichever reads better on `hex`. */
function readableOn(hex) {
  return contrastRatio('#ffffff', hex) >= contrastRatio('#000000', hex) ? '#ffffff' : '#000000';
}

function grade(ratio) {
  return ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'Large text only' : 'Fails';
}

function normalizeScopeList(scope) {
  if (!scope) return [];
  return Array.isArray(scope) ? scope : String(scope).split(',').map(s => s.trim()).filter(Boolean);
}

const makeNonce = options => (options && options.nonce) || crypto.randomBytes(16).toString('hex');

/* ───────────────────── syntax colour extraction ───────────────────── */

/**
 * Finds the best foreground for each role. A rule scores higher when its scope matches a
 * more specific key, so `entity.name.function` beats a generic `entity`.
 */
function extractSyntaxColors(themeJson) {
  const fallback = safeHex(themeJson?.colors?.['editor.foreground'], '#cccccc');
  const rules = Array.isArray(themeJson?.tokenColors) ? themeJson.tokenColors : [];
  const roles = {
    comment: ['comment'],
    string: ['string'],
    keyword: ['keyword', 'storage'],
    function: ['entity.name.function', 'support.function', 'meta.function-call'],
    type: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'],
    number: ['constant.numeric', 'constant.numeric.integer'],
    variable: ['variable'],
  };

  const pick = keys => {
    let best = null, bestScore = 0;
    for (const rule of rules) {
      const fg = safeHex(rule?.settings?.foreground);
      if (!fg) continue;
      for (const scope of normalizeScopeList(rule.scope).map(s => String(s).toLowerCase())) {
        for (const key of keys) {
          if (scope === key || scope.startsWith(key + '.')) { if (key.length + 100 > bestScore) { best = fg; bestScore = key.length + 100; } }
          else if (scope.includes(key) && key.length > bestScore) { best = fg; bestScore = key.length; }
        }
      }
    }
    return best;
  };

  return Object.fromEntries(Object.entries(roles).map(([role, keys]) => [role, pick(keys) || fallback]));
}

/* ───────────────────── shared styles and shell ───────────────────── */

const BASE_CSS = `
:root{
  color-scheme:light dark;
  --sage:#86b89b;
  --line:var(--vscode-panel-border,rgba(128,128,128,.28));
  --muted:var(--vscode-descriptionForeground,#8b949e);
  --surface:var(--vscode-sideBar-background,rgba(128,128,128,.07));
  --raise:var(--vscode-editorWidget-background,rgba(128,128,128,.1));
  --focus:var(--vscode-focusBorder,#3794ff);
  --ok:var(--vscode-testing-iconPassed,#3fb27f);--bad:var(--vscode-errorForeground,#f14c4c);--warn:var(--vscode-editorWarning-foreground,#cca700);
  --mono:var(--vscode-editor-font-family,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);
}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:var(--vscode-editor-background);color:var(--vscode-foreground);font:13px/1.5 var(--vscode-font-family,system-ui,sans-serif)}
button,input,select{font:inherit;color:inherit}
button{cursor:pointer}
button:focus-visible,input:focus-visible,select:focus-visible,[tabindex]:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
[hidden]{display:none!important}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:30px;padding:5px 13px;border-radius:5px;border:1px solid var(--vscode-button-border,transparent);background:var(--vscode-button-secondaryBackground,rgba(128,128,128,.18));color:var(--vscode-button-secondaryForeground,inherit)}
.btn:hover{background:var(--vscode-button-secondaryHoverBackground,rgba(128,128,128,.28))}
.btn.primary{background:var(--vscode-button-background,#2f7d5b);color:var(--vscode-button-foreground,#fff)}
.btn.primary:hover{background:var(--vscode-button-hoverBackground,#2f7d5b);filter:brightness(1.08)}
.btn.ghost{background:transparent;border-color:var(--line)}
.field{padding:6px 10px;min-height:30px;border-radius:5px;border:1px solid var(--vscode-input-border,var(--line));background:var(--vscode-input-background,transparent)}
.field::placeholder{color:var(--vscode-input-placeholderForeground,var(--muted))}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.seg button{border:0;background:transparent;padding:5px 11px;color:var(--muted)}
.seg button+button{border-left:1px solid var(--line)}
.seg button[aria-pressed=true]{background:var(--raise);color:var(--vscode-foreground)}
.pill{font-size:11px;padding:1px 9px;border-radius:99px;border:1px solid var(--line);color:var(--muted);white-space:nowrap}
.mark{width:30px;height:30px;border-radius:9px;flex:none;background:conic-gradient(from 210deg,#6fae88,#9aa7a0,#4e6b5c,#6fae88);display:grid;place-items:center}
.mark::after{content:"";width:12px;height:12px;border-radius:50%;background:var(--vscode-editor-background)}
.toast{position:fixed;left:50%;bottom:22px;transform:translate(-50%,12px);background:var(--vscode-notifications-background,#252526);color:var(--vscode-notifications-foreground,#ddd);border:1px solid var(--line);padding:8px 14px;border-radius:7px;opacity:0;pointer-events:none;transition:.2s;box-shadow:0 8px 24px rgba(0,0,0,.35);z-index:50}
.toast.on{opacity:1;transform:translate(-50%,0)}
.tag{font-size:10px;padding:0 7px;border-radius:9px;border:1px solid var(--line);color:var(--muted);white-space:nowrap}
.tag.pass{color:var(--ok);border-color:var(--ok)}.tag.warn{color:var(--warn);border-color:var(--warn)}.tag.fail{color:var(--bad);border-color:var(--bad)}
.hint{color:var(--muted);margin:0}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

const TOAST_JS = String.raw`
const toastEl = document.getElementById('toast'); let toastTimer;
function toast(message){ toastEl.textContent = message; toastEl.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('on'), 1900); }
`;

function shell({ title, css, body, script, nonce, cspSource = '' }) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https: ${cspSource}; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<title>${escHtml(title)}</title>
<style>${BASE_CSS}${css}</style></head>
<body>
${body}
<div id="toast" class="toast" role="status" aria-live="polite"></div>
<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
${TOAST_JS}
${script}
</script>
</body></html>`;
}

/* ═══════════════════════════ 1. Theme gallery ═══════════════════════════ */

const GALLERY_CSS = `
.top{position:sticky;top:0;z-index:5;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--vscode-editor-background) 88%,transparent);backdrop-filter:blur(10px)}
.top-in{max-width:1360px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:10px;margin-right:6px}
.brand h1{margin:0;font-size:15px;font-weight:600;line-height:1.2}
.brand p{margin:0;color:var(--muted);font-size:11px}
.tools{margin-left:auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.tools .field.search{width:220px}
.wrap{max-width:1360px;margin:0 auto;padding:22px 24px 48px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:16px}
.card{--bg:#1e1e1e;--fg:#ddd;--accent:#86b89b;display:grid;grid-template-rows:auto auto 1fr;gap:12px;padding:16px;border-radius:12px;border:1px solid color-mix(in srgb,var(--fg) 14%,transparent);background:var(--bg);color:var(--fg);transition:border-color .15s,box-shadow .15s}
.card:hover,.card:focus-within{border-color:var(--accent);box-shadow:0 10px 30px rgba(0,0,0,.28)}
.card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.card-name{font-size:15px;font-weight:600;line-height:1.25;overflow-wrap:anywhere}
.card-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.card .tag{color:color-mix(in srgb,var(--fg) 72%,transparent);border-color:color-mix(in srgb,var(--fg) 24%,transparent)}
.apply{border:0;border-radius:6px;padding:6px 13px;background:var(--accent);color:var(--on-accent,#fff);font-weight:600;white-space:nowrap}
.apply:hover{filter:brightness(1.1)}
.strip{display:flex;height:8px;border-radius:4px;overflow:hidden;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--fg) 16%,transparent)}
.strip i{flex:1}
.code{margin:0;padding:12px 14px;border-radius:9px;background:color-mix(in srgb,var(--bg) 82%,#000);font:12px/1.65 var(--mono);white-space:pre;overflow:auto}
.code[hidden]{display:none}
.kw{color:var(--keyword);font-weight:600}.str{color:var(--string)}.fn{color:var(--function)}.com{color:var(--comment);font-style:italic}.num{color:var(--number)}.var{color:var(--variable)}.typ{color:var(--type)}
.grid.list{grid-template-columns:1fr}
.grid.list .card{grid-template-columns:260px 1fr;grid-template-rows:auto auto;align-items:start;column-gap:22px}
.grid.list .card-head{grid-column:1}.grid.list .strip{grid-column:1;grid-row:2}.grid.list .code{grid-column:2;grid-row:1/3}
.empty{grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--muted);border:1px dashed var(--line);border-radius:12px}
@media(max-width:720px){.top-in,.wrap{padding-left:14px;padding-right:14px}.tools{margin-left:0;width:100%}.tools .field.search{flex:1;min-width:140px}.grid.list .card{grid-template-columns:1fr}.grid.list .code{grid-column:1;grid-row:auto}}
`;

const GALLERY_JS = String.raw`
const grid = document.getElementById('grid'), cards = [...grid.querySelectorAll('.card')];
const q = document.getElementById('q'), sortSel = document.getElementById('sort'), sampleSel = document.getElementById('sample');
const st = Object.assign({ variant: 'all', layout: 'grid', sort: 'name', sample: 'javascript', q: '' }, vscode.getState() || {});
q.value = st.q; sortSel.value = st.sort; sampleSel.value = st.sample;
function save(){ vscode.setState(st); }
function render(){
  const term = st.q.trim().toLowerCase();
  const visible = cards.filter(c => (st.variant === 'all' || c.dataset.type === st.variant) && (!term || c.dataset.label.toLowerCase().includes(term)));
  visible.sort((a, b) => st.sort === 'contrast' ? b.dataset.contrast - a.dataset.contrast
    : st.sort === 'type' ? a.dataset.type.localeCompare(b.dataset.type) || a.dataset.label.localeCompare(b.dataset.label)
    : a.dataset.label.localeCompare(b.dataset.label));
  cards.forEach(c => { c.hidden = !visible.includes(c); });
  visible.forEach(c => grid.appendChild(c));
  grid.classList.toggle('list', st.layout === 'list');
  cards.forEach(c => c.querySelectorAll('.code').forEach(p => { p.hidden = p.dataset.sample !== st.sample; }));
  document.querySelectorAll('[data-variant]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.variant === st.variant)));
  document.querySelectorAll('[data-layout]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.layout === st.layout)));
  document.getElementById('count').textContent = visible.length + ' of ' + cards.length;
  document.getElementById('empty').hidden = visible.length > 0;
}
document.addEventListener('click', e => {
  const v = e.target.closest('[data-variant]'); if (v) { st.variant = v.dataset.variant; save(); render(); return; }
  const l = e.target.closest('[data-layout]'); if (l) { st.layout = l.dataset.layout; save(); render(); return; }
  const a = e.target.closest('.apply'); if (a) { vscode.postMessage({ type: 'applyTheme', label: a.dataset.theme }); toast('Applying ' + a.dataset.theme + '…'); return; }
  if (e.target.closest('#reset')) { st.q = ''; st.variant = 'all'; q.value = ''; save(); render(); }
});
q.addEventListener('input', () => { st.q = q.value; save(); render(); });
sortSel.addEventListener('change', () => { st.sort = sortSel.value; save(); render(); });
sampleSel.addEventListener('change', () => { st.sample = sampleSel.value; save(); render(); });
document.addEventListener('keydown', e => { if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); } });
render();
`;

function galleryCard(card) {
  const bg = safeHex(card.bg, '#1e1e1e'), fg = safeHex(card.fg, '#d4d4d4');
  const accent = safeHex(card.accent, '#86b89b');
  const s = card.syntax || {};
  const c = {
    comment: safeHex(s.comment, fg), string: safeHex(s.string, fg), keyword: safeHex(s.keyword, fg),
    function: safeHex(s.function, fg), type: safeHex(s.type, fg), number: safeHex(s.number, fg), variable: safeHex(s.variable, fg),
  };
  const ratio = contrastRatio(fg, bg);
  const name = escHtml(card.label);
  const samples = {
    javascript: `<span class="kw">function</span> <span class="fn">kintsugi</span>(<span class="var">ash</span>) {\n  <span class="com">// restore broken lines</span>\n  <span class="kw">const</span> <span class="var">veil</span> = <span class="str">"forest-ash"</span>;\n  <span class="kw">return</span> <span class="fn">polish</span>(<span class="var">ash</span>) + <span class="num">7</span>;\n}`,
    python: `<span class="kw">def</span> <span class="fn">kintsugi</span>(<span class="var">ash</span>: <span class="typ">str</span>) -> <span class="typ">int</span>:\n    <span class="com"># restore broken lines</span>\n    <span class="var">veil</span> = <span class="str">"forest-ash"</span>\n    <span class="kw">return</span> <span class="fn">polish</span>(<span class="var">ash</span>) + <span class="num">7</span>`,
    json: `{\n  <span class="str">"name"</span>: <span class="str">"forest-ash"</span>,\n  <span class="str">"version"</span>: <span class="num">7</span>,\n  <span class="str">"dark"</span>: <span class="kw">true</span>\n}`,
  };
  const pres = Object.entries(samples).map(([k, v]) => `<pre class="code" data-sample="${k}"${k === 'javascript' ? '' : ' hidden'}>${v}</pre>`).join('');
  const style = `--bg:${bg};--fg:${fg};--accent:${accent};--on-accent:${readableOn(accent)};--comment:${c.comment};--string:${c.string};--keyword:${c.keyword};--function:${c.function};--type:${c.type};--number:${c.number};--variable:${c.variable}`;
  return `<article class="card" data-label="${name}" data-type="${card.type === 'light' ? 'light' : 'dark'}" data-contrast="${ratio.toFixed(2)}" style="${style}" aria-label="${name}">
    <div class="card-head"><div><div class="card-name">${name}</div>
      <div class="card-meta"><span class="tag">${escHtml(card.typeLabel || (card.type === 'light' ? 'Light' : 'Dark'))}</span><span class="tag" title="Editor text on background">${ratio.toFixed(1)}:1 · ${grade(ratio)}</span></div></div>
      <button class="apply" data-theme="${name}" aria-label="Apply ${name}">Apply</button></div>
    <div class="strip" aria-hidden="true">${[bg, fg, accent, c.keyword, c.string, c.function, c.number, c.comment].map(x => `<i style="background:${x}"></i>`).join('')}</div>
    ${pres}</article>`;
}

function buildThemePreviewHtml(cards, options = {}) {
  const list = Array.isArray(cards) ? cards : [];
  const body = `
<header class="top"><div class="top-in">
  <div class="brand"><span class="mark" aria-hidden="true"></span><div><h1>Theme gallery</h1><p>Forest Ash · apply any palette without leaving this view</p></div></div>
  <span class="pill" id="count"></span>
  <div class="tools">
    <input id="q" class="field search" type="search" placeholder="Search themes (press /)" aria-label="Search themes">
    <div class="seg" role="group" aria-label="Variant"><button data-variant="all" aria-pressed="true">All</button><button data-variant="dark" aria-pressed="false">Dark</button><button data-variant="light" aria-pressed="false">Light</button></div>
    <select id="sort" class="field" aria-label="Sort"><option value="name">Name</option><option value="contrast">Contrast</option><option value="type">Variant</option></select>
    <select id="sample" class="field" aria-label="Sample language"><option value="javascript">JavaScript</option><option value="python">Python</option><option value="json">JSON</option></select>
    <div class="seg" role="group" aria-label="Layout"><button data-layout="grid" aria-pressed="true">Grid</button><button data-layout="list" aria-pressed="false">List</button></div>
  </div></div>
</header>
<main class="wrap"><div id="grid" class="grid">${list.map(galleryCard).join('')}
  <div id="empty" class="empty" hidden><p>No themes match these filters.</p><button class="btn" id="reset">Clear filters</button></div></div></main>`;
  return shell({ title: 'Forest Ash Theme Gallery', css: GALLERY_CSS, body, script: GALLERY_JS, nonce: makeNonce(options), cspSource: options.cspSource });
}

/* ═══════════════════════ 2. Palette inspector ═══════════════════════ */

const PALETTE_CSS = `
.page{max-width:1360px;margin:0 auto;padding:0 24px 40px}
.head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:20px 0 14px}
.head h1{margin:0;font-size:18px;font-weight:600}
.head p{margin:2px 0 0;color:var(--muted)}
.bar{position:sticky;top:0;z-index:4;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 0;background:color-mix(in srgb,var(--vscode-editor-background) 92%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.bar .field.search{flex:1;min-width:180px;max-width:320px}
.chips{display:flex;gap:6px;flex-wrap:wrap;padding:12px 0}
.chip{border:1px solid var(--line);background:transparent;border-radius:99px;padding:3px 11px;color:var(--muted)}
.chip[aria-pressed=true]{background:var(--raise);color:var(--vscode-foreground);border-color:var(--sage)}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:22px;align-items:start}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:10px}
.grid.list{grid-template-columns:1fr}
.tile{display:grid;gap:7px;text-align:left;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:inherit}
.tile:hover{border-color:var(--sage)}
.tile[aria-pressed=true]{border-color:var(--sage);box-shadow:0 0 0 1px var(--sage)}
.swatch{height:54px;border-radius:7px;box-shadow:inset 0 0 0 1px rgba(128,128,128,.35);background:var(--sw);position:relative}
.swatch.na{background:repeating-conic-gradient(rgba(128,128,128,.25) 0 25%,transparent 0 50%) 0 0/12px 12px}
.swatch.alpha{background:linear-gradient(var(--sw),var(--sw)),repeating-conic-gradient(rgba(128,128,128,.3) 0 25%,transparent 0 50%) 0 0/12px 12px}
.tkey{font-size:11px;overflow-wrap:anywhere;line-height:1.35}
.val{font:11px var(--mono);color:var(--muted)}
.grid.list .tile{grid-template-columns:54px minmax(0,1.4fr) minmax(0,1fr);align-items:center}
.grid.list .swatch{height:34px}
.detail{position:sticky;top:64px;border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:14px;display:grid;gap:12px}
.detail .big{height:96px;border-radius:9px;box-shadow:inset 0 0 0 1px rgba(128,128,128,.35)}
.detail h2{margin:0;font-size:14px;overflow-wrap:anywhere}
.fmt{display:grid;gap:6px}
.fmt button{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 9px;border:1px solid var(--line);border-radius:6px;background:transparent;font:12px var(--mono)}
.fmt button:hover{border-color:var(--sage)}
.fmt button span{color:var(--muted);font:10px var(--vscode-font-family,system-ui)}
.crow{display:grid;grid-template-columns:20px 1fr auto auto;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid var(--line)}
.crow:last-child{border:0}
.crow i{width:20px;height:20px;border-radius:5px;display:grid;place-items:center;font:700 11px var(--vscode-font-family,system-ui);font-style:normal;box-shadow:inset 0 0 0 1px rgba(128,128,128,.35)}
.empty{padding:40px 20px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:12px}
@media(max-width:980px){.layout{grid-template-columns:1fr}.detail{position:static}}
@media(max-width:560px){.page{padding:0 14px 30px}}
`;

const PALETTE_JS = String.raw`
const tiles = [...document.querySelectorAll('.tile')], grid = document.getElementById('grid');
const body = document.body, BG = body.dataset.bg, FG = body.dataset.fg;
const st = Object.assign({ fmt: 'hex', group: 'all', sort: 'name', view: 'grid', q: '', sel: '' }, vscode.getState() || {});
const q = document.getElementById('q'), sortSel = document.getElementById('sort'); q.value = st.q; sortSel.value = st.sort;
const save = () => vscode.setState(st);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function parse(hex){ if(!hex) return null; const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16), a = hex.length === 9 ? parseInt(hex.slice(7,9),16)/255 : 1; return {r,g,b,a}; }
function hsl({r,g,b}){ r/=255; g/=255; b/=255; const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn, l=(mx+mn)/2; let h=0, s=0; if(d){ s=d/(1-Math.abs(2*l-1)); h = mx===r ? ((g-b)/d)%6 : mx===g ? (b-r)/d+2 : (r-g)/d+4; h=(h*60+360)%360; } return {h:Math.round(h), s:Math.round(s*100), l:Math.round(l*100)}; }
function fmt(hex, f){ const c = parse(hex); if(!c) return hex || ''; const a = +c.a.toFixed(2);
  if (f === 'rgb') return a < 1 ? 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + a + ')' : 'rgb(' + c.r + ', ' + c.g + ', ' + c.b + ')';
  if (f === 'hsl') { const x = hsl(c); return a < 1 ? 'hsla(' + x.h + ', ' + x.s + '%, ' + x.l + '%, ' + a + ')' : 'hsl(' + x.h + ', ' + x.s + '%, ' + x.l + '%)'; }
  return hex.toLowerCase(); }
function lum(hex){ const c = parse(hex); if(!c) return 0; const f = v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }; return 0.2126*f(c.r) + 0.7152*f(c.g) + 0.0722*f(c.b); }
function ratio(a, b){ const x = lum(a), y = lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); }
const gradeOf = r => r >= 7 ? ['AAA','pass'] : r >= 4.5 ? ['AA','pass'] : r >= 3 ? ['Large text','warn'] : ['Fails','fail'];
async function copy(text){ vscode.postMessage({ type: 'copy', value: text }); try { await navigator.clipboard.writeText(text); } catch (e) {} toast('Copied ' + text); }

function render(){
  const term = st.q.trim().toLowerCase();
  const vis = tiles.filter(t => (st.group === 'all' || t.dataset.group === st.group) && (!term || (t.dataset.key + ' ' + t.dataset.raw).toLowerCase().includes(term)));
  vis.sort((a, b) => st.sort === 'light' ? a.dataset.l - b.dataset.l : st.sort === 'hue' ? a.dataset.h - b.dataset.h : a.dataset.key.localeCompare(b.dataset.key));
  tiles.forEach(t => { t.hidden = !vis.includes(t); const v = t.querySelector('.val'); v.textContent = t.dataset.hex ? fmt(t.dataset.hex, st.fmt) : t.dataset.raw; t.setAttribute('aria-pressed', String(t.dataset.key === st.sel)); });
  vis.forEach(t => grid.appendChild(t));
  grid.classList.toggle('list', st.view === 'list');
  document.getElementById('shown').textContent = vis.length + ' of ' + tiles.length + ' colors';
  document.getElementById('empty').hidden = vis.length > 0;
  document.querySelectorAll('[data-fmt]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fmt === st.fmt)));
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === st.view)));
  document.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.group === st.group)));
  renderDetail();
}
function renderDetail(){
  const t = tiles.find(x => x.dataset.key === st.sel), box = document.getElementById('detail');
  if (!t) { box.innerHTML = '<p class="hint">Select a color to see its formats and contrast. Clicking a color also copies it.</p>'; return; }
  const hex = t.dataset.hex, key = t.dataset.key;
  if (!hex) { box.innerHTML = '<h2></h2><p class="hint">This value is not a hex color, so it cannot be converted.</p><div class="fmt"><button data-copy=""><code></code><span>Copy</span></button></div>'; box.querySelector('h2').textContent = key; box.querySelector('code').textContent = t.dataset.raw; box.querySelector('[data-copy]').dataset.copy = t.dataset.raw; return; }
  const opaque = hex.slice(0, 7), rows = [];
  [['Editor text', FG], ['Editor background', BG]].forEach(([label, ref]) => { if (ref && ref !== hex) { const r = ratio(opaque, ref.slice(0,7)), g = gradeOf(r); rows.push('<div class="crow"><i style="background:' + opaque + ';color:' + ref + '">Aa</i><span>' + label + '</span><span class="val">' + r.toFixed(2) + ':1</span><span class="tag ' + g[1] + '">' + g[0] + '</span></div>'); } });
  box.innerHTML = '<div class="big" style="background:linear-gradient(' + hex + ',' + hex + '),repeating-conic-gradient(rgba(128,128,128,.3) 0 25%,transparent 0 50%) 0 0/12px 12px"></div><div><h2></h2><p class="hint" id="dgrp"></p></div>' +
    '<div class="fmt">' + ['hex','rgb','hsl'].map(f => '<button data-copy="' + fmt(hex, f) + '"><code>' + fmt(hex, f) + '</code><span>' + f.toUpperCase() + '</span></button>').join('') + '</div>' +
    '<div><strong>Contrast</strong>' + (rows.join('') || '<p class="hint">No reference colors available.</p>') + '</div>' + (hex.length === 9 ? '<p class="hint">Contrast ignores alpha.</p>' : '');
  box.querySelector('h2').textContent = key; box.querySelector('#dgrp').textContent = t.dataset.groupLabel;
}
document.addEventListener('click', e => {
  const tile = e.target.closest('.tile'); if (tile) { st.sel = tile.dataset.key; save(); render(); copy(tile.dataset.hex ? fmt(tile.dataset.hex, st.fmt) : tile.dataset.raw); return; }
  const c = e.target.closest('[data-copy]'); if (c) { copy(c.dataset.copy); return; }
  const f = e.target.closest('[data-fmt]'); if (f) { st.fmt = f.dataset.fmt; save(); render(); return; }
  const v = e.target.closest('[data-view]'); if (v) { st.view = v.dataset.view; save(); render(); return; }
  const g = e.target.closest('.chip'); if (g) { st.group = g.dataset.group; save(); render(); return; }
  if (e.target.closest('#reset')) { st.q = ''; st.group = 'all'; q.value = ''; save(); render(); }
});
q.addEventListener('input', () => { st.q = q.value; save(); render(); });
sortSel.addEventListener('change', () => { st.sort = sortSel.value; save(); render(); });
document.addEventListener('keydown', e => { if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); } });
render();
`;

const prettyGroup = name => String(name).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());

function hueOf(hex) {
  const rgb = rgbOf(hex); if (!rgb) return 0;
  const [r, g, b] = rgb.map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return 0;
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}

function buildPaletteInspectorHtml(themeLabel, colors, options = {}) {
  const entries = Object.entries(colors || {});
  const emptyMessage = options.emptyMessage || 'Palette data is unavailable.';
  const subtitle = options.subtitle || 'Click a color to copy it. Pick a format first if you need RGB or HSL.';
  const bg = safeHex(colors?.['editor.background'], '') || '';
  const fg = safeHex(colors?.['editor.foreground'], '') || '';

  const groups = new Map();
  const tiles = entries.map(([key, raw]) => {
    const hex = safeHex(raw);
    const dot = String(key).indexOf('.');
    const group = dot > 0 ? String(key).slice(0, dot) : 'other';
    groups.set(group, (groups.get(group) || 0) + 1);
    const swClass = !hex ? ' na' : hex.length === 9 ? ' alpha' : '';
    return `<button class="tile" data-key="${escHtml(key)}" data-raw="${escHtml(raw)}" data-hex="${escHtml(hex || '')}" data-group="${escHtml(group)}" data-group-label="${escHtml(prettyGroup(group))}" data-l="${hex ? luminance(hex).toFixed(4) : 0}" data-h="${hex ? hueOf(hex) : 0}" aria-pressed="false" title="${escHtml(key)}">
      <span class="swatch${swClass}" style="${hex ? `--sw:${hex}` : ''}"></span>
      <span class="tkey">${escHtml(key)}</span><span class="val"></span></button>`;
  }).join('');

  const chips = [`<button class="chip" data-group="all" aria-pressed="true">All <small>${entries.length}</small></button>`]
    .concat([...groups].sort((a, b) => a[0].localeCompare(b[0])).map(([g, n]) => `<button class="chip" data-group="${escHtml(g)}" aria-pressed="false">${escHtml(prettyGroup(g))} <small>${n}</small></button>`)).join('');

  const body = `
<div class="page" data-bg="${escHtml(bg)}" data-fg="${escHtml(fg)}">
  <header class="head"><span class="mark" aria-hidden="true"></span><div><h1>${escHtml(themeLabel)} palette</h1><p>${escHtml(subtitle)}</p></div><span class="pill" id="shown" style="margin-left:auto"></span></header>
  ${entries.length ? `
  <div class="bar">
    <input id="q" class="field search" type="search" placeholder="Search by name or value (press /)" aria-label="Search colors">
    <div class="seg" role="group" aria-label="Copy format"><button data-fmt="hex" aria-pressed="true">Hex</button><button data-fmt="rgb" aria-pressed="false">RGB</button><button data-fmt="hsl" aria-pressed="false">HSL</button></div>
    <select id="sort" class="field" aria-label="Sort"><option value="name">Name</option><option value="light">Lightness</option><option value="hue">Hue</option></select>
    <div class="seg" role="group" aria-label="Layout"><button data-view="grid" aria-pressed="true">Grid</button><button data-view="list" aria-pressed="false">List</button></div>
  </div>
  <div class="chips" role="group" aria-label="Filter by group">${chips}</div>
  <div class="layout"><div><div id="grid" class="grid">${tiles}</div><div id="empty" class="empty" hidden><p>No colors match these filters.</p><button class="btn" id="reset">Clear filters</button></div></div>
  <aside class="detail" id="detail" aria-live="polite"></aside></div>`
  : `<div class="empty">${escHtml(emptyMessage)}</div>`}
</div>`;
  // body data attrs live on .page; the script reads them from <body>
  const script = entries.length
    ? 'document.body.dataset.bg = document.querySelector(".page").dataset.bg; document.body.dataset.fg = document.querySelector(".page").dataset.fg;\n' + PALETTE_JS
    : '';
  return shell({ title: 'Forest Ash Palette Inspector', css: PALETTE_CSS, body, script, nonce: makeNonce(options), cspSource: options.cspSource });
}

/* ═══════════════════════ 3. Theme of the Week ═══════════════════════ */

const WEEK_CSS = `
body{background:radial-gradient(900px circle at 10% -10%,color-mix(in srgb,var(--accent) 14%,transparent),transparent 60%),var(--vscode-editor-background)}
.stage{max-width:1180px;margin:0 auto;padding:26px 24px 40px}
.panel{border:1px solid color-mix(in srgb,var(--accent) 30%,var(--line));border-radius:14px;background:var(--surface);overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.35);animation:rise .35s cubic-bezier(.16,1,.3,1) both}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.top{display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--line)}
.top b{font-size:13px}.top small{color:var(--muted)}
.top .sp{margin-left:auto}
.x{width:28px;height:28px;border:0;border-radius:6px;background:transparent;color:var(--muted)}
.x:hover{background:var(--vscode-toolbar-hoverBackground,rgba(128,128,128,.2));color:inherit}
.cols{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(300px,.8fr)}
.left{padding:30px 34px;display:grid;gap:24px;align-content:start;border-right:1px solid var(--line)}
.right{padding:30px 26px;display:grid;gap:24px;align-content:start}
.id{display:flex;gap:16px;align-items:center}
.icon{width:58px;height:58px;border-radius:14px;display:grid;place-items:center;flex:none;background:color-mix(in srgb,var(--accent) 16%,transparent);border:1px solid color-mix(in srgb,var(--accent) 40%,transparent);font-weight:700;color:var(--accent);font-size:19px}
.icon img{width:34px;height:34px;object-fit:contain}
.id h1{margin:0;font-size:clamp(22px,3vw,34px);line-height:1.1;letter-spacing:-.6px;overflow-wrap:anywhere}
.id .meta{display:flex;gap:8px;align-items:center;margin-top:8px;color:var(--muted);flex-wrap:wrap}
.mood{margin:0;max-width:62ch;font-size:15px;line-height:1.7;padding-left:14px;border-left:3px solid color-mix(in srgb,var(--accent) 60%,transparent)}
h2.sec{margin:0 0 10px;font-size:12px;font-weight:600;color:var(--muted)}
.ed{border-radius:10px;overflow:hidden;border:1px solid color-mix(in srgb,var(--accent) 30%,transparent);background:var(--e-bg);color:var(--e-fg);box-shadow:0 14px 36px rgba(0,0,0,.25)}
.ed-tabs{padding:7px 12px;background:color-mix(in srgb,var(--e-bg) 90%,#000);font-size:11px;border-bottom:1px solid rgba(128,128,128,.2)}
.ed-tabs span{padding:3px 10px;border-bottom:2px solid var(--accent)}
.ed-code{padding:14px 0;font:13px/1.85 var(--mono)}
.l{display:grid;grid-template-columns:44px 1fr;white-space:pre}
.l b{font-weight:400;text-align:right;padding-right:14px;opacity:.4}
.t-kw{color:var(--kw);font-weight:600}.t-fn{color:var(--fn)}.t-st{color:var(--st)}.t-cm{color:var(--cm);font-style:italic}.t-nm{color:var(--nm)}.t-vr{color:var(--vr)}.t-ty{color:var(--ty)}
.ed-status{display:flex;gap:14px;padding:3px 12px;background:var(--accent);color:var(--on-accent);font-size:11px}
.tok{display:grid;grid-template-columns:12px 80px 1fr;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line)}
.tok:last-child{border:0}.tok i{width:10px;height:10px;border-radius:50%}
.tok code{font:12px var(--mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pal{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.sw{display:grid;align-content:space-between;gap:16px;min-height:64px;padding:9px 10px;border-radius:8px;border:1px solid rgba(128,128,128,.35);text-align:left}
.sw:hover{border-color:var(--accent)}
.sw b{font:700 11px var(--mono)}.sw span{font-size:10px;opacity:.85}
.qual{border:1px solid var(--line);border-radius:10px;padding:2px 12px}
.q{display:grid;grid-template-columns:20px 1fr auto auto;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line)}
.q:last-child{border:0}.q i{width:20px;height:20px;border-radius:5px;display:grid;place-items:center;font:700 10px var(--vscode-font-family,system-ui);font-style:normal;box-shadow:inset 0 0 0 1px rgba(128,128,128,.35)}
.q .r{font:11px var(--mono);color:var(--muted)}
.det{border:1px solid var(--line);border-radius:10px;padding:2px 12px}
.det div{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--line)}
.det div:last-child{border:0}.det span:first-child{color:var(--muted)}
.foot{display:flex;align-items:center;gap:12px;padding:14px 20px;border-top:1px solid var(--line);flex-wrap:wrap}
.foot .hint{margin-right:auto}
kbd{font:10px var(--mono);padding:0 5px;border:1px solid var(--line);border-radius:4px}
.btn.accent{background:var(--accent);color:var(--on-accent);font-weight:600}
@media(max-width:820px){.cols{grid-template-columns:1fr}.left{border-right:0;border-bottom:1px solid var(--line);padding:24px 20px}.right{padding:24px 20px}.stage{padding:12px}}
@media(max-width:520px){.foot .btn{flex:1}.pal{grid-template-columns:1fr 1fr}}
`;

const WEEK_JS = String.raw`
const panel = document.querySelector('.panel');
function dismiss(){ panel.style.transition = 'opacity .16s, transform .16s'; panel.style.opacity = '0'; panel.style.transform = 'translateY(-6px)'; setTimeout(() => vscode.postMessage({ type: 'dismiss' }), 170); }
document.getElementById('apply').addEventListener('click', e => { const label = e.currentTarget.dataset.theme; vscode.postMessage({ type: 'applyTheme', label }); toast('Applying ' + label + '…'); });
document.getElementById('generate').addEventListener('click', () => { vscode.postMessage({ type: 'generate' }); toast('Opening the theme generator…'); });
document.getElementById('dismiss').addEventListener('click', dismiss);
document.getElementById('close').addEventListener('click', dismiss);
document.addEventListener('keydown', e => { if (e.key === 'Escape') dismiss(); });
document.querySelectorAll('.sw').forEach(s => s.addEventListener('click', async () => {
  const hex = s.dataset.hex; vscode.postMessage({ type: 'copy', value: hex });
  try { await navigator.clipboard.writeText(hex); } catch (e) {}
  toast('Copied ' + hex);
}));
document.getElementById('apply').focus();
`;

function buildThemeOfWeekHtml(theme, options = {}) {
  theme = theme || {};
  const label = String(theme.label || 'Untitled theme');
  const colors = theme.colors || {}, syntax = theme.syntax || {};
  const bg = safeHex(colors['editor.background'], '#1e2227').slice(0, 7);
  const fg = safeHex(colors['editor.foreground'], '#abb2bf').slice(0, 7);
  const accent = (safeHex(colors['editorCursor.foreground']) || safeHex(colors['textLink.foreground']) || '#61afef').slice(0, 7);
  const pickS = (k, d) => (safeHex(syntax[k], d) || d).slice(0, 7);
  const c = {
    kw: pickS('keyword', '#c678dd'), st: pickS('string', '#98c379'), fn: pickS('function', '#61afef'), nm: pickS('number', '#d19a66'),
    cm: (safeHex(syntax.comment) || safeHex(colors['editorLineNumber.foreground']) || '#5c6370').slice(0, 7),
    vr: pickS('variable', fg), ty: pickS('type', '#e5c07b'),
  };
  const isLight = (theme.type || 'dark') === 'light';
  const typeTag = isLight ? 'Light' : 'Dark';
  const sourceTag = theme.isCustom ? 'Custom' : typeTag;
  const mood = theme.mood || 'A calm, forest-inspired palette tuned for long sessions.';
  const shortName = label.replace(/^Forest Ash\s*/i, '') || label;

  const palette = [
    ['editor.background', bg], ['editor.foreground', fg], ['editorCursor.foreground', accent],
    ['statusBar.background', safeHex(colors['statusBar.background'], accent)], ['activityBar.background', safeHex(colors['activityBar.background'], bg)],
    ['tab.activeBackground', safeHex(colors['tab.activeBackground'], bg)], ['sideBar.background', safeHex(colors['sideBar.background'], bg)],
    ['titleBar.activeBackground', safeHex(colors['titleBar.activeBackground'], bg)],
  ].map(([key, hex]) => {
    const h = hex.slice(0, 7);
    return `<button class="sw" data-hex="${h}" style="background:${h};color:${readableOn(h)}" title="Copy ${h}"><b>${h.toUpperCase()}</b><span>${escHtml(key.split('.').pop())} · ${escHtml(key.split('.')[0])}</span></button>`;
  }).join('');

  const tokens = [
    ['Keyword', c.kw, 'function · const · return'], ['String', c.st, '"forest-ash" · `template`'], ['Function', c.fn, 'kintsugi() · polish()'],
    ['Type', c.ty, 'Palette · string[]'], ['Number', c.nm, '42 · 3.14 · 0xff'], ['Comment', c.cm, '// restore broken lines'],
  ].map(([role, color, sample]) => `<div class="tok"><i style="background:${color}"></i><span>${role}</span><code style="color:${color}">${escHtml(sample)}</code></div>`).join('');

  const checks = [
    ['Editor text', fg, bg, 4.5], ['Keywords', c.kw, bg, 4.5], ['Strings', c.st, bg, 4.5], ['Functions', c.fn, bg, 4.5], ['Comments', c.cm, bg, 3],
  ].map(([name, f, b, need]) => {
    const r = contrastRatio(f, b); const ok = r >= need;
    return `<div class="q"><i style="background:${b};color:${f}">Aa</i><span>${name}</span><span class="r">${r.toFixed(1)}:1</span><span class="tag ${ok ? 'pass' : 'fail'}" title="Target ${need}:1">${ok ? grade(r) : 'Below ' + need}</span></div>`;
  }).join('');

  const lines = [
    [['kw', 'function'], [null, ' '], ['fn', 'kintsugi'], [null, '('], ['vr', 'ash'], [null, ') {']],
    [[null, '  '], ['cm', '// restore broken lines']],
    [[null, '  '], ['kw', 'const'], [null, ' '], ['vr', 'veil'], [null, ' = '], ['st', '"forest-ash"'], [null, ';']],
    [[null, '  '], ['kw', 'return'], [null, ' '], ['fn', 'polish'], [null, '('], ['vr', 'ash'], [null, ') + '], ['nm', '7'], [null, ';']],
    [[null, '}']],
  ].map((parts, i) => `<div class="l"><b>${i + 1}</b><span>${parts.map(([t, v]) => t ? `<span class="t-${t}">${escHtml(v)}</span>` : escHtml(v)).join('')}</span></div>`).join('');

  const iconSrc = typeof theme.icon === 'string' && /^(https:|data:image\/|vscode-)/i.test(theme.icon) ? theme.icon : '';
  const icon = iconSrc ? `<img src="${escHtml(iconSrc)}" alt="">` : 'FA';
  const style = `--accent:${accent};--on-accent:${readableOn(accent)};--e-bg:${bg};--e-fg:${fg};--kw:${c.kw};--st:${c.st};--fn:${c.fn};--nm:${c.nm};--cm:${c.cm};--vr:${c.vr};--ty:${c.ty}`;

  const body = `
<div class="stage" style="${style}">
<div class="panel" role="dialog" aria-modal="true" aria-labelledby="wk-title">
  <div class="top"><span class="mark" aria-hidden="true"></span><div><b>Theme of the Week</b><br><small>Forest Ash · refreshed weekly</small></div><span class="sp"></span><button class="x" id="close" aria-label="Close" title="Close (Esc)">✕</button></div>
  <div class="cols">
    <section class="left">
      <div class="id"><div class="icon" aria-hidden="true">${icon}</div><div><h1 id="wk-title">${escHtml(label)}</h1><div class="meta"><span class="tag">${escHtml(sourceTag)}</span><span>${escHtml(typeTag)} variant</span></div></div></div>
      <p class="mood">${escHtml(mood)}</p>
      <div><h2 class="sec">Preview</h2><div class="ed"><div class="ed-tabs"><span>kintsugi.js</span></div><div class="ed-code">${lines}</div><div class="ed-status"><span>${escHtml(shortName)}</span><span>JavaScript</span><span>UTF-8</span></div></div></div>
      <div><h2 class="sec">Syntax colors</h2>${tokens}</div>
    </section>
    <aside class="right">
      <div><h2 class="sec">Palette <span class="hint">(click to copy)</span></h2><div class="pal">${palette}</div></div>
      <div><h2 class="sec">Readability</h2><div class="qual">${checks}</div></div>
      <div><h2 class="sec">Details</h2><div class="det">
        <div><span>Variant</span><span>${escHtml(typeTag)}</span></div>
        <div><span>Source</span><span>${theme.isCustom ? 'Saved custom theme' : 'Built-in collection'}</span></div>
        <div><span>Publisher</span><span>Forest Ash</span></div>
        <div><span>Category</span><span>Themes</span></div></div></div>
    </aside>
  </div>
  <div class="foot"><p class="hint"><kbd>Esc</kbd> to dismiss</p>
    <button class="btn ghost" id="dismiss">Dismiss</button>
    <button class="btn" id="generate">Generate custom theme</button>
    <button class="btn accent" id="apply" data-theme="${escHtml(label)}">Apply theme</button></div>
</div></div>`;
  return shell({ title: 'Forest Ash · Theme of the Week', css: WEEK_CSS, body, script: WEEK_JS, nonce: makeNonce(options), cspSource: options.cspSource });
}

module.exports = {
  extractSyntaxColors,
  buildThemePreviewHtml,
  buildPaletteInspectorHtml,
  buildThemeOfWeekHtml,
};