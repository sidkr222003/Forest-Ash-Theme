'use strict';

const crypto = require('crypto');

/* ──────────────────────────────────────────────────────────────────────────
 * Forest Ash — Theme Studio webview
 * Public API (unchanged): buildThemeStudioHtml(themes, favorites, recent), contrastRatio
 *
 * Messages  webview → extension
 *   setState  { source, colors, syntax, tokenColors, semanticTokenColors, semanticHighlighting }  (debounced live push)
 *   apply     { label }
 *   save      { source, colors, syntax, tokenColors, semanticTokenColors, semanticHighlighting }
 *   favorite  { label, favorite }
 *   discard   {}      panic {}
 * Messages  extension → webview
 *   studioState { colors, syntax?, tokenColors?, semanticTokenColors?, semanticHighlighting? }
 * Undo / redo, presets, colour-blindness simulation and reduced glare are handled inside the
 * webview and reach VS Code through the same live `setState` push.
 * ────────────────────────────────────────────────────────────────────────── */

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function luminance(hex) {
  const value = String(hex || '').replace('#', '').slice(0, 6);
  if (!/^[\da-f]{6}$/i.test(value)) return 0;
  const channels = [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16) / 255);
  const linear = channels.map(channel => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground, background) {
  const light = luminance(foreground);
  const dark = luminance(background);
  return (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
}

/* ─────────────────────────────── styles ─────────────────────────────── */

const STUDIO_CSS = `
:root{
  color-scheme:light dark;
  --sage:#86b89b;--ash:#9aa7a0;
  --line:var(--vscode-panel-border,rgba(128,128,128,.28));
  --muted:var(--vscode-descriptionForeground,#8b949e);
  --surface:var(--vscode-sideBar-background,rgba(128,128,128,.07));
  --raise:var(--vscode-editorWidget-background,rgba(128,128,128,.1));
  --focus:var(--vscode-focusBorder,#3794ff);
  --accent:var(--vscode-button-background,#2f7d5b);
  --accent-fg:var(--vscode-button-foreground,#fff);
  --ok:var(--vscode-testing-iconPassed,#3fb27f);--bad:var(--vscode-errorForeground,#f14c4c);--warn:var(--vscode-editorWarning-foreground,#cca700);
  --mono:var(--vscode-editor-font-family,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);
}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;background:var(--vscode-editor-background);color:var(--vscode-foreground);font:12px/1.5 var(--vscode-font-family,system-ui,sans-serif);overflow:hidden}
button,input,select{font:inherit;color:inherit}
button{cursor:pointer}
button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible,[tabindex]:focus-visible{outline:2px solid var(--focus);outline-offset:1px}
[hidden]{display:none!important}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}

.app{height:100vh;display:grid;grid-template-rows:auto minmax(0,1fr) auto}
.bar{display:flex;align-items:center;gap:14px;padding:10px 16px;border-bottom:1px solid var(--line);background:var(--surface)}
.brand{display:flex;align-items:center;gap:10px;min-width:0}
.mark{width:30px;height:30px;border-radius:9px;flex:none;background:conic-gradient(from 210deg,#6fae88,#9aa7a0,#4e6b5c,#6fae88);display:grid;place-items:center}
.mark::after{content:"";width:12px;height:12px;border-radius:50%;background:var(--vscode-editor-background)}
.brand b{font-size:14px;font-weight:600;display:block;line-height:1.2}
.brand small{color:var(--muted)}
.now{display:flex;align-items:center;gap:8px;min-width:0;margin-left:10px;padding-left:14px;border-left:1px solid var(--line)}
.now strong{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px}
.pill{font-size:10px;padding:1px 8px;border-radius:99px;border:1px solid var(--line);color:var(--muted);white-space:nowrap}
.dirty{width:8px;height:8px;border-radius:50%;background:var(--warn);flex:none}
.actions{margin-left:auto;display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
.btn{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:5px;border:1px solid var(--vscode-button-border,transparent);background:var(--vscode-button-secondaryBackground,rgba(128,128,128,.18));color:var(--vscode-button-secondaryForeground,inherit)}
.btn:hover{background:var(--vscode-button-secondaryHoverBackground,rgba(128,128,128,.28))}
.btn.primary{background:var(--accent);color:var(--accent-fg)}
.btn.primary:hover{background:var(--vscode-button-hoverBackground,var(--accent));filter:brightness(1.1)}
.btn.ghost{background:transparent;border-color:var(--line)}
.btn.sm{padding:3px 8px;font-size:11px}
.btn[disabled]{opacity:.4;cursor:default}
.mini{border:0;background:transparent;border-radius:4px;padding:2px 6px;color:var(--muted)}
.mini:hover{background:var(--vscode-toolbar-hoverBackground,rgba(128,128,128,.2));color:inherit}

.main{display:grid;grid-template-columns:262px minmax(0,1fr) 360px;min-height:0}
.col{min-width:0;min-height:0;display:flex;flex-direction:column}
.col+.col{border-left:1px solid var(--line)}
.col-head{padding:12px 14px 8px;display:flex;align-items:center;justify-content:space-between;gap:8px}
.col-head h2{margin:0;font-size:11px;font-weight:600;color:var(--muted);letter-spacing:.02em}
.scroll{overflow:auto;min-height:0;flex:1}

.field{width:100%;padding:6px 9px;border-radius:5px;border:1px solid var(--vscode-input-border,var(--line));background:var(--vscode-input-background,transparent)}
.field::placeholder{color:var(--vscode-input-placeholderForeground,var(--muted))}
.tabs{display:flex;gap:2px;padding:0 10px;border-bottom:1px solid var(--line)}
.tab{border:0;background:transparent;padding:7px 9px;color:var(--muted);border-bottom:2px solid transparent;margin-bottom:-1px}
.tab:hover{color:var(--vscode-foreground)}
.tab[aria-selected=true]{color:var(--vscode-foreground);border-bottom-color:var(--sage)}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.seg button{border:0;background:transparent;padding:4px 10px;color:var(--muted)}
.seg button+button{border-left:1px solid var(--line)}
.seg button[aria-pressed=true]{background:var(--raise);color:var(--vscode-foreground)}

/* library */
.lib-tools{padding:0 12px 10px;display:grid;gap:8px}
.lib-row{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.lib-list{padding:4px 8px 14px;display:grid;gap:3px;align-content:start}
.theme{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:4px;border-radius:7px;border:1px solid transparent}
.theme:hover{background:var(--vscode-list-hoverBackground,rgba(128,128,128,.1))}
.theme[aria-current=true]{background:var(--vscode-list-activeSelectionBackground,rgba(128,128,128,.18));border-color:var(--sage)}
.theme-main{display:grid;gap:5px;text-align:left;border:0;background:transparent;padding:8px 8px 8px 10px;min-width:0;color:inherit}
.theme-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.theme-sub{color:var(--muted);font-size:11px}
.chips{display:flex;height:6px;border-radius:3px;overflow:hidden;width:100%}
.chips i{flex:1}
.star{grid-column:3;border:0;background:transparent;font-size:14px;line-height:1;padding:6px 8px;color:var(--muted);border-radius:5px}
.star[aria-pressed=true]{color:#e3b341}
.empty{padding:22px 14px;text-align:center;color:var(--muted)}

/* stage */
.stage-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px 10px;flex-wrap:wrap}
.stage-head h1{margin:0;font-size:17px;font-weight:600}
.stage-head p{margin:2px 0 0;color:var(--muted)}
.stage-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.stage-body{padding:0 16px 18px}
.frame{border:1px solid var(--line);border-radius:10px;overflow:hidden;box-shadow:0 14px 34px rgba(0,0,0,.22)}
#preview{background:var(--p-bg);color:var(--p-fg);font:var(--p-size,13px)/1.65 var(--mono);transition:filter .2s}
.wb{display:grid;grid-template-rows:auto minmax(260px,1fr) auto auto;min-height:480px}
.wb.code-only{grid-template-rows:minmax(420px,1fr);min-height:420px}
.wb-title{display:flex;align-items:center;gap:8px;padding:6px 12px;background:var(--p-title-bg);color:var(--p-title-fg);font:11px var(--vscode-font-family,system-ui)}
.wb-title .dots{display:flex;gap:5px}.wb-title .dots i{width:9px;height:9px;border-radius:50%;background:currentColor;opacity:.35}
.wb-title span.t{margin:0 auto}
.wb-main{display:grid;grid-template-columns:44px 190px minmax(0,1fr);min-height:0}
.wb.code-only .wb-main{grid-template-columns:minmax(0,1fr)}
.wb-act{background:var(--p-act-bg);color:var(--p-act-fg);display:grid;align-content:start;justify-items:center;gap:14px;padding-top:12px;border-right:1px solid var(--p-border)}
.wb-act i{width:18px;height:18px;border:2px solid currentColor;border-radius:5px;opacity:.55}
.wb-act i:first-child{opacity:1;border-color:var(--p-fg)}
.wb-side{background:var(--p-side-bg);color:var(--p-side-fg);border-right:1px solid var(--p-border);font:12px var(--vscode-font-family,system-ui);min-width:0}
.wb-side h4{margin:0;padding:9px 14px;font-size:11px;font-weight:600;background:var(--p-side-hd);color:var(--p-side-fg)}
.wb-side ul{list-style:none;margin:0;padding:6px 0}
.wb-side li{padding:2px 14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb-side li.sel{background:var(--p-list-sel);color:var(--p-list-sel-fg)}
.wb-side li.git{color:var(--p-git)}
.wb-side li .badge{float:right;font-size:10px;padding:0 6px;border-radius:9px;background:var(--p-badge-bg);color:var(--p-badge-fg)}
.wb-side li.in{padding-left:28px}
.wb-ed{min-width:0;display:grid;grid-template-rows:auto 1fr}
.wb-tabs{display:flex;background:var(--p-tabs-bg);font:12px var(--vscode-font-family,system-ui);overflow:hidden}
.wb-tabs span{padding:7px 16px;color:var(--p-tab-i-fg);background:var(--p-tab-i-bg);border-right:1px solid var(--p-border);white-space:nowrap}
.wb-tabs span.on{color:var(--p-tab-a-fg);background:var(--p-tab-a-bg);box-shadow:inset 0 1px 0 var(--p-accent)}
.code{padding:10px 0;overflow:auto;white-space:pre;tab-size:2}
.ln{display:grid;grid-template-columns:48px 1fr}
.ln>b{font-weight:400;text-align:right;padding-right:16px;color:var(--p-lnum);user-select:none}
.ln.act{background:var(--p-line-hl)}.ln.act>b{color:var(--p-lnum-a)}
.ln.pick>span>em{font-style:normal;background:var(--p-sel)}
.cur{display:inline-block;width:2px;height:1.2em;vertical-align:text-bottom;background:var(--p-cursor)}
.t-kw{color:var(--s-keyword)}.t-str{color:var(--s-string)}.t-fn{color:var(--s-function)}.t-com{color:var(--s-comment);font-style:italic}
.t-num{color:var(--s-number)}.t-typ{color:var(--s-type)}.t-var{color:var(--s-variable)}.t-err{color:var(--p-err);text-decoration:underline wavy}
.wb-panel{border-top:1px solid var(--p-border);background:var(--p-panel-bg);font:12px var(--mono);min-height:0}
.wb-panel .ph{display:flex;gap:16px;padding:6px 14px;font:11px var(--vscode-font-family,system-ui);color:var(--p-side-fg);border-bottom:1px solid var(--p-border)}
.wb-panel .ph .on{color:var(--p-fg);box-shadow:0 2px 0 var(--p-accent)}
.term{background:var(--p-term-bg);color:var(--p-term-fg);padding:8px 14px;white-space:pre-wrap;min-height:74px}
.term .ok{color:var(--p-git)}.term .wr{color:var(--p-warn)}.term .er{color:var(--p-err)}.term .in{color:var(--p-info)}
.wb-status{display:flex;gap:16px;padding:3px 12px;background:var(--p-st-bg);color:var(--p-st-fg);font:11px var(--vscode-font-family,system-ui)}
.wb-status .sp{margin-left:auto}
.wb.code-only .wb-title,.wb.code-only .wb-act,.wb.code-only .wb-side,.wb.code-only .wb-panel,.wb.code-only .wb-status{display:none}
.stage-note{margin-top:10px;color:var(--muted);display:flex;gap:14px;flex-wrap:wrap}

/* inspector */
.insp-body{padding:10px 12px 18px;display:grid;gap:12px;align-content:start}
.group{border:1px solid var(--line);border-radius:8px;background:var(--surface)}
.group>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:8px 11px;font-weight:600}
.group>summary::-webkit-details-marker{display:none}
.group>summary::before{content:"›";margin-right:8px;color:var(--muted);transition:transform .15s;display:inline-block}
.group[open]>summary::before{transform:rotate(90deg)}
.group>summary .n{margin-left:auto;font-weight:400;color:var(--muted)}
.rows{padding:2px 11px 10px;display:grid;gap:7px}
.crow{display:grid;grid-template-columns:minmax(0,1fr) 30px 92px 22px;gap:6px;align-items:center}
.crow label{min-width:0;display:grid}
.crow label span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.crow label small{color:var(--muted);font:10px var(--mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.swatch{width:30px;height:26px;padding:0;border:1px solid var(--line);border-radius:5px;background:transparent}
.hex{width:92px;padding:4px 6px;font:11px var(--mono);border-radius:5px;border:1px solid var(--vscode-input-border,var(--line));background:var(--vscode-input-background,transparent)}
.hex:placeholder-shown{color:var(--muted)}
.roles{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.role{display:grid;grid-template-columns:30px 1fr;gap:3px 7px;align-items:center}
.role label{grid-column:1/-1;color:var(--muted);font-size:11px}
.role .hex{width:100%}
.rule{display:grid;grid-template-columns:minmax(0,1fr) 28px auto auto auto 22px;gap:4px;align-items:center}
.rule code{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:11px var(--mono)}
.sty{width:22px;height:22px;padding:0;border:1px solid var(--line);background:transparent;border-radius:4px;color:var(--muted)}
.sty[aria-pressed=true]{background:var(--raise);color:var(--vscode-foreground);border-color:var(--sage)}
.add{display:grid;grid-template-columns:1fr auto;gap:6px}
.check{display:flex;align-items:center;gap:8px}
.check input{accent-color:var(--sage)}
.score{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center}
.score b{font-size:24px;font-weight:600;line-height:1}
.meter{height:6px;border-radius:3px;background:var(--line);overflow:hidden}
.meter i{display:block;height:100%;background:var(--ok)}
.qrow{display:grid;grid-template-columns:14px minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)}
.qrow:last-child{border:0}
.qrow .sw{width:14px;height:14px;border-radius:4px;border:1px solid var(--line)}
.qrow .ratio{font:11px var(--mono)}
.tag{font-size:10px;padding:0 6px;border-radius:9px;border:1px solid var(--line);color:var(--muted)}
.tag.pass{color:var(--ok);border-color:var(--ok)}.tag.fail{color:var(--bad);border-color:var(--bad)}
.stack{display:grid;gap:8px}
.preset-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.preset{display:grid;gap:4px;text-align:left;padding:8px;border-radius:7px;border:1px solid var(--line);background:transparent}
.preset:hover{background:var(--vscode-list-hoverBackground,rgba(128,128,128,.12))}
.preset small{color:var(--muted)}
.harmony{display:flex;gap:6px;flex-wrap:wrap}
.harmony button{display:grid;gap:3px;justify-items:center;border:0;background:transparent;color:var(--muted);font-size:10px;padding:2px}
.harmony i{width:34px;height:34px;border-radius:8px;border:1px solid var(--line)}
.range{display:grid;grid-template-columns:90px 1fr 34px;gap:8px;align-items:center}
.range input{accent-color:var(--sage)}
.hint{color:var(--muted);margin:0}

.foot{display:flex;align-items:center;gap:16px;padding:6px 16px;border-top:1px solid var(--line);background:var(--surface);color:var(--muted);flex-wrap:wrap}
.foot .live{display:flex;align-items:center;gap:6px}
.foot .live i{width:7px;height:7px;border-radius:50%;background:var(--ok)}
.foot .live.idle i{background:var(--muted)}
.foot kbd{font:10px var(--mono);padding:0 5px;border:1px solid var(--line);border-radius:4px}
.foot .sp{margin-left:auto}
.toast{position:fixed;left:50%;bottom:44px;transform:translate(-50%,12px);background:var(--vscode-notifications-background,#252526);color:var(--vscode-notifications-foreground,#ddd);border:1px solid var(--line);padding:8px 14px;border-radius:7px;opacity:0;pointer-events:none;transition:.2s;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.toast.on{opacity:1;transform:translate(-50%,0)}

.pane-nav{display:none}
.btn .ic,.btn .short{display:none}
.apply-mini{border:0;border-radius:5px;padding:3px 10px;background:var(--accent);color:var(--accent-fg);font-size:11px;font-weight:600}
.apply-mini:hover{filter:brightness(1.1)}
@media (max-width:1180px){
  body{overflow:auto}.app{height:auto;min-height:100vh}
  .main{grid-template-columns:240px minmax(0,1fr)}
  .col.insp{grid-column:1/-1;border-left:0;border-top:1px solid var(--line)}
}
/* ── sidebar / narrow mode: one pane at a time ── */
@media (max-width:760px){
  body{overflow:hidden}
  .app{height:100vh;min-height:0;grid-template-rows:auto auto minmax(0,1fr) auto}
  .bar{padding:8px 10px;gap:6px 8px;flex-wrap:wrap}
  .brand small{display:none}.brand b{font-size:13px}
  .mark{width:24px;height:24px;border-radius:7px}.mark::after{width:10px;height:10px}
  .now{order:3;flex:1 1 100%;margin:0;padding:0;border:0}
  .now strong{max-width:none;flex:1}
  .actions{margin-left:auto;gap:4px;flex-wrap:nowrap}
  .btn.ic-only{width:28px;min-height:26px;padding:0;justify-content:center;font-size:14px}
  .btn.ic-only .tx{display:none}.btn.ic-only .ic{display:inline}
  .btn .long{display:none}.btn .short{display:inline}
  .pane-nav{display:flex;gap:2px;padding:4px 8px;border-bottom:1px solid var(--line);background:var(--surface)}
  .pane-nav button{flex:1;border:0;background:transparent;border-radius:6px;padding:6px 4px;color:var(--muted);font-weight:500}
  .pane-nav button:hover{color:var(--vscode-foreground)}
  .pane-nav button[aria-selected=true]{background:var(--raise);color:var(--vscode-foreground);box-shadow:inset 0 -2px 0 var(--sage)}
  .main{display:flex;flex-direction:column;min-height:0;overflow:hidden}
  .col{display:none;flex:1;min-height:0;border:0!important}
  .app[data-show=themes] .col.lib,.app[data-show=preview] .col.stage,.app[data-show=edit] .col.insp{display:flex}
  .col-head{padding:10px 12px 6px}
  .lib-tools{padding:0 10px 8px}.lib-list{padding:4px 6px 12px}
  .theme-main{padding:7px 8px}
  .stage-head{padding:10px 12px 8px}.stage-head h1{font-size:15px}
  .stage-tools{width:100%}.stage-tools .seg{flex:1}.stage-tools .seg button{flex:1}
  .stage-body{padding:0 10px 14px}.stage-note{display:none}
  .wb{min-height:300px}.wb-main{grid-template-columns:36px minmax(0,1fr)}.wb-side{display:none}.wb.code-only{min-height:240px}
  .ln{grid-template-columns:34px 1fr}.ln>b{padding-right:10px}
  .tabs{padding:0 6px}.tab{padding:7px 8px}
  .insp-body{padding:8px 10px 14px}
  .roles{grid-template-columns:1fr 1fr}
  .crow{grid-template-columns:minmax(0,1fr) 28px 84px 20px;gap:5px}.hex{width:84px}
  .rule{grid-template-columns:minmax(0,1fr) 26px auto auto auto 20px}
  .range{grid-template-columns:78px 1fr 32px}
  .foot{padding:5px 10px;gap:8px}.foot .kbds{display:none}.foot .reset{margin-left:auto}
  #quality-foot{display:none}
  .toast{bottom:36px;max-width:calc(100vw - 24px);text-align:center}
}
@media (max-width:300px){.roles{grid-template-columns:1fr}.crow label small{display:none}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`;

/* ───────────────────────── client (runs in webview) ───────────────────────── */

function clientMain(data) {
  'use strict';
  const vscode = acquireVsCodeApi();
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clone = value => JSON.parse(JSON.stringify(value));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  /* ── colour maths ── */
  const HEX = /^#([\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i;
  const clamp01 = value => Math.max(0, Math.min(1, value));
  function norm(hex) {
    if (typeof hex !== 'string' || !HEX.test(hex.trim())) return null;
    let value = hex.trim().slice(1).toLowerCase();
    if (value.length === 3) value = [...value].map(char => char + char).join('');
    return '#' + value;
  }
  const rgbOf = hex => { const n = norm(hex); return n ? [1, 3, 5].map(i => parseInt(n.slice(i, i + 2), 16)) : null; };
  const alphaOf = hex => { const n = norm(hex); return n && n.length === 9 ? n.slice(7) : ''; };
  const base6 = hex => { const n = norm(hex); return n ? n.slice(0, 7) : null; };
  const toHex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  function toHsl(hex) {
    const [r, g, b] = rgbOf(hex).map(v => v / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2;
    let h = 0, s = 0;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return [h, s, l];
  }
  function fromHsl(h, s, l) {
    h = ((h % 360) + 360) % 360; s = clamp01(s); l = clamp01(l);
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return toHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }
  function lum(hex) {
    const rgb = rgbOf(hex); if (!rgb) return 0;
    const [r, g, b] = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function contrast(a, b) {
    const x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function mix(a, b, amount) {
    const x = rgbOf(a), y = rgbOf(b); if (!x || !y) return a;
    return toHex(x[0] + (y[0] - x[0]) * amount, x[1] + (y[1] - x[1]) * amount, x[2] + (y[2] - x[2]) * amount);
  }
  const mapHex = (hex, fn) => { const n = norm(hex); return n ? fn(n.slice(0, 7)) + n.slice(7) : hex; };
  function ensureContrast(fg, bg, target) {
    if (!rgbOf(fg) || !rgbOf(bg)) return fg;
    const [h, s, l0] = toHsl(base6(fg)); const dir = lum(bg) < 0.5 ? 1 : -1;
    let l = l0, out = base6(fg);
    for (let i = 0; i < 50 && contrast(out, bg) < target; i++) { l = clamp01(l + dir * 0.02); out = fromHsl(h, s, l); }
    return out + alphaOf(fg);
  }

  /* ── defaults / inheritance (what VS Code shows when a key is not set) ── */
  const FALLBACK = {
    'editor.background': '#1e1e1e', 'editor.foreground': '#d4d4d4', 'textLink.foreground': '#6ab0f3',
    'editor.selectionBackground': '#264f78', 'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '@editor.foreground', 'editorCursor.foreground': '@editor.foreground',
    'editor.lineHighlightBackground': '#80808018', 'editorIndentGuide.background': '#80808030',
    'sideBar.background': '@editor.background', 'sideBar.foreground': '@editor.foreground',
    'sideBarSectionHeader.background': '@sideBar.background',
    'activityBar.background': '@sideBar.background', 'activityBar.foreground': '@editor.foreground',
    'titleBar.activeBackground': '@sideBar.background', 'titleBar.activeForeground': '@editor.foreground',
    'tab.activeBackground': '@editor.background', 'tab.activeForeground': '@editor.foreground',
    'tab.inactiveBackground': '@sideBar.background', 'tab.inactiveForeground': '@editorLineNumber.foreground',
    'editorGroupHeader.tabsBackground': '@sideBar.background',
    'statusBar.background': '@sideBar.background', 'statusBar.foreground': '@editor.foreground',
    'panel.background': '@editor.background', 'panel.border': '#80808040',
    'terminal.background': '@panel.background', 'terminal.foreground': '@editor.foreground',
    'focusBorder': '@textLink.foreground', 'button.background': '@textLink.foreground', 'button.foreground': '@editor.background',
    'list.activeSelectionBackground': '@editor.selectionBackground', 'list.activeSelectionForeground': '@editor.foreground',
    'list.hoverBackground': '#80808020', 'badge.background': '@textLink.foreground', 'badge.foreground': '@editor.background',
    'editorError.foreground': '#f14c4c', 'editorWarning.foreground': '#cca700', 'editorInfo.foreground': '#3794ff',
    'gitDecoration.modifiedResourceForeground': '#6fae88', 'gitDecoration.untrackedResourceForeground': '#73c991',
  };
  const SYNTAX_DEFAULT = {
    keyword: '#c678dd', string: '#98c379', function: '#61afef', comment: '#7f8c8d',
    number: '#d19a66', type: '#e5c07b', variable: '#e06c75',
  };

  /* ── editable groups ── */
  const GROUPS = [
    ['Editor', [
      ['editor.background', 'Background'], ['editor.foreground', 'Text'], ['editor.selectionBackground', 'Selection'],
      ['editor.lineHighlightBackground', 'Current line'], ['editorCursor.foreground', 'Cursor'],
      ['editorLineNumber.foreground', 'Line numbers'], ['editorLineNumber.activeForeground', 'Active line number'],
      ['editorIndentGuide.background', 'Indent guides'],
    ]],
    ['Accent and actions', [
      ['textLink.foreground', 'Accent / links'], ['focusBorder', 'Focus ring'], ['button.background', 'Button'],
      ['button.foreground', 'Button text'], ['badge.background', 'Badge'], ['badge.foreground', 'Badge text'],
      ['list.activeSelectionBackground', 'Selected list item'], ['list.activeSelectionForeground', 'Selected item text'],
      ['list.hoverBackground', 'List hover'],
    ]],
    ['Side bar and activity bar', [
      ['sideBar.background', 'Side bar'], ['sideBar.foreground', 'Side bar text'], ['sideBarSectionHeader.background', 'Section header'],
      ['activityBar.background', 'Activity bar'], ['activityBar.foreground', 'Activity bar icons'],
    ]],
    ['Tabs and title bar', [
      ['editorGroupHeader.tabsBackground', 'Tab strip'], ['tab.activeBackground', 'Active tab'], ['tab.activeForeground', 'Active tab text'],
      ['tab.inactiveBackground', 'Inactive tab'], ['tab.inactiveForeground', 'Inactive tab text'],
      ['titleBar.activeBackground', 'Title bar'], ['titleBar.activeForeground', 'Title bar text'],
    ]],
    ['Panel, terminal and status bar', [
      ['panel.background', 'Panel'], ['panel.border', 'Panel border'], ['terminal.background', 'Terminal'],
      ['terminal.foreground', 'Terminal text'], ['statusBar.background', 'Status bar'], ['statusBar.foreground', 'Status bar text'],
    ]],
    ['Diagnostics and Git', [
      ['editorError.foreground', 'Error'], ['editorWarning.foreground', 'Warning'], ['editorInfo.foreground', 'Info'],
      ['gitDecoration.modifiedResourceForeground', 'Modified file'], ['gitDecoration.untrackedResourceForeground', 'New file'],
    ]],
  ];
  const ALL_KEYS = GROUPS.flatMap(group => group[1]);
  const ROLES = Object.keys(SYNTAX_DEFAULT);

  /* ── state ── */
  const S = {
    themes: data.themes, favorites: new Set(data.favorites), recent: data.recent,
    current: null, colors: {}, syntax: {}, tokenColors: [], semanticTokenColors: {}, semanticHighlighting: true,
    dirty: false, history: [], future: [], lastKey: '', lastAt: 0,
    pane: 'themes', libTab: 'all', insp: 'colors', view: 'workbench', sample: 'javascript',
    sim: 'none', glare: 0, size: 13, filter: '', tokFilter: '', closed: new Set(),
  };

  function loadTheme(theme) {
    S.current = theme;
    S.colors = clone(theme.colors || {}); S.syntax = clone(theme.syntax || {});
    S.tokenColors = clone(theme.tokenColors || []); S.semanticTokenColors = clone(theme.semanticTokenColors || {});
    S.semanticHighlighting = theme.semanticHighlighting !== false;
    S.history = []; S.future = []; S.dirty = false; S.lastKey = '';
  }
  const snapshot = () => clone({
    colors: S.colors, syntax: S.syntax, tokenColors: S.tokenColors,
    semanticTokenColors: S.semanticTokenColors, semanticHighlighting: S.semanticHighlighting,
  });
  function restore(s) {
    S.colors = clone(s.colors); S.syntax = clone(s.syntax); S.tokenColors = clone(s.tokenColors);
    S.semanticTokenColors = clone(s.semanticTokenColors); S.semanticHighlighting = s.semanticHighlighting;
  }
  function checkpoint(key) {
    const now = Date.now();
    if (key !== S.lastKey || now - S.lastAt > 900) {
      S.history.push(snapshot()); if (S.history.length > 100) S.history.shift(); S.future = [];
    }
    S.lastKey = key; S.lastAt = now; S.dirty = true;
  }

  /* colour lookup with inheritance */
  function col(key, depth = 0) {
    const own = norm(S.colors[key]);
    if (own) return own;
    const fb = FALLBACK[key];
    if (!fb || depth > 6) return '#808080';
    return fb[0] === '@' ? col(fb.slice(1), depth + 1) : fb;
  }
  const syn = role => norm(S.syntax[role]) || SYNTAX_DEFAULT[role];

  /* ── live push to VS Code ── */
  let liveTimer;
  const payload = () => ({
    source: S.current.label, colors: S.colors, syntax: S.syntax, tokenColors: S.tokenColors,
    semanticTokenColors: S.semanticTokenColors, semanticHighlighting: S.semanticHighlighting,
  });
  function pushLive() {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => vscode.postMessage({ type: 'setState', ...payload() }), 80);
  }

  /* ── toast ── */
  let toastTimer;
  function toast(message) {
    const el = $('#toast'); el.textContent = message; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2200);
  }

  /* ── library ── */
  function matches(theme) {
    const q = $('#q').value.trim().toLowerCase();
    const v = $('#variant').value, src = $('#source').value;
    if (S.libTab === 'fav' && !S.favorites.has(theme.label)) return false;
    if (S.libTab === 'recent' && !S.recent.includes(theme.label)) return false;
    if (q && !(theme.label + ' ' + theme.mood).toLowerCase().includes(q)) return false;
    if (v !== 'all' && theme.type !== v) return false;
    if (src !== 'all' && (src === 'custom') !== theme.custom) return false;
    return true;
  }
  function renderLibrary() {
    let list = S.themes.filter(matches);
    if (S.libTab === 'recent') list.sort((a, b) => S.recent.indexOf(a.label) - S.recent.indexOf(b.label));
    $('#count').textContent = list.length + ' of ' + S.themes.length;
    $('#list').innerHTML = list.map(t => {
      const c = t.colors || {}, s = t.syntax || {};
      const swatches = [c['editor.background'], c['sideBar.background'] || c['editor.background'], c['editor.foreground'], c['textLink.foreground'], s.keyword, s.string, s.function]
        .map(x => '<i style="background:' + esc(x || '#777') + '"></i>').join('');
      return '<div class="theme" ' + (t.label === S.current.label ? 'aria-current="true"' : '') + '>' +
        '<button class="theme-main" data-act="pick-theme" data-label="' + esc(t.label) + '">' +
        '<span class="theme-name">' + esc(t.label) + '</span>' +
        '<span class="chips" aria-hidden="true">' + swatches + '</span>' +
        '<span class="theme-sub">' + (t.custom ? 'Custom' : 'Built-in') + ' · ' + (t.type === 'light' ? 'Light' : 'Dark') + '</span></button>' +
        (t.label === S.current.label ? '<button class="apply-mini" data-act="apply">Apply</button>' : '') + '<button class="star" data-act="fav" data-label="' + esc(t.label) + '" aria-pressed="' + S.favorites.has(t.label) +
        '" aria-label="Favorite ' + esc(t.label) + '">' + (S.favorites.has(t.label) ? '★' : '☆') + '</button></div>';
    }).join('') || '<div class="empty">' + (S.libTab === 'fav' ? 'Star a theme to keep it here.' : S.libTab === 'recent' ? 'Themes you apply will show up here.' : 'No themes match these filters.') + '</div>';
    $$('[data-lib]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.lib === S.libTab)));
  }

  /* ── preview ── */
  const MARKUP = /\{(\w+)\|([^}]*)\}/g;
  function tokens(line) {
    let out = '', last = 0, m; MARKUP.lastIndex = 0;
    while ((m = MARKUP.exec(line))) { out += esc(line.slice(last, m.index)) + '<span class="t-' + m[1] + '">' + esc(m[2]) + '</span>'; last = m.index + m[0].length; }
    return out + esc(line.slice(last));
  }
  function samples() {
    const name = String(S.current.label).replace(/[{}|]/g, ' ');
    return {
      javascript: ['{com|// Pick the theme that fits the time of day}', "{kw|import} { {var|palette} } {kw|from} {str|'./forest-ash'};", '',
        '{kw|export function} {fn|applyTheme}({var|label}) {', '  {kw|const} {var|theme} = {var|palette}.{fn|find}({var|t} => {var|t}.name === {var|label});',
        '  {kw|if} (!{var|theme}) {kw|return} {num|null};', "  {kw|return} { ...{var|theme}, contrast: {num|7.1}, name: {str|'" + name + "'} };", '}'],
      typescript: ['{kw|interface} {typ|Palette} {', '  {var|background}: {typ|string};', '  {var|accent}: {typ|string};', '  {var|contrast}?: {typ|number};', '}', '',
        '{kw|export const} {var|forestAsh}: {typ|Palette} = {', "  {var|background}: {str|'#1b211e'},", "  {var|accent}: {str|'#86b89b'},", '  {var|contrast}: {num|7.4},', '};'],
      python: ['{com|# Score a palette against WCAG}', '{kw|def} {fn|ratio}({var|fg}: {typ|str}, {var|bg}: {typ|str}) -> {typ|float}:', '    {kw|return} ({fn|lum}({var|fg}) + {num|0.05}) / ({fn|lum}({var|bg}) + {num|0.05})', '',
        "{kw|print}({fn|ratio}({str|'#e6ece8'}, {str|'#1b211e'}))  {com|# " + name + '}'],
      json: ['{', '  {str|"name"}: {str|"' + name + '"},', '  {str|"type"}: {str|"dark"},', '  {str|"colors"}: {', '    {str|"editor.background"}: {str|"#1b211e"},', '    {str|"textLink.foreground"}: {str|"#86b89b"}', '  },', '  {str|"semanticHighlighting"}: {kw|true}', '}'],
      markdown: ['{kw|#} ' + name, '', '{com|Readable at a glance, calm over a long day.}', '', '{kw|-} {fn|Contrast} checked against WCAG AA', '{kw|-} {fn|Syntax} tuned for dark rooms', '', "{str|`npm run theme`}"],
      terminal: ['{com|$} forest-ash build --theme {str|"' + name + '"}', '{fn|✓} 42 colors resolved', '{kw|!} 2 pairs below 4.5:1', '{com|$} {cur|}'],
    }[S.sample];
  }
  function codeBlock(lines) {
    return '<div class="code">' + lines.map((line, i) =>
      '<div class="ln' + (i === 2 ? ' act' : '') + (i === 4 ? ' pick' : '') + '"><b>' + (i + 1) + '</b><span>' +
      (i === 4 ? '<em>' + tokens(line) + '</em>' : tokens(line)) + (i === 2 ? '<span class="cur"></span>' : '') + '</span></div>').join('') + '</div>';
  }
  function renderPreview() {
    const c = col, el = $('#preview');
    const vars = {
      '--p-bg': c('editor.background'), '--p-fg': c('editor.foreground'), '--p-sel': c('editor.selectionBackground'),
      '--p-line-hl': c('editor.lineHighlightBackground'), '--p-cursor': c('editorCursor.foreground'),
      '--p-lnum': c('editorLineNumber.foreground'), '--p-lnum-a': c('editorLineNumber.activeForeground'),
      '--p-act-bg': c('activityBar.background'), '--p-act-fg': c('activityBar.foreground'),
      '--p-side-bg': c('sideBar.background'), '--p-side-fg': c('sideBar.foreground'), '--p-side-hd': c('sideBarSectionHeader.background'),
      '--p-tabs-bg': c('editorGroupHeader.tabsBackground'), '--p-tab-a-bg': c('tab.activeBackground'), '--p-tab-a-fg': c('tab.activeForeground'),
      '--p-tab-i-bg': c('tab.inactiveBackground'), '--p-tab-i-fg': c('tab.inactiveForeground'),
      '--p-st-bg': c('statusBar.background'), '--p-st-fg': c('statusBar.foreground'),
      '--p-title-bg': c('titleBar.activeBackground'), '--p-title-fg': c('titleBar.activeForeground'),
      '--p-panel-bg': c('panel.background'), '--p-border': norm(S.colors['panel.border']) || mix(c('editor.background'), c('editor.foreground'), 0.16),
      '--p-term-bg': c('terminal.background'), '--p-term-fg': c('terminal.foreground'),
      '--p-accent': c('textLink.foreground'), '--p-badge-bg': c('badge.background'), '--p-badge-fg': c('badge.foreground'),
      '--p-list-sel': c('list.activeSelectionBackground'), '--p-list-sel-fg': c('list.activeSelectionForeground'),
      '--p-err': c('editorError.foreground'), '--p-warn': c('editorWarning.foreground'), '--p-info': c('editorInfo.foreground'),
      '--p-git': c('gitDecoration.modifiedResourceForeground'), '--p-size': S.size + 'px',
    };
    ROLES.forEach(role => { vars['--s-' + role] = syn(role); });
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    const filters = [];
    if (S.sim !== 'none') filters.push('url(#sim-' + S.sim + ')');
    if (S.glare) filters.push('brightness(' + (1 - S.glare / 100) + ') saturate(' + (1 - S.glare / 250) + ')');
    el.style.filter = filters.join(' ');
    const lines = samples();
    const code = codeBlock(lines);
    if (S.view === 'code') { el.innerHTML = '<div class="wb code-only"><div class="wb-main"><div class="wb-ed">' + code + '</div></div></div>'; return; }
    const term = ['<span class="in">$</span> forest-ash build', '<span class="ok">✓</span> compiled 42 colors', '<span class="wr">!</span> 1 warning · <span class="er">1 error</span>'].join('\n');
    el.innerHTML = '<div class="wb">' +
      '<div class="wb-title"><span class="dots"><i></i><i></i><i></i></span><span class="t">' + esc(S.current.label) + ' — Visual Studio Code</span></div>' +
      '<div class="wb-main"><div class="wb-act"><i></i><i></i><i></i><i></i></div>' +
      '<div class="wb-side"><h4>Explorer</h4><ul><li>▾ forest-ash</li><li class="in sel">theme.json</li><li class="in git">palette.js <span class="badge">M</span></li><li class="in">README.md</li><li class="in git">notes.md <span class="badge">U</span></li></ul></div>' +
      '<div class="wb-ed"><div class="wb-tabs"><span class="on">palette.js</span><span>theme.json</span><span>README.md</span></div>' + code + '</div></div>' +
      '<div class="wb-panel"><div class="ph"><span class="on">Terminal</span><span>Problems</span><span>Output</span></div><div class="term">' + term + '</div></div>' +
      '<div class="wb-status"><span>⎇ main</span><span>0 ↓ 1 ↑</span><span class="sp">Ln 3, Col 14</span><span>UTF-8</span><span>' + esc({ javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python', json: 'JSON', markdown: 'Markdown', terminal: 'Shell' }[S.sample]) + '</span></div></div>';
  }

  /* ── header + footer ── */
  function renderChrome() {
    const t = S.current;
    $('#title').textContent = t.label; $('#mood').textContent = t.mood || 'Forest Ash palette';
    $('#now-name').textContent = t.label; $('#now-type').textContent = t.type === 'light' ? 'Light' : 'Dark';
    $('#dirty').hidden = !S.dirty;
    $('[data-act=undo]').disabled = !S.history.length; $('[data-act=redo]').disabled = !S.future.length;
    $('[data-act=discard]').disabled = !S.dirty;
    const live = $('#live'); live.classList.toggle('idle', !S.dirty);
    $('#live-text').textContent = S.dirty ? 'Live: edits are applied to VS Code as you make them' : 'No unsaved changes';
    const { passed, total } = audit(); $('#quality-foot').textContent = 'Contrast ' + passed + '/' + total + ' pass';
    $$('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === S.view)));
    $('#sample').value = S.sample;
    $('.app').dataset.show = S.pane;
    $$('[data-pane]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.pane === S.pane)));
  }

  /* ── quality audit ── */
  function pairs() {
    const bg = col('editor.background');
    return [
      ['Editor text', col('editor.foreground'), bg, 4.5, ['colors', 'editor.foreground']],
      ['Keywords', syn('keyword'), bg, 4.5, ['syntax', 'keyword']], ['Strings', syn('string'), bg, 4.5, ['syntax', 'string']],
      ['Functions', syn('function'), bg, 4.5, ['syntax', 'function']], ['Numbers', syn('number'), bg, 4.5, ['syntax', 'number']],
      ['Types', syn('type'), bg, 4.5, ['syntax', 'type']], ['Variables', syn('variable'), bg, 4.5, ['syntax', 'variable']],
      ['Comments', syn('comment'), bg, 3, ['syntax', 'comment']],
      ['Line numbers', col('editorLineNumber.foreground'), bg, 3, ['colors', 'editorLineNumber.foreground']],
      ['Active line number', col('editorLineNumber.activeForeground'), col('editor.lineHighlightBackground').length === 7 ? bg : bg, 4.5, ['colors', 'editorLineNumber.activeForeground']],
      ['Side bar text', col('sideBar.foreground'), col('sideBar.background'), 4.5, ['colors', 'sideBar.foreground']],
      ['Active tab', col('tab.activeForeground'), col('tab.activeBackground'), 4.5, ['colors', 'tab.activeForeground']],
      ['Inactive tab', col('tab.inactiveForeground'), col('tab.inactiveBackground'), 4.5, ['colors', 'tab.inactiveForeground']],
      ['Title bar', col('titleBar.activeForeground'), col('titleBar.activeBackground'), 4.5, ['colors', 'titleBar.activeForeground']],
      ['Status bar', col('statusBar.foreground'), col('statusBar.background'), 4.5, ['colors', 'statusBar.foreground']],
      ['Terminal', col('terminal.foreground'), col('terminal.background'), 4.5, ['colors', 'terminal.foreground']],
      ['Links', col('textLink.foreground'), bg, 4.5, ['colors', 'textLink.foreground']],
      ['Button text', col('button.foreground'), col('button.background'), 4.5, ['colors', 'button.foreground']],
      ['Badge text', col('badge.foreground'), col('badge.background'), 4.5, ['colors', 'badge.foreground']],
      ['Errors', col('editorError.foreground'), bg, 4.5, ['colors', 'editorError.foreground']],
      ['Warnings', col('editorWarning.foreground'), bg, 4.5, ['colors', 'editorWarning.foreground']],
    ].map(([label, fg, back, need, ref]) => ({ label, fg, bg: back, need, ref, ratio: contrast(fg, back) }));
  }
  function audit() {
    const list = pairs(); return { list, total: list.length, passed: list.filter(p => p.ratio >= p.need).length };
  }

  /* ── inspector: colours ── */
  function colorRow(key, label) {
    const set = norm(S.colors[key]), eff = set || col(key);
    const changed = (S.current.colors || {})[key] !== S.colors[key];
    return '<div class="crow" data-row="' + esc(key) + '"><label for="p-' + esc(key) + '"><span>' + esc(label) + '</span><small>' + esc(key) + '</small></label>' +
      '<input class="swatch" id="p-' + esc(key) + '" type="color" data-pick="' + esc(key) + '" value="' + base6(eff) + '" aria-label="' + esc(label) + ' colour picker">' +
      '<input class="hex" type="text" spellcheck="false" maxlength="9" data-hex="' + esc(key) + '" value="' + esc(set || '') + '" placeholder="' + esc(eff) + '" aria-label="' + esc(label) + ' hex value">' +
      '<button class="mini" data-act="reset-color" data-key="' + esc(key) + '" title="Reset to theme value" aria-label="Reset ' + esc(label) + '"' + (changed ? '' : ' hidden') + '>↺</button></div>';
  }
  function renderColorList() {
    const f = S.filter.toLowerCase();
    const html = GROUPS.map(([name, items]) => {
      const rows = items.filter(([key, label]) => !f || (key + ' ' + label).toLowerCase().includes(f));
      if (!rows.length) return '';
      return '<details class="group" data-group="' + esc(name) + '"' + (S.closed.has(name) && !f ? '' : ' open') + '><summary>' + esc(name) + '<span class="n">' + rows.length + '</span></summary><div class="rows">' +
        rows.map(([k, l]) => colorRow(k, l)).join('') + '</div></details>';
    }).join('');
    $('#color-list').innerHTML = html || '<div class="empty">No colors match “' + esc(S.filter) + '”.</div>';
  }
  function tabColors() {
    return '<input id="ck-filter" class="field" type="search" placeholder="Filter colors by name or key" value="' + esc(S.filter) + '" aria-label="Filter colors">' +
      '<div id="color-list" class="stack"></div>';
  }

  /* ── inspector: syntax ── */
  function styleBtn(i, style, label, on) {
    return '<button class="sty" data-act="tok-style" data-i="' + i + '" data-style="' + style + '" aria-pressed="' + on + '" title="' + style + '" aria-label="' + style + '">' + label + '</button>';
  }
  function renderRules() {
    const f = S.tokFilter.toLowerCase();
    const rows = S.tokenColors.map((rule, i) => ({ rule, i })).filter(({ rule }) => {
      const scope = Array.isArray(rule.scope) ? rule.scope.join(', ') : (rule.scope || rule.name || '');
      return !f || scope.toLowerCase().includes(f);
    });
    $('#rules').innerHTML = rows.slice(0, 120).map(({ rule, i }) => {
      const st = rule.settings || {}, fs = st.fontStyle || '';
      const scope = Array.isArray(rule.scope) ? rule.scope.join(', ') : (rule.scope || rule.name || 'unnamed');
      return '<div class="rule"><code title="' + esc(scope) + '">' + esc(scope) + '</code>' +
        '<input class="swatch" style="width:28px;height:24px" type="color" data-tok="' + i + '" value="' + (base6(st.foreground) || '#888888') + '" aria-label="Color for ' + esc(scope) + '">' +
        styleBtn(i, 'bold', '<b>B</b>', fs.includes('bold')) + styleBtn(i, 'italic', '<i>I</i>', fs.includes('italic')) + styleBtn(i, 'underline', '<u>U</u>', fs.includes('underline')) +
        '<button class="mini" data-act="tok-del" data-i="' + i + '" aria-label="Remove rule ' + esc(scope) + '">✕</button></div>';
    }).join('') || '<p class="hint">' + (S.tokenColors.length ? 'No rules match this filter.' : 'No token rules yet. Add one below.') + '</p>';
    $('#rule-count').textContent = rows.length > 120 ? 'Showing 120 of ' + rows.length : rows.length + ' rules';
  }
  function renderSemantic() {
    const entries = Object.entries(S.semanticTokenColors);
    $('#sem-list').innerHTML = entries.map(([selector, value]) => {
      const fg = typeof value === 'string' ? value : (value && value.foreground);
      return '<div class="rule" style="grid-template-columns:minmax(0,1fr) 28px 22px"><code>' + esc(selector) + '</code>' +
        '<input class="swatch" style="width:28px;height:24px" type="color" data-sem="' + esc(selector) + '" value="' + (base6(fg) || '#888888') + '" aria-label="Color for ' + esc(selector) + '">' +
        '<button class="mini" data-act="sem-del" data-sel="' + esc(selector) + '" aria-label="Remove ' + esc(selector) + '">✕</button></div>';
    }).join('') || '<p class="hint">No semantic overrides.</p>';
  }
  function tabSyntax() {
    return '<section class="group" style="padding:11px"><div class="roles">' + ROLES.map(role =>
      '<div class="role"><label for="r-' + role + '">' + role[0].toUpperCase() + role.slice(1) + '</label>' +
      '<input class="swatch" id="r-' + role + '" type="color" data-role="' + role + '" value="' + base6(syn(role)) + '">' +
      '<input class="hex" type="text" maxlength="7" spellcheck="false" data-role-hex="' + role + '" value="' + esc(S.syntax[role] || '') + '" placeholder="' + syn(role) + '" aria-label="' + role + ' hex"></div>').join('') + '</div></section>' +
      '<section class="group" style="padding:11px"><div class="stack"><div style="display:flex;justify-content:space-between;align-items:center"><strong>Token rules</strong><span class="hint" id="rule-count"></span></div>' +
      '<input id="tok-filter" class="field" type="search" placeholder="Filter by scope" value="' + esc(S.tokFilter) + '" aria-label="Filter token rules">' +
      '<div id="rules" class="stack"></div>' +
      '<div class="add"><input id="tok-new" class="field" placeholder="New scope, e.g. entity.name.tag" aria-label="New token scope"><button class="btn sm" data-act="tok-add">Add rule</button></div></div></section>' +
      '<section class="group" style="padding:11px"><div class="stack"><label class="check"><input id="semantic" type="checkbox"' + (S.semanticHighlighting ? ' checked' : '') + '> Semantic highlighting</label>' +
      '<div id="sem-list" class="stack"></div>' +
      '<div class="add"><input id="sem-new" class="field" placeholder="Selector, e.g. variable.readonly" aria-label="New semantic selector"><button class="btn sm" data-act="sem-add">Add</button></div></div></section>';
  }

  /* ── inspector: quality ── */
  function tabQuality() {
    const { list, total, passed } = audit(); const pct = Math.round(passed / total * 100);
    const failing = total - passed;
    return '<section class="group" style="padding:12px"><div class="score"><b>' + pct + '%</b><div class="stack" style="gap:6px"><div class="meter"><i style="width:' + pct + '%"></i></div>' +
      '<span class="hint">' + passed + ' of ' + total + ' pairs meet their target</span></div></div>' +
      '<div style="margin-top:10px;display:flex;gap:6px"><button class="btn sm primary" data-act="autofix"' + (failing ? '' : ' disabled') + '>Fix ' + failing + ' failing</button></div></section>' +
      '<section class="group" style="padding:4px 12px">' + list.map(p => {
        const ok = p.ratio >= p.need;
        return '<div class="qrow"><span class="sw" style="background:' + esc(p.fg) + '"></span><span>' + esc(p.label) + '</span><span class="ratio">' + p.ratio.toFixed(2) + ':1</span>' +
          '<span class="tag ' + (ok ? 'pass' : 'fail') + '" title="Needs ' + p.need + ':1">' + (ok ? (p.ratio >= 7 ? 'AAA' : 'AA') : 'Needs ' + p.need) + '</span></div>';
      }).join('') + '</section>' +
      '<p class="hint">Text pairs target 4.5:1 (WCAG AA). Comments and line numbers target 3:1 as secondary text. Alpha is ignored.</p>';
  }

  /* ── inspector: tools ── */
  const PRESETS = [
    ['calm', 'Calm', 'Softer, lower saturation'], ['contrast', 'High contrast', 'Every pair at 7:1'],
    ['oled', 'OLED black', 'True black surfaces'], ['warm', 'Warm night', 'Amber tint, less blue'],
    ['paper', 'Paper light', 'Light, low glare'], ['cb', 'Color-blind safe', 'Okabe–Ito syntax'],
  ];
  const SIMS = [['none', 'Normal'], ['deuteranopia', 'Deuteranopia'], ['protanopia', 'Protanopia'], ['tritanopia', 'Tritanopia'], ['achromatopsia', 'Grayscale']];
  function tabTools() {
    const accent = col('textLink.foreground'), [h, s, l] = toHsl(accent);
    const harmony = [['Base', 0], ['Analogous', 30], ['Analogous', -30], ['Complement', 180], ['Triad', 120], ['Triad', 240]]
      .map(([n, d]) => [n, fromHsl(h + d, s, l)]);
    return '<section class="group" style="padding:11px"><strong>Presets</strong><div class="preset-grid" style="margin-top:8px">' + PRESETS.map(([id, name, sub]) =>
      '<button class="preset" data-act="preset" data-preset="' + id + '"><span>' + name + '</span><small>' + sub + '</small></button>').join('') + '</div></section>' +
      '<section class="group" style="padding:11px"><strong>Accent harmony</strong><p class="hint" style="margin:4px 0 8px">Click a swatch to use it as the accent for links, buttons, badges and focus.</p><div class="harmony">' +
      harmony.map(([n, hex]) => '<button data-act="accent" data-hex="' + hex + '" title="' + n + ' ' + hex + '"><i style="background:' + hex + '"></i>' + hex.slice(1) + '</button>').join('') + '</div></section>' +
      '<section class="group" style="padding:11px"><strong>Preview as</strong><div class="stack" style="margin-top:8px">' +
      '<div class="seg" role="group" aria-label="Vision simulation" style="flex-wrap:wrap">' + SIMS.map(([id, name]) => '<button data-act="sim" data-sim="' + id + '" aria-pressed="' + (S.sim === id) + '">' + name + '</button>').join('') + '</div>' +
      '<div class="range"><label for="glare">Reduced glare</label><input id="glare" type="range" min="0" max="40" value="' + S.glare + '"><span id="glare-v">' + S.glare + '%</span></div>' +
      '<div class="range"><label for="fsize">Preview size</label><input id="fsize" type="range" min="11" max="18" value="' + S.size + '"><span id="fsize-v">' + S.size + 'px</span></div></div></section>' +
      '<section class="group" style="padding:11px"><strong>Export</strong><div class="stack" style="margin-top:8px"><div style="display:flex;gap:6px;flex-wrap:wrap">' +
      '<button class="btn sm" data-act="copy-json">Copy theme JSON</button><button class="btn sm" data-act="reset-all">Reset to original</button><button class="btn sm ghost" data-act="panic">Remove overrides in VS Code</button></div></div></section>';
  }

  function renderInspector() {
    const body = $('#insp-body');
    body.innerHTML = { colors: tabColors, syntax: tabSyntax, quality: tabQuality, tools: tabTools }[S.insp]();
    if (S.insp === 'colors') renderColorList();
    if (S.insp === 'syntax') { renderRules(); renderSemantic(); }
    $$('[data-insp]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.insp === S.insp)));
  }

  function renderAll() { renderLibrary(); renderChrome(); renderPreview(); renderInspector(); }
  function afterEdit(rerenderInspector) {
    pushLive(); renderPreview(); renderChrome(); renderLibrarySwatches();
    if (S.insp === 'quality' || rerenderInspector) renderInspector();
  }
  function renderLibrarySwatches() { /* library chips reflect saved themes only; nothing to refresh live */ }

  /* ── mutations ── */
  function setColor(key, value) {
    const n = norm(value); if (!n) return false;
    const prevAlpha = alphaOf(S.colors[key]);
    const next = n.length === 7 && prevAlpha ? n + prevAlpha : n;
    checkpoint('c:' + key); S.colors[key] = next; return true;
  }
  function setSyntax(role, value) { const n = base6(value); if (!n) return false; checkpoint('s:' + role); S.syntax[role] = n; return true; }
  function syncRow(key) {
    const row = $('[data-row="' + CSS.escape(key) + '"]'); if (!row) return;
    const set = norm(S.colors[key]);
    $('[data-pick]', row).value = base6(set || col(key));
    const hex = $('[data-hex]', row); if (document.activeElement !== hex) hex.value = set || '';
    hex.placeholder = col(key);
    $('[data-act=reset-color]', row).hidden = (S.current.colors || {})[key] === S.colors[key];
  }

  /* presets */
  const mapAll = fn => {
    Object.keys(S.colors).forEach(k => { S.colors[k] = mapHex(S.colors[k], fn); });
    Object.keys(S.syntax).forEach(k => { S.syntax[k] = mapHex(S.syntax[k], fn); });
    S.tokenColors.forEach(r => { if (r.settings && r.settings.foreground) r.settings.foreground = mapHex(r.settings.foreground, fn); });
  };
  function materialize() {
    ALL_KEYS.forEach(([key]) => { if (!norm(S.colors[key]) && !/Background$|border$/i.test(key)) S.colors[key] = col(key); });
    ROLES.forEach(role => { S.syntax[role] = syn(role); });
  }
  function applyPreset(id) {
    checkpoint('preset:' + id + ':' + Date.now()); materialize();
    const dark = S.current.type !== 'light';
    if (id === 'calm') mapAll(hex => { const [h, s, l] = toHsl(hex); return fromHsl(h, s * 0.72, l + (dark ? -0.01 : 0.01)); });
    if (id === 'warm') mapAll(hex => mix(hex, '#ffb36b', 0.12));
    if (id === 'oled') {
      ['editor.background', 'sideBar.background', 'activityBar.background', 'panel.background', 'terminal.background', 'titleBar.activeBackground', 'tab.inactiveBackground', 'editorGroupHeader.tabsBackground', 'statusBar.background', 'sideBarSectionHeader.background']
        .forEach(key => { S.colors[key] = '#000000'; });
    }
    if (id === 'paper') {
      const bg = '#f5f3ee', side = '#ebe8e0';
      Object.assign(S.colors, { 'editor.background': bg, 'editor.foreground': '#2b2f2c', 'sideBar.background': side, 'sideBar.foreground': '#2b2f2c', 'activityBar.background': side, 'activityBar.foreground': '#4a514c',
        'panel.background': bg, 'terminal.background': bg, 'terminal.foreground': '#2b2f2c', 'titleBar.activeBackground': side, 'titleBar.activeForeground': '#2b2f2c', 'tab.activeBackground': bg, 'tab.activeForeground': '#2b2f2c',
        'tab.inactiveBackground': side, 'tab.inactiveForeground': '#5b625d', 'editorGroupHeader.tabsBackground': side, 'statusBar.background': '#dcd8cc', 'statusBar.foreground': '#2b2f2c', 'editorLineNumber.foreground': '#8a8f8a',
        'editorLineNumber.activeForeground': '#2b2f2c', 'editor.selectionBackground': '#cfe3d4', 'editor.lineHighlightBackground': '#00000010', 'textLink.foreground': '#2a6b4a', 'button.foreground': '#ffffff', 'badge.foreground': '#ffffff', 'sideBarSectionHeader.background': '#e2dfd6' });
      Object.assign(S.syntax, { keyword: '#8a3f9a', string: '#3d7a3a', function: '#1f5f99', comment: '#6d746f', number: '#a35a14', type: '#8a6a12', variable: '#b3374a' });
      S.current = { ...S.current, type: 'light' };
    }
    if (id === 'cb') Object.assign(S.syntax, { keyword: '#cc79a7', string: '#009e73', function: '#56b4e9', comment: S.syntax.comment, number: '#e69f00', type: '#f0e442', variable: '#d55e00' });
    if (id === 'contrast') {
      S.syntax.comment = ensureContrast(S.syntax.comment, col('editor.background'), 7);
      S.colors['editorLineNumber.foreground'] = ensureContrast(col('editorLineNumber.foreground'), col('editor.background'), 7);
      pairs().forEach(p => { if (p.ratio < 7) applyRef(p.ref, ensureContrast(p.fg, p.bg, 7)); });
    }
    afterEdit(true); renderPreview();
    toast('Applied “' + (PRESETS.find(p => p[0] === id) || [])[1] + '”');
  }
  function applyRef([store, key], value) { if (store === 'syntax') S.syntax[key] = base6(value); else S.colors[key] = value; }
  function autofix() {
    checkpoint('autofix:' + Date.now()); let n = 0;
    pairs().forEach(p => { if (p.ratio < p.need) { applyRef(p.ref, ensureContrast(p.fg, p.bg, p.need + 0.1)); n++; } });
    afterEdit(true); toast('Adjusted ' + n + ' colors to meet contrast targets');
  }
  function themeJson() {
    return JSON.stringify({
      name: S.current.label, type: S.current.type || 'dark', semanticHighlighting: S.semanticHighlighting,
      colors: S.colors, tokenColors: S.tokenColors, semanticTokenColors: S.semanticTokenColors,
    }, null, 2);
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) {
      const area = document.createElement('textarea'); area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (_) { /* ignore */ }
      area.remove(); return ok;
    }
  }
  function undo() { if (!S.history.length) return; S.future.push(snapshot()); restore(S.history.pop()); S.lastKey = ''; S.dirty = true; pushLive(); renderAll(); }
  function redo() { if (!S.future.length) return; S.history.push(snapshot()); restore(S.future.pop()); S.lastKey = ''; S.dirty = true; pushLive(); renderAll(); }
  function revert() { const keep = S.current; loadTheme(S.themes.find(t => t.label === keep.label) || keep); renderAll(); }

  /* ── events ── */
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-act],[data-lib],[data-insp],[data-view],[data-pane]'); if (!target) return;
    if (target.dataset.pane) { S.pane = target.dataset.pane; renderChrome(); return; }
    if (target.dataset.lib) { S.libTab = target.dataset.lib; renderLibrary(); return; }
    if (target.dataset.insp) { S.insp = target.dataset.insp; renderInspector(); return; }
    if (target.dataset.view) { S.view = target.dataset.view; renderChrome(); renderPreview(); return; }
    const d = target.dataset;
    switch (d.act) {
      case 'pick-theme': { const t = S.themes.find(x => x.label === d.label); if (t) { loadTheme(t); renderAll(); if (window.innerWidth <= 760) toast('Previewing ' + t.label + ' — tap Apply to use it'); } break; }
      case 'fav': { const on = !S.favorites.has(d.label); on ? S.favorites.add(d.label) : S.favorites.delete(d.label);
        vscode.postMessage({ type: 'favorite', label: d.label, favorite: on }); renderLibrary(); break; }
      case 'undo': undo(); break;
      case 'redo': redo(); break;
      case 'apply': vscode.postMessage({ type: 'apply', label: S.current.label }); if (!S.recent.includes(S.current.label)) S.recent.unshift(S.current.label); toast('Applied ' + S.current.label); renderLibrary(); break;
      case 'save': vscode.postMessage({ type: 'save', ...payload() }); S.dirty = false; renderChrome(); toast('Saving custom theme…'); break;
      case 'discard': revert(); vscode.postMessage({ type: 'discard' }); toast('Changes discarded'); break;
      case 'panic': revert(); vscode.postMessage({ type: 'panic' }); toast('Removed Theme Studio overrides'); break;
      case 'reset-all': revert(); pushLive(); toast('Reset to original theme'); break;
      case 'reset-color': { const orig = (S.current.colors || {})[d.key]; checkpoint('c:' + d.key);
        if (orig === undefined) delete S.colors[d.key]; else S.colors[d.key] = orig; syncRow(d.key); afterEdit(); break; }
      case 'tok-style': { const rule = S.tokenColors[+d.i]; rule.settings = rule.settings || {}; checkpoint('t:' + d.i);
        const set = new Set((rule.settings.fontStyle || '').split(' ').filter(Boolean)); set.has(d.style) ? set.delete(d.style) : set.add(d.style);
        rule.settings.fontStyle = [...set].join(' '); renderRules(); afterEdit(); break; }
      case 'tok-del': checkpoint('t:del' + Date.now()); S.tokenColors.splice(+d.i, 1); renderRules(); afterEdit(); break;
      case 'tok-add': { const input = $('#tok-new'), scope = input.value.trim(); if (!scope) { toast('Enter a scope first'); input.focus(); break; }
        checkpoint('t:add' + Date.now()); S.tokenColors.unshift({ name: scope, scope, settings: { foreground: syn('keyword') } }); input.value = ''; S.tokFilter = ''; $('#tok-filter').value = ''; renderRules(); afterEdit(); break; }
      case 'sem-add': { const input = $('#sem-new'), sel = input.value.trim(); if (!sel) { toast('Enter a selector first'); input.focus(); break; }
        checkpoint('sem:add' + Date.now()); S.semanticTokenColors[sel] = syn('variable'); input.value = ''; renderSemantic(); afterEdit(); break; }
      case 'sem-del': checkpoint('sem:del' + Date.now()); delete S.semanticTokenColors[d.sel]; renderSemantic(); afterEdit(); break;
      case 'preset': applyPreset(d.preset); break;
      case 'accent': { checkpoint('accent:' + Date.now()); const hex = d.hex;
        ['textLink.foreground', 'focusBorder', 'button.background', 'badge.background'].forEach(k => { S.colors[k] = hex; });
        S.colors['button.foreground'] = contrast('#ffffff', hex) >= contrast('#000000', hex) ? '#ffffff' : '#000000'; S.colors['badge.foreground'] = S.colors['button.foreground'];
        afterEdit(true); toast('Accent set to ' + hex); break; }
      case 'sim': S.sim = d.sim; renderPreview(); renderInspector(); break;
      case 'autofix': autofix(); break;
      case 'copy-json': copyText(themeJson()).then(ok => toast(ok ? 'Theme JSON copied' : 'Copy failed — select and copy manually')); break;
      default: break;
    }
  });

  document.addEventListener('input', event => {
    const t = event.target;
    if (t.id === 'q') { renderLibrary(); return; }
    if (t.id === 'ck-filter') { S.filter = t.value; renderColorList(); return; }
    if (t.id === 'tok-filter') { S.tokFilter = t.value; renderRules(); return; }
    if (t.id === 'glare') { S.glare = +t.value; $('#glare-v').textContent = S.glare + '%'; renderPreview(); return; }
    if (t.id === 'fsize') { S.size = +t.value; $('#fsize-v').textContent = S.size + 'px'; renderPreview(); return; }
    if (t.dataset.pick) { if (setColor(t.dataset.pick, t.value)) { syncRow(t.dataset.pick); afterEdit(); } return; }
    if (t.dataset.role) { if (setSyntax(t.dataset.role, t.value)) { $('[data-role-hex="' + t.dataset.role + '"]').value = base6(t.value); afterEdit(); } return; }
    if (t.dataset.tok !== undefined) { const rule = S.tokenColors[+t.dataset.tok]; rule.settings = rule.settings || {}; checkpoint('t:' + t.dataset.tok); rule.settings.foreground = t.value; afterEdit(); return; }
    if (t.dataset.sem) { checkpoint('sem:' + t.dataset.sem); const cur = S.semanticTokenColors[t.dataset.sem];
      S.semanticTokenColors[t.dataset.sem] = cur && typeof cur === 'object' ? { ...cur, foreground: t.value } : t.value; afterEdit(); return; }
  });
  document.addEventListener('change', event => {
    const t = event.target;
    if (t.id === 'variant' || t.id === 'source') { renderLibrary(); return; }
    if (t.id === 'sample') { S.sample = t.value; renderPreview(); return; }
    if (t.id === 'semantic') { checkpoint('semantic'); S.semanticHighlighting = t.checked; afterEdit(); return; }
    if (t.dataset.hex !== undefined && t.dataset.hex !== '') {
      const key = t.dataset.hex;
      if (t.value.trim() === '') { checkpoint('c:' + key); delete S.colors[key]; syncRow(key); afterEdit(); return; }
      if (setColor(key, t.value)) { t.value = S.colors[key]; syncRow(key); afterEdit(); } else { toast('Use a hex value like #86b89b'); t.value = S.colors[key] || ''; }
      return;
    }
    if (t.dataset.roleHex) {
      if (t.value.trim() === '') { checkpoint('s:' + t.dataset.roleHex); delete S.syntax[t.dataset.roleHex]; afterEdit(true); return; }
      if (setSyntax(t.dataset.roleHex, t.value)) afterEdit(true); else { toast('Use a 6-digit hex like #86b89b'); t.value = S.syntax[t.dataset.roleHex] || ''; }
    }
  });
  document.addEventListener('toggle', event => {
    const g = event.target.closest && event.target.closest('[data-group]'); if (!g || S.filter) return;
    g.open ? S.closed.delete(g.dataset.group) : S.closed.add(g.dataset.group);
  }, true);
  document.addEventListener('keydown', event => {
    const mod = event.metaKey || event.ctrlKey; if (!mod) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && !/^(INPUT|TEXTAREA)$/.test(event.target.tagName)) { event.preventDefault(); event.shiftKey ? redo() : undo(); }
    else if (key === 'y' && !/^(INPUT|TEXTAREA)$/.test(event.target.tagName)) { event.preventDefault(); redo(); }
    else if (key === 's') { event.preventDefault(); $('[data-act=save]').click(); }
  });
  window.addEventListener('message', event => {
    const m = event.data; if (!m || m.type !== 'studioState') return;
    S.colors = { ...m.colors }; if (m.syntax) S.syntax = { ...m.syntax };
    S.tokenColors = [...(m.tokenColors || S.tokenColors)]; S.semanticTokenColors = { ...(m.semanticTokenColors || S.semanticTokenColors) };
    if (m.semanticHighlighting !== undefined) S.semanticHighlighting = m.semanticHighlighting !== false;
    renderAll();
  });

  if (!S.themes.length) { $('#list').innerHTML = '<div class="empty">No themes were found.</div>'; return; }
  if (window.innerWidth <= 760) { S.view = 'code'; S.size = 11; }
  loadTheme(S.themes[0]); renderAll();
}

/* ─────────────────────────────── page shell ─────────────────────────────── */

function buildThemeStudioHtml(themes, favorites = [], recent = [], options = {}) {
  const list = (Array.isArray(themes) ? themes : []).map(theme => ({
    label: String(theme.label ?? 'Untitled'),
    type: theme.type === 'light' ? 'light' : 'dark',
    colors: theme.colors || {},
    syntax: theme.syntax || {},
    tokenColors: theme.tokenColors || [],
    semanticTokenColors: theme.semanticTokenColors || {},
    semanticHighlighting: theme.semanticHighlighting !== false,
    custom: Boolean(theme.custom),
    mood: theme.mood || 'Forest Ash palette',
  }));
  const serialize = value => JSON.stringify(value)
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const nonce = options.nonce || crypto.randomBytes(16).toString('hex');
  const data = { themes: list, favorites: [...favorites], recent: [...recent] };

  const matrices = {
    protanopia: '0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0',
    deuteranopia: '0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0',
    tritanopia: '0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0',
    achromatopsia: '0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0',
  };
  const filters = Object.entries(matrices).map(([id, values]) =>
    `<filter id="sim-${id}" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="${values}"/></filter>`).join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<title>Forest Ash Theme Studio</title>
<style>${STUDIO_CSS}</style></head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${filters}</defs></svg>
<div class="app" data-show="themes">
  <header class="bar">
    <div class="brand"><span class="mark" aria-hidden="true"></span><div><b>Theme Studio</b><small>Forest Ash</small></div></div>
    <div class="now"><span class="dirty" id="dirty" hidden title="Unsaved changes"></span><strong id="now-name"></strong><span class="pill" id="now-type"></span></div>
    <div class="actions">
      <button class="btn ghost sm ic-only" data-act="undo" title="Undo (Ctrl/Cmd+Z)" aria-label="Undo"><span class="ic" aria-hidden="true">↶</span><span class="tx">Undo</span></button>
      <button class="btn ghost sm ic-only" data-act="redo" title="Redo (Ctrl/Cmd+Shift+Z)" aria-label="Redo"><span class="ic" aria-hidden="true">↷</span><span class="tx">Redo</span></button>
      <button class="btn sm ic-only" data-act="discard" title="Discard changes" aria-label="Discard changes"><span class="ic" aria-hidden="true">⟲</span><span class="tx">Discard changes</span></button>
      <button class="btn sm" data-act="apply" title="Apply this theme in VS Code"><span class="long">Apply theme</span><span class="short">Apply</span></button>
      <button class="btn sm primary" data-act="save" title="Save (Ctrl/Cmd+S)"><span class="long">Save custom theme</span><span class="short">Save</span></button>
    </div>
  </header>

  <nav class="pane-nav" role="tablist" aria-label="Studio sections">
    <button role="tab" data-pane="themes" aria-selected="true">Themes</button>
    <button role="tab" data-pane="preview" aria-selected="false">Preview</button>
    <button role="tab" data-pane="edit" aria-selected="false">Edit</button>
  </nav>

  <div class="main">
    <aside class="col lib" aria-label="Theme library">
      <div class="col-head"><h2>Theme library</h2><span class="pill" id="count"></span></div>
      <div class="lib-tools">
        <input id="q" class="field" type="search" placeholder="Search themes" aria-label="Search themes">
        <div class="lib-row">
          <select id="variant" class="field" aria-label="Variant"><option value="all">All variants</option><option value="dark">Dark</option><option value="light">Light</option></select>
          <select id="source" class="field" aria-label="Source"><option value="all">All sources</option><option value="custom">Custom</option><option value="builtin">Built-in</option></select>
        </div>
      </div>
      <div class="tabs" role="tablist" aria-label="Library view">
        <button class="tab" role="tab" data-lib="all" aria-selected="true">All</button>
        <button class="tab" role="tab" data-lib="fav" aria-selected="false">Favorites</button>
        <button class="tab" role="tab" data-lib="recent" aria-selected="false">Recent</button>
      </div>
      <div class="scroll"><div id="list" class="lib-list"></div></div>
    </aside>

    <main class="col scroll stage" aria-label="Preview">
      <div class="stage-head">
        <div><h1 id="title">Theme preview</h1><p id="mood"></p></div>
        <div class="stage-tools">
          <div class="seg" role="group" aria-label="Preview layout"><button data-view="workbench" aria-pressed="true">Workbench</button><button data-view="code" aria-pressed="false">Code only</button></div>
          <select id="sample" class="field" style="width:auto" aria-label="Preview language">
            <option value="javascript">JavaScript</option><option value="typescript">TypeScript</option><option value="python">Python</option>
            <option value="json">JSON</option><option value="markdown">Markdown</option><option value="terminal">Terminal</option>
          </select>
        </div>
      </div>
      <div class="stage-body">
        <div class="frame"><div id="preview" aria-label="Live theme preview"></div></div>
        <div class="stage-note"><span>The preview mirrors your workbench colors and syntax roles as you edit.</span></div>
      </div>
    </main>

    <aside class="col insp" aria-label="Inspector">
      <div class="tabs" role="tablist" aria-label="Inspector sections">
        <button class="tab" role="tab" data-insp="colors" aria-selected="true">Colors</button>
        <button class="tab" role="tab" data-insp="syntax" aria-selected="false">Syntax</button>
        <button class="tab" role="tab" data-insp="quality" aria-selected="false">Quality</button>
        <button class="tab" role="tab" data-insp="tools" aria-selected="false">Tools</button>
      </div>
      <div class="scroll"><div id="insp-body" class="insp-body"></div></div>
    </aside>
  </div>

  <footer class="foot">
    <span class="live idle" id="live"><i></i><span id="live-text">No unsaved changes</span></span>
    <span id="quality-foot"></span>
    <span class="sp kbds"><kbd>Ctrl/Cmd</kbd> <kbd>Z</kbd> undo · <kbd>S</kbd> save</span>
    <button class="btn sm ghost reset" data-act="panic" title="Remove every override Theme Studio wrote to your settings">Reset overrides</button>
  </footer>
</div>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
<script nonce="${nonce}">(${clientMain.toString()})(${serialize(data)});</script>
</body></html>`;
}

module.exports = { buildThemeStudioHtml, contrastRatio };