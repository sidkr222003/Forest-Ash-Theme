'use strict';

/**
 * themeExporter.js  –  Forest Ash Multi-Tool Export Engine  v1.0
 * ──────────────────────────────────────────────────────────────
 *
 * Pure functions. No VS Code dependencies. No side effects.
 * Each exporter receives a normalised `palette` object and returns a string.
 *
 * Palette schema (all fields optional, sensible fallbacks used):
 * {
 *   name:      string   – theme display name
 *   isDark:    boolean
 *   bg:        string   – editor background (#rrggbb)
 *   fg:        string   – editor foreground (#rrggbb)
 *   accent:    string   – primary accent / cursor (#rrggbb)
 *   comment:   string
 *   keyword:   string
 *   string:    string
 *   func:      string
 *   type:      string
 *   number:    string
 *   variable:  string
 *   // UI chrome
 *   uiBg:      string   – sidebar / panel background
 *   uiFg:      string   – sidebar foreground
 *   selection: string   – editor selection background
 *   lineNum:   string   – line number foreground
 *   border:    string   – panel/widget border
 *   statusBg:  string   – status bar background
 *   statusFg:  string   – status bar foreground
 *   // Terminal ANSI
 *   ansi: {
 *     black, red, green, yellow, blue, magenta, cyan, white,
 *     brightBlack, brightRed, brightGreen, brightYellow,
 *     brightBlue, brightMagenta, brightCyan, brightWhite
 *   }
 * }
 */

// ─── Palette normaliser ───────────────────────────────────────────────────────

/**
 * Build a normalised palette from a raw VS Code theme JSON + metadata.
 * Call this before passing to any exporter.
 */
function buildPalette(themeJson, meta) {
  const c = themeJson?.colors || {};
  const tok = themeJson?.tokenColors || [];

  const isDark = (meta?.isDark !== undefined)
    ? meta.isDark
    : (themeJson?.type !== 'light');

  const bg      = c['editor.background']   || (isDark ? '#1c1e22' : '#f5f5f0');
  const fg      = c['editor.foreground']   || (isDark ? '#d4d4d4' : '#333333');
  const accent  = c['textLink.foreground'] || c['editorCursor.foreground'] || fg;
  const uiBg    = c['sideBar.background']  || c['activityBar.background'] || bg;
  const uiFg    = c['sideBar.foreground']  || fg;
  const selection = c['editor.selectionBackground'] || (isDark ? '#264f78' : '#add6ff');
  const lineNum   = c['editorLineNumber.foreground'] || fg + '66';
  const border    = c['panel.border'] || c['editorGroup.border'] || (isDark ? '#3c3c3c' : '#d4d4d4');
  const statusBg  = c['statusBar.background'] || accent;
  const statusFg  = c['statusBar.foreground'] || '#ffffff';

  // Syntax from tokenColors
  const pick = (keys) => {
    for (const rule of tok) {
      const scopes = (Array.isArray(rule.scope) ? rule.scope : [rule.scope])
        .filter(Boolean).map(s => String(s).toLowerCase());
      if (keys.some(k => scopes.some(s => s.includes(k))) && rule.settings?.foreground) {
        return rule.settings.foreground;
      }
    }
    return null;
  };

  const comment  = pick(['comment'])                                                || fg + '88';
  const keyword  = pick(['keyword', 'storage'])                                     || accent;
  const str      = pick(['string'])                                                  || accent;
  const func     = pick(['entity.name.function', 'support.function'])               || accent;
  const type     = pick(['entity.name.type', 'support.type', 'entity.name.class'])  || accent;
  const number   = pick(['constant.numeric'])                                        || accent;
  const variable = pick(['variable'])                                                || fg;

  // ANSI terminal colors
  const ansiKeys = [
    'terminal.ansiBlack','terminal.ansiRed','terminal.ansiGreen','terminal.ansiYellow',
    'terminal.ansiBlue','terminal.ansiMagenta','terminal.ansiCyan','terminal.ansiWhite',
    'terminal.ansiBrightBlack','terminal.ansiBrightRed','terminal.ansiBrightGreen',
    'terminal.ansiBrightYellow','terminal.ansiBrightBlue','terminal.ansiBrightMagenta',
    'terminal.ansiBrightCyan','terminal.ansiBrightWhite',
  ];
  const ansiDefaults = isDark
    ? ['#282c34','#e06c75','#98c379','#e5c07b','#61afef','#c678dd','#56b6c2','#abb2bf',
       '#3e4451','#e06c75','#98c379','#e5c07b','#61afef','#c678dd','#56b6c2','#ffffff']
    : ['#383a42','#e45649','#50a14f','#c18401','#4078f2','#a626a4','#0184bc','#fafafa',
       '#696c77','#e45649','#50a14f','#c18401','#4078f2','#a626a4','#0184bc','#ffffff'];
  const ansiNames = [
    'black','red','green','yellow','blue','magenta','cyan','white',
    'brightBlack','brightRed','brightGreen','brightYellow',
    'brightBlue','brightMagenta','brightCyan','brightWhite',
  ];
  const ansi = {};
  ansiNames.forEach((name, i) => {
    ansi[name] = c[ansiKeys[i]] || ansiDefaults[i];
  });

  return {
    name:      meta?.label || themeJson?.name || 'Forest Ash',
    isDark,
    bg, fg, accent, uiBg, uiFg,
    selection, lineNum, border, statusBg, statusFg,
    comment, keyword, string: str, func, type, number, variable,
    ansi,
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Strip leading # from hex color. */
const hex = (c) => String(c || '#000000').replace(/^#/, '').slice(0, 6).toLowerCase();

/** Convert #rrggbb → [r, g, b] (0-255 integers). */
function hexToRgb(h) {
  const s = hex(h);
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

/** Convert #rrggbb → 0.0-1.0 float triple for formats that need it. */
function hexToFloat(h) {
  const [r, g, b] = hexToRgb(h);
  return [r / 255, g / 255, b / 255];
}

/** Format #rrggbb as a `<key>R</key><real>…</real>` plist colour block (iTerm2). */
function plistColor(key, hexColor) {
  const [r, g, b] = hexToFloat(hexColor);
  return `\t<key>${escXml(key)}</key>\n\t<dict>\n\t\t<key>Alpha Component</key><real>1</real>\n\t\t<key>Blue Component</key><real>${b.toFixed(6)}</real>\n\t\t<key>Color Space</key><string>sRGB</string>\n\t\t<key>Green Component</key><real>${g.toFixed(6)}</real>\n\t\t<key>Red Component</key><real>${r.toFixed(6)}</real>\n\t</dict>`;
}

function escXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escLua(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const now = () => new Date().toISOString().slice(0, 10);

// ─── Exporters ────────────────────────────────────────────────────────────────

/**
 * JetBrains IDE Color Scheme (.icls)
 * Works with: IntelliJ IDEA, Rider, CLion, PyCharm, WebStorm, GoLand, etc.
 * Import: Settings → Editor → Color Scheme → ⚙ → Import Scheme
 */
function exportJetBrains(palette) {
  const p = palette;
  const bgName  = p.isDark ? 'DARK' : 'LIGHT';

  /* Map Forest Ash tokens → JetBrains attribute names */
  const attrs = [
    // General
    { name: 'TEXT',                fg: p.fg,      bg: p.bg   },
    { name: 'FOLDED_TEXT',         fg: p.comment, bg: null   },
    { name: 'CARET_COLOR',         fg: p.accent,  bg: null   },
    { name: 'SELECTION',           fg: null,      bg: p.selection },
    { name: 'LINE_NUMBERS_COLOR',  fg: p.lineNum, bg: null   },
    { name: 'GUTTER_BACKGROUND',   fg: null,      bg: p.uiBg },
    { name: 'TEARLINE_COLOR',      fg: p.border,  bg: null   },
    { name: 'RIGHT_MARGIN_COLOR',  fg: p.border,  bg: null   },
    { name: 'WHITESPACES',         fg: p.lineNum, bg: null   },
    // Syntax
    { name: 'DEFAULT_KEYWORD',        fg: p.keyword,  bold: true  },
    { name: 'DEFAULT_STRING',         fg: p.string               },
    { name: 'DEFAULT_NUMBER',         fg: p.number               },
    { name: 'DEFAULT_FUNCTION_CALL',  fg: p.func                 },
    { name: 'DEFAULT_INSTANCE_METHOD',fg: p.func                 },
    { name: 'DEFAULT_STATIC_FIELD',   fg: p.variable             },
    { name: 'DEFAULT_FIELD',          fg: p.variable             },
    { name: 'DEFAULT_LOCAL_VARIABLE', fg: p.variable             },
    { name: 'DEFAULT_PARAMETER',      fg: p.variable             },
    { name: 'DEFAULT_CLASS_NAME',     fg: p.type                 },
    { name: 'DEFAULT_INTERFACE_NAME', fg: p.type                 },
    { name: 'DEFAULT_ANNOTATION_NAME',fg: p.type                 },
    { name: 'DEFAULT_COMMENT',        fg: p.comment, italic: true },
    { name: 'DEFAULT_LINE_COMMENT',   fg: p.comment, italic: true },
    { name: 'DEFAULT_BLOCK_COMMENT',  fg: p.comment, italic: true },
    { name: 'DEFAULT_DOC_COMMENT',    fg: p.comment, italic: true },
    { name: 'DEFAULT_DOC_MARKUP',     fg: p.accent               },
    { name: 'DEFAULT_TEMPLATE_LANGUAGE_COLOR', fg: p.accent       },
    { name: 'DEFAULT_METADATA',       fg: p.type                 },
    { name: 'DEFAULT_PREDEFINED_SYMBOL', fg: p.keyword           },
  ];

  const attrXml = attrs.map(a => {
    const parts = [];
    if (a.fg) parts.push(`<option name="FOREGROUND" value="${hex(a.fg)}" />`);
    if (a.bg) parts.push(`<option name="BACKGROUND" value="${hex(a.bg)}" />`);
    if (a.bold) parts.push(`<option name="FONT_TYPE" value="1" />`);
    if (a.italic) parts.push(`<option name="FONT_TYPE" value="2" />`);
    return `    <attributes>\n      <option name="${escXml(a.name)}">\n        <value>\n          ${parts.join('\n          ')}\n        </value>\n      </option>\n    </attributes>`;
  }).join('\n');

  // Console/terminal ANSI colors
  const ansiXml = Object.entries(p.ansi).map(([k, v]) =>
    `      <option name="CONSOLE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}" value="${hex(v)}" />`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Forest Ash Theme — JetBrains Color Scheme
  Generated: ${now()}
  Import: Settings → Editor → Color Scheme → ⚙ → Import Scheme (.icls)
  Supports: IntelliJ IDEA, Rider, CLion, PyCharm, WebStorm, GoLand, DataGrip, Android Studio
-->
<scheme name="${escXml(p.name)}" version="142" parent_scheme="${bgName}">
  <metaInfo>
    <property name="created">${now()}</property>
    <property name="ide">IntelliJ IDEA</property>
    <property name="ideVersion">2024.1</property>
    <property name="originalScheme">${escXml(p.name)}</property>
  </metaInfo>
  <colors>
    <option name="BACKGROUND" value="${hex(p.bg)}" />
    <option name="FOREGROUND" value="${hex(p.fg)}" />
    <option name="CARET_COLOR" value="${hex(p.accent)}" />
    <option name="CARET_ROW_COLOR" value="${hex(p.bg)}20" />
    <option name="SELECTION_BACKGROUND" value="${hex(p.selection)}" />
    <option name="SELECTION_FOREGROUND" value="${hex(p.fg)}" />
    <option name="LINE_NUMBERS_COLOR" value="${hex(p.lineNum)}" />
    <option name="LINE_NUMBER_ON_CARET_ROW_COLOR" value="${hex(p.fg)}" />
    <option name="GUTTER_BACKGROUND" value="${hex(p.uiBg)}" />
    <option name="INDENT_GUIDE" value="${hex(p.border)}" />
    <option name="SELECTED_INDENT_GUIDE" value="${hex(p.accent)}80" />
    <option name="WHITESPACES" value="${hex(p.lineNum)}80" />
    <option name="ADDED_LINES_COLOR" value="${hex(p.number)}60" />
    <option name="MODIFIED_LINES_COLOR" value="${hex(p.accent)}60" />
    <option name="DELETED_LINES_COLOR" value="${hex(p.string)}60" />
    <!-- Terminal ANSI -->
${ansiXml}
  </colors>
  <attributes>
${attrXml}
  </attributes>
</scheme>
`;
}

/**
 * Neovim / Vim Lua colorscheme.
 * Usage: place in ~/.config/nvim/colors/forest-ash.lua, then :colorscheme forest-ash
 */
function exportNeovimLua(palette) {
  const p = palette;
  const safe = (c) => `"${c}"`;
  const hl = (group, opts) => {
    const parts = Object.entries(opts)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k} = ${typeof v === 'string' ? safe(v) : v}`);
    return `  vim.api.nvim_set_hl(0, "${escLua(group)}", { ${parts.join(', ')} })`;
  };

  const bg = p.isDark ? 'dark' : 'light';

  const highlights = [
    // Normal
    hl('Normal',       { fg: p.fg,       bg: p.bg     }),
    hl('NormalFloat',  { fg: p.fg,       bg: p.uiBg   }),
    hl('NormalNC',     { fg: p.fg + 'cc', bg: p.bg    }),
    // Cursor & Selection
    hl('CursorLine',   { bg: p.bg + '30'              }),
    hl('CursorLineNr', { fg: p.fg,       bold: true   }),
    hl('LineNr',       { fg: p.lineNum                }),
    hl('Visual',       { bg: p.selection              }),
    hl('VisualNOS',    { bg: p.selection              }),
    hl('Search',       { fg: p.bg,       bg: p.accent }),
    hl('IncSearch',    { fg: p.bg,       bg: p.keyword}),
    hl('MatchParen',   { fg: p.accent,   bold: true   }),
    // UI Chrome
    hl('StatusLine',   { fg: p.statusFg, bg: p.statusBg }),
    hl('StatusLineNC', { fg: p.fg + '88', bg: p.uiBg  }),
    hl('TabLine',      { fg: p.fg + '88', bg: p.uiBg  }),
    hl('TabLineSel',   { fg: p.fg,       bg: p.bg     }),
    hl('TabLineFill',  { bg: p.uiBg                   }),
    hl('WinSeparator', { fg: p.border                 }),
    hl('VertSplit',    { fg: p.border                 }),
    hl('Pmenu',        { fg: p.fg,       bg: p.uiBg   }),
    hl('PmenuSel',     { fg: p.bg,       bg: p.accent }),
    hl('PmenuSbar',    { bg: p.uiBg                   }),
    hl('PmenuThumb',   { bg: p.accent                 }),
    // Gutter
    hl('SignColumn',   { bg: p.uiBg                   }),
    hl('FoldColumn',   { fg: p.comment,  bg: p.uiBg   }),
    hl('Folded',       { fg: p.comment,  bg: p.uiBg   }),
    // Messages
    hl('ErrorMsg',     { fg: p.string                 }),
    hl('WarningMsg',   { fg: p.number                 }),
    hl('Question',     { fg: p.func                   }),
    hl('MoreMsg',      { fg: p.func                   }),
    // Diff
    hl('DiffAdd',      { bg: p.number  + '30'         }),
    hl('DiffChange',   { bg: p.accent  + '30'         }),
    hl('DiffDelete',   { bg: p.string  + '30'         }),
    hl('DiffText',     { bg: p.accent  + '60'         }),
    // Syntax
    hl('Comment',      { fg: p.comment, italic: true  }),
    hl('Keyword',      { fg: p.keyword, bold: true    }),
    hl('Statement',    { fg: p.keyword                }),
    hl('Conditional',  { fg: p.keyword                }),
    hl('Repeat',       { fg: p.keyword                }),
    hl('Operator',     { fg: p.fg                     }),
    hl('String',       { fg: p.string                 }),
    hl('Number',       { fg: p.number                 }),
    hl('Float',        { fg: p.number                 }),
    hl('Boolean',      { fg: p.number                 }),
    hl('Identifier',   { fg: p.variable               }),
    hl('Function',     { fg: p.func                   }),
    hl('Type',         { fg: p.type                   }),
    hl('TypeDef',      { fg: p.type                   }),
    hl('StorageClass', { fg: p.keyword                }),
    hl('Structure',    { fg: p.type                   }),
    hl('Constant',     { fg: p.number                 }),
    hl('PreProc',      { fg: p.keyword                }),
    hl('Include',      { fg: p.keyword                }),
    hl('Define',       { fg: p.keyword                }),
    hl('Macro',        { fg: p.accent                 }),
    hl('Special',      { fg: p.accent                 }),
    hl('Delimiter',    { fg: p.fg                     }),
    hl('Tag',          { fg: p.keyword                }),
    hl('Error',        { fg: p.string,  bold: true    }),
    hl('Todo',         { fg: p.bg,      bg: p.accent, bold: true }),
    // LSP Diagnostics
    hl('DiagnosticError',       { fg: p.string  }),
    hl('DiagnosticWarn',        { fg: p.number  }),
    hl('DiagnosticInfo',        { fg: p.func    }),
    hl('DiagnosticHint',        { fg: p.comment }),
    hl('DiagnosticUnderlineError', { sp: p.string,  underline: true }),
    hl('DiagnosticUnderlineWarn',  { sp: p.number,  underline: true }),
    // Treesitter
    hl('@comment',              { fg: p.comment, italic: true }),
    hl('@keyword',              { fg: p.keyword, bold: true   }),
    hl('@string',               { fg: p.string               }),
    hl('@number',               { fg: p.number               }),
    hl('@float',                { fg: p.number               }),
    hl('@function',             { fg: p.func                 }),
    hl('@function.call',        { fg: p.func                 }),
    hl('@method',               { fg: p.func                 }),
    hl('@method.call',          { fg: p.func                 }),
    hl('@type',                 { fg: p.type                 }),
    hl('@type.builtin',         { fg: p.type                 }),
    hl('@variable',             { fg: p.variable             }),
    hl('@parameter',            { fg: p.variable, italic: true }),
    hl('@property',             { fg: p.variable             }),
    hl('@constant',             { fg: p.number               }),
    hl('@constructor',          { fg: p.type                 }),
    hl('@punctuation.bracket',  { fg: p.fg                   }),
    hl('@punctuation.delimiter',{ fg: p.fg                   }),
    hl('@tag',                  { fg: p.keyword              }),
    hl('@tag.attribute',        { fg: p.variable             }),
    hl('@tag.delimiter',        { fg: p.fg                   }),
  ];

  // Terminal colors
  const ansiNames = ['black','red','green','yellow','blue','magenta','cyan','white'];
  const termLines = ansiNames.map((name, i) => {
    const bright = 'bright' + name.charAt(0).toUpperCase() + name.slice(1);
    return `  vim.g.terminal_color_${i}     = "${p.ansi[name] || '#000000'}"\n  vim.g.terminal_color_${i + 8} = "${p.ansi[bright] || '#888888'}"`;
  }).join('\n');

  return `-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: ${now()}
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "${p.bg}",
  fg        = "${p.fg}",
  accent    = "${p.accent}",
  ui_bg     = "${p.uiBg}",
  selection = "${p.selection}",
  comment   = "${p.comment}",
  keyword   = "${p.keyword}",
  string    = "${p.string}",
  func      = "${p.func}",
  type      = "${p.type}",
  number    = "${p.number}",
  variable  = "${p.variable}",
}

function M.setup()
  vim.o.background = "${bg}"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "${escLua(p.name)}"

  -- ── Highlights ─────────────────────────────────────────────────────────────
${highlights.join('\n')}

  -- ── Terminal colors ────────────────────────────────────────────────────────
${termLines}
end

M.setup()
return M
`;
}

/**
 * Sublime Text / TextMate Theme (.tmTheme XML).
 * Import: Preferences → Browse Packages → drop into Packages/User/
 */
function exportSublimeText(palette) {
  const p = palette;

  const setting = (name, fg, bg, fontStyle) => {
    const fgXml  = fg ? `\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>${fg}</string>` : '';
    const bgXml  = bg ? `\t\t\t\t<key>background</key>\n\t\t\t\t<string>${bg}</string>` : '';
    const fsXml  = fontStyle !== undefined ? `\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>${fontStyle}</string>` : '';
    const nameXml = name ? `\t\t\t<key>name</key>\n\t\t\t<string>${escXml(name)}</string>\n` : '';
    return `\t\t<dict>\n${nameXml}\t\t\t<key>settings</key>\n\t\t\t<dict>\n${fgXml}\n${bgXml}\n${fsXml}\n\t\t\t</dict>\n\t\t</dict>`;
  };

  const scopeSetting = (name, scope, fg, fontStyle) => `\t\t<dict>
\t\t\t<key>name</key>
\t\t\t<string>${escXml(name)}</string>
\t\t\t<key>scope</key>
\t\t\t<string>${escXml(scope)}</string>
\t\t\t<key>settings</key>
\t\t\t<dict>
\t\t\t\t<key>foreground</key>
\t\t\t\t<string>${fg}</string>
${fontStyle !== undefined ? `\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>${fontStyle}</string>\n` : ''}\t\t\t</dict>
\t\t</dict>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<!-- Forest Ash Theme — Sublime Text / TextMate (.tmTheme) -->
<!-- Generated: ${now()} -->
<!-- Import: Preferences → Browse Packages → drop into Packages/User/ -->
<plist version="1.0">
<dict>
\t<key>name</key>
\t<string>${escXml(p.name)}</string>
\t<key>settings</key>
\t<array>
\t\t<!-- Global -->
\t\t<dict>
\t\t\t<key>settings</key>
\t\t\t<dict>
\t\t\t\t<key>background</key><string>${p.bg}</string>
\t\t\t\t<key>foreground</key><string>${p.fg}</string>
\t\t\t\t<key>caret</key><string>${p.accent}</string>
\t\t\t\t<key>selection</key><string>${p.selection}60</string>
\t\t\t\t<key>selectionForeground</key><string>${p.fg}</string>
\t\t\t\t<key>lineHighlight</key><string>${p.uiBg}60</string>
\t\t\t\t<key>findHighlight</key><string>${p.accent}60</string>
\t\t\t\t<key>findHighlightForeground</key><string>${p.fg}</string>
\t\t\t\t<key>minimapBorder</key><string>${p.border}</string>
\t\t\t\t<key>guide</key><string>${p.border}40</string>
\t\t\t\t<key>activeGuide</key><string>${p.accent}80</string>
\t\t\t\t<key>stackGuide</key><string>${p.border}60</string>
\t\t\t\t<key>invisibles</key><string>${p.lineNum}</string>
\t\t\t</dict>
\t\t</dict>
${scopeSetting('Comment', 'comment, comment.block, comment.line', p.comment, 'italic')}
${scopeSetting('String', 'string, string.quoted, string.template', p.string, '')}
${scopeSetting('Number', 'constant.numeric, constant.numeric.integer, constant.numeric.float', p.number, '')}
${scopeSetting('Boolean / Constant', 'constant.language, constant.other', p.number, '')}
${scopeSetting('Keyword', 'keyword, keyword.control, storage.type, storage.modifier', p.keyword, 'bold')}
${scopeSetting('Operator', 'keyword.operator', p.fg, '')}
${scopeSetting('Function Name', 'entity.name.function, entity.name.method', p.func, '')}
${scopeSetting('Function Call', 'meta.function-call, variable.function, support.function', p.func, '')}
${scopeSetting('Type / Class', 'entity.name.type, entity.name.class, support.class, entity.name.struct', p.type, '')}
${scopeSetting('Interface', 'entity.name.interface, entity.name.trait', p.type, 'italic')}
${scopeSetting('Parameter', 'variable.parameter', p.variable, 'italic')}
${scopeSetting('Variable', 'variable, variable.other, variable.other.readwrite', p.variable, '')}
${scopeSetting('Property', 'variable.other.member, variable.other.property, support.variable', p.variable, '')}
${scopeSetting('Tag Name', 'entity.name.tag', p.keyword, '')}
${scopeSetting('Tag Attribute', 'entity.other.attribute-name', p.variable, '')}
${scopeSetting('Markup Heading', 'markup.heading', p.keyword, 'bold')}
${scopeSetting('Markup Bold', 'markup.bold', p.fg, 'bold')}
${scopeSetting('Markup Italic', 'markup.italic', p.fg, 'italic')}
${scopeSetting('Markup Link', 'markup.underline.link, string.other.link', p.func, 'underline')}
${scopeSetting('Markup Code', 'markup.raw.inline, markup.raw.block', p.string, '')}
${scopeSetting('Diff Inserted', 'markup.inserted', p.number, '')}
${scopeSetting('Diff Deleted', 'markup.deleted', p.string, '')}
${scopeSetting('Diff Changed', 'markup.changed', p.accent, '')}
${scopeSetting('Import / Include', 'keyword.control.import, keyword.control.from, support.type.property-name.css', p.keyword, '')}
${scopeSetting('Decorator / Annotation', 'meta.decorator, meta.annotation, entity.name.decorator', p.type, '')}
${scopeSetting('CSS Property', 'support.type.property-name', p.variable, '')}
${scopeSetting('CSS Value', 'support.constant.property-value, constant.other.color', p.string, '')}
${scopeSetting('Punctuation', 'punctuation, punctuation.separator, punctuation.terminator, punctuation.accessor', p.fg + 'cc', '')}
\t</array>
\t<key>uuid</key>
\t<string>forest-ash-${hex(p.accent)}-${p.isDark ? 'dark' : 'light'}</string>
</dict>
</plist>
`;
}

/**
 * Windows Terminal color scheme fragment.
 * Drop into %LOCALAPPDATA%\\Packages\\Microsoft.WindowsTerminal_..\\LocalState\\settings.json
 * under "schemes", then set "colorScheme" in your profile.
 */
function exportWindowsTerminal(palette) {
  const p = palette;
  const ansi = p.ansi;
  const scheme = {
    name:             p.name,
    background:       p.bg,
    foreground:       p.fg,
    cursorColor:      p.accent,
    selectionBackground: p.selection,
    black:            ansi.black,
    red:              ansi.red,
    green:            ansi.green,
    yellow:           ansi.yellow,
    blue:             ansi.blue,
    purple:           ansi.magenta,
    cyan:             ansi.cyan,
    white:            ansi.white,
    brightBlack:      ansi.brightBlack,
    brightRed:        ansi.brightRed,
    brightGreen:      ansi.brightGreen,
    brightYellow:     ansi.brightYellow,
    brightBlue:       ansi.brightBlue,
    brightPurple:     ansi.brightMagenta,
    brightCyan:       ansi.brightCyan,
    brightWhite:      ansi.brightWhite,
  };

  return `// Forest Ash Theme — Windows Terminal Color Scheme
// Generated: ${now()}
// Usage:
//   1. Open Windows Terminal Settings (Ctrl+,)
//   2. Click "Open JSON file" at bottom left
//   3. Add the object below to the "schemes" array
//   4. In your profile, set: "colorScheme": "${p.name}"
//
// Fragment install: save as  fragment.json  in
// %LOCALAPPDATA%\\Microsoft\\Windows Terminal\\Fragments\\ForestAsh\\

{
  "schemes": [
${JSON.stringify(scheme, null, 4).replace(/^/gm, '    ')}
  ]
}
`;
}

/**
 * iTerm2 color preset (.itermcolors plist).
 * Import: iTerm2 → Preferences → Profiles → Colors → Color Presets → Import
 */
function exportITerm2(palette) {
  const p = palette;
  const ansi = p.ansi;

  const ansiNames = ['black','red','green','yellow','blue','magenta','cyan','white'];
  const ansiEntries = ansiNames.flatMap((name, i) => [
    plistColor(`Ansi ${i} Color`, ansi[name] || '#000000'),
    plistColor(`Ansi ${i + 8} Color`, ansi['bright' + name.charAt(0).toUpperCase() + name.slice(1)] || '#888888'),
  ]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<!-- Forest Ash Theme — iTerm2 Color Preset (.itermcolors) -->
<!-- Generated: ${now()} -->
<!-- Import: iTerm2 → Preferences → Profiles → Colors → Color Presets → Import -->
<plist version="1.0">
<dict>
${plistColor('Background Color', p.bg)}
${plistColor('Foreground Color', p.fg)}
${plistColor('Cursor Color', p.accent)}
${plistColor('Cursor Text Color', p.bg)}
${plistColor('Selection Color', p.selection)}
${plistColor('Selected Text Color', p.fg)}
${plistColor('Bold Color', p.fg)}
${plistColor('Link Color', p.func)}
${ansiEntries.join('\n')}
\t<key>Color Space</key><string>sRGB</string>
</dict>
</plist>
`;
}

/**
 * Alacritty terminal colors (.toml snippet).
 * Paste into your alacritty.toml (Alacritty ≥ 0.13) or alacritty.yml (older).
 */
function exportAlacritty(palette) {
  const p = palette;
  const ansi = p.ansi;

  return `# Forest Ash Theme — Alacritty Configuration
# Generated: ${now()}
# Usage: paste into your alacritty.toml, or import with:
#   [general]
#   import = ["~/.config/alacritty/themes/forest-ash.toml"]
#
# Alacritty ≥ 0.13 TOML format

[colors.primary]
background = "${p.bg}"
foreground = "${p.fg}"

[colors.cursor]
text   = "${p.bg}"
cursor = "${p.accent}"

[colors.selection]
text       = "${p.fg}"
background = "${p.selection}"

[colors.normal]
black   = "${ansi.black}"
red     = "${ansi.red}"
green   = "${ansi.green}"
yellow  = "${ansi.yellow}"
blue    = "${ansi.blue}"
magenta = "${ansi.magenta}"
cyan    = "${ansi.cyan}"
white   = "${ansi.white}"

[colors.bright]
black   = "${ansi.brightBlack}"
red     = "${ansi.brightRed}"
green   = "${ansi.brightGreen}"
yellow  = "${ansi.brightYellow}"
blue    = "${ansi.brightBlue}"
magenta = "${ansi.brightMagenta}"
cyan    = "${ansi.brightCyan}"
white   = "${ansi.brightWhite}"

# Semantic colors (not standard Alacritty, for reference)
# accent   = "${p.accent}"
# keyword  = "${p.keyword}"
# string   = "${p.string}"
# function = "${p.func}"
# type     = "${p.type}"
# comment  = "${p.comment}"
`;
}

/**
 * Zed Editor theme (JSON).
 * Place in ~/.config/zed/themes/forest-ash.json
 */
function exportZed(palette) {
  const p = palette;

  const theme = {
    "$schema": "https://zed.dev/schema/themes/v0.2.0.json",
    name: p.name,
    author: "Forest Ash Theme",
    themes: [
      {
        name: p.name,
        appearance: p.isDark ? "dark" : "light",
        style: {
          background: p.bg,
          "editor.background": p.bg,
          "editor.foreground": p.fg,
          "editor.line_number": p.lineNum,
          "editor.active_line_number": p.fg,
          "editor.selection.background": p.selection + '60',
          "editor.gutter.background": p.uiBg,
          "editor.active_line.background": p.uiBg + '40',
          "editor.highlighted_line.background": p.uiBg + '40',
          "editor.invisible": p.lineNum,
          "editor.document_highlight.read_background": p.accent + '20',
          "editor.document_highlight.write_background": p.accent + '30',
          "surface.background": p.uiBg,
          "panel.background": p.uiBg,
          "pane.focused_border": p.accent,
          "toolbar.background": p.uiBg,
          "tab_bar.background": p.uiBg,
          "tab.active_background": p.bg,
          "tab.inactive_background": p.uiBg,
          "scrollbar_thumb.background": p.accent + '40',
          "scrollbar.track.background": p.uiBg,
          "scrollbar.track.border": p.border,
          "status_bar.background": p.statusBg,
          "title_bar.background": p.uiBg,
          "title_bar.inactive_background": p.uiBg,
          "border": p.border,
          "border.selected": p.accent,
          "border.focused": p.accent,
          "text": p.fg,
          "text.muted": p.comment,
          "text.placeholder": p.lineNum,
          "text.accent": p.accent,
          "text.disabled": p.lineNum,
          "link_text.hover": p.func,
          "syntax": {
            "comment": { "color": p.comment, "font_style": "italic" },
            "keyword": { "color": p.keyword, "font_weight": 700 },
            "operator": { "color": p.fg },
            "string": { "color": p.string },
            "string.escape": { "color": p.accent },
            "number": { "color": p.number },
            "boolean": { "color": p.number },
            "null_literal": { "color": p.number },
            "function": { "color": p.func },
            "function.call": { "color": p.func },
            "function.builtin": { "color": p.func },
            "method": { "color": p.func },
            "method.call": { "color": p.func },
            "type": { "color": p.type },
            "type.builtin": { "color": p.type },
            "constructor": { "color": p.type },
            "variable": { "color": p.variable },
            "variable.member": { "color": p.variable },
            "variable.parameter": { "color": p.variable, "font_style": "italic" },
            "attribute": { "color": p.type },
            "tag": { "color": p.keyword },
            "tag.attribute": { "color": p.variable },
            "embedded": { "color": p.fg },
            "markup.heading": { "color": p.keyword, "font_weight": 700 },
            "markup.list": { "color": p.fg },
            "markup.bold": { "color": p.fg, "font_weight": 700 },
            "markup.italic": { "color": p.fg, "font_style": "italic" },
            "markup.link_text": { "color": p.func },
            "markup.link_url": { "color": p.string },
            "markup.raw": { "color": p.string },
          },
          "terminal.background": p.bg,
          "terminal.foreground": p.fg,
          "terminal.bright_foreground": p.fg,
          "terminal.dim_foreground": p.comment,
          "terminal.ansi.black":          p.ansi.black,
          "terminal.ansi.red":            p.ansi.red,
          "terminal.ansi.green":          p.ansi.green,
          "terminal.ansi.yellow":         p.ansi.yellow,
          "terminal.ansi.blue":           p.ansi.blue,
          "terminal.ansi.magenta":        p.ansi.magenta,
          "terminal.ansi.cyan":           p.ansi.cyan,
          "terminal.ansi.white":          p.ansi.white,
          "terminal.ansi.bright_black":   p.ansi.brightBlack,
          "terminal.ansi.bright_red":     p.ansi.brightRed,
          "terminal.ansi.bright_green":   p.ansi.brightGreen,
          "terminal.ansi.bright_yellow":  p.ansi.brightYellow,
          "terminal.ansi.bright_blue":    p.ansi.brightBlue,
          "terminal.ansi.bright_magenta": p.ansi.brightMagenta,
          "terminal.ansi.bright_cyan":    p.ansi.brightCyan,
          "terminal.ansi.bright_white":   p.ansi.brightWhite,
        }
      }
    ]
  };

  return `// Forest Ash Theme — Zed Editor Theme
// Generated: ${now()}
// Usage: save as  ~/.config/zed/themes/forest-ash.json
//        then in settings.json: "theme": "${p.name}"
${JSON.stringify(theme, null, 2)}
`;
}

/**
 * tmux status-bar + pane-border color configuration.
 * Source in your .tmux.conf: source-file ~/.tmux/forest-ash.conf
 */
function exportTmux(palette) {
  const p = palette;
  return `# Forest Ash Theme — tmux Configuration
# Generated: ${now()}
# Usage: add to your ~/.tmux.conf:
#   source-file ~/.tmux/themes/forest-ash.conf
# Or paste directly into ~/.tmux.conf

# ── Pane borders ──────────────────────────────────────────────────────────────
set -g pane-border-style "fg=${p.border}"
set -g pane-active-border-style "fg=${p.accent}"

# ── Status bar ────────────────────────────────────────────────────────────────
set -g status "on"
set -g status-bg "${p.statusBg}"
set -g status-fg "${p.statusFg}"
set -g status-left-style "fg=${p.fg},bg=${p.uiBg}"
set -g status-right-style "fg=${p.fg},bg=${p.uiBg}"
set -g status-left " #[fg=${p.fg},bold]#S #[fg=${p.border}]│ "
set -g status-right "#[fg=${p.comment}] %H:%M #[fg=${p.border}]│ #[fg=${p.fg}]#H "

# ── Window tabs ───────────────────────────────────────────────────────────────
set -g window-status-style "fg=${p.comment},bg=${p.uiBg}"
set -g window-status-current-style "fg=${p.accent},bg=${p.bg},bold"
set -g window-status-format "  #I:#W  "
set -g window-status-current-format " #[fg=${p.accent}]▎#[fg=${p.fg}]#I:#W  "
set -g window-status-separator ""

# ── Messages ──────────────────────────────────────────────────────────────────
set -g message-style "fg=${p.fg},bg=${p.uiBg}"
set -g message-command-style "fg=${p.fg},bg=${p.uiBg}"

# ── Selection ─────────────────────────────────────────────────────────────────
set -g mode-style "fg=${p.bg},bg=${p.accent}"

# ── Clock ─────────────────────────────────────────────────────────────────────
set -g clock-mode-colour "${p.accent}"

# ── Copy mode ─────────────────────────────────────────────────────────────────
set -wg copy-mode-match-style "fg=${p.bg},bg=${p.string}"
set -wg copy-mode-current-match-style "fg=${p.bg},bg=${p.accent}"
`;
}

/**
 * Warp Terminal theme (JSON).
 * Place in ~/.warp/themes/forest-ash.yaml  (Warp uses YAML, we output JSON with note)
 */
function exportWarp(palette) {
  const p = palette;
  const ansi = p.ansi;

  // Warp uses YAML natively, but we output a YAML string for clarity
  return `# Forest Ash Theme — Warp Terminal
# Generated: ${now()}
# Usage: save as  ~/.warp/themes/forest-ash.yaml
#        then in Warp: Settings → Appearance → Themes → forest-ash

name: "${p.name}"
accent: "${p.accent}"
background: "${p.bg}"
foreground: "${p.fg}"
details: "${p.isDark ? 'darker' : 'lighter'}"
terminal_colors:
  normal:
    black:   "${ansi.black}"
    red:     "${ansi.red}"
    green:   "${ansi.green}"
    yellow:  "${ansi.yellow}"
    blue:    "${ansi.blue}"
    magenta: "${ansi.magenta}"
    cyan:    "${ansi.cyan}"
    white:   "${ansi.white}"
  bright:
    black:   "${ansi.brightBlack}"
    red:     "${ansi.brightRed}"
    green:   "${ansi.brightGreen}"
    yellow:  "${ansi.brightYellow}"
    blue:    "${ansi.brightBlue}"
    magenta: "${ansi.brightMagenta}"
    cyan:    "${ansi.brightCyan}"
    white:   "${ansi.brightWhite}"
`;
}

// ─── Export registry ──────────────────────────────────────────────────────────

const EXPORT_TARGETS = [
  {
    id:          'jetbrains',
    label:       '$(symbol-interface) JetBrains IDEs (.icls)',
    description: 'IntelliJ IDEA, Rider, CLion, PyCharm, WebStorm, GoLand…',
    detail:      'Settings → Editor → Color Scheme → ⚙ → Import Scheme',
    ext:         '.icls',
    filterName:  'JetBrains Color Scheme',
    export:      exportJetBrains,
  },
  {
    id:          'neovim',
    label:       '$(terminal) Neovim / Vim (.lua)',
    description: 'Neovim 0.8+, Vim 9+ — full Treesitter & LSP support',
    detail:      'Place in ~/.config/nvim/colors/  then: colorscheme forest-ash',
    ext:         '.lua',
    filterName:  'Lua',
    export:      exportNeovimLua,
  },
  {
    id:          'sublime',
    label:       '$(file-code) Sublime Text (.tmTheme)',
    description: 'Sublime Text 3/4 — TextMate scope rules',
    detail:      'Preferences → Browse Packages → drop into Packages/User/',
    ext:         '.tmTheme',
    filterName:  'tmTheme',
    export:      exportSublimeText,
  },
  {
    id:          'windows-terminal',
    label:       '$(window) Windows Terminal (fragment.json)',
    description: 'Windows Terminal — color scheme JSON fragment',
    detail:      'Add the "schemes" entry to your settings.json',
    ext:         '.json',
    filterName:  'JSON',
    export:      exportWindowsTerminal,
  },
  {
    id:          'iterm2',
    label:       '$(device-desktop) iTerm2 (.itermcolors)',
    description: 'iTerm2 macOS — full ANSI + cursor + selection',
    detail:      'Preferences → Profiles → Colors → Color Presets → Import',
    ext:         '.itermcolors',
    filterName:  'iTerm2 Colors',
    export:      exportITerm2,
  },
  {
    id:          'alacritty',
    label:       '$(terminal-linux) Alacritty (.toml)',
    description: 'Alacritty terminal emulator — TOML format (v0.13+)',
    detail:      'Paste into alacritty.toml or import via general.import',
    ext:         '.toml',
    filterName:  'TOML',
    export:      exportAlacritty,
  },
  {
    id:          'zed',
    label:       '$(zap) Zed Editor (.json)',
    description: 'Zed code editor — semantic UI + syntax token theme',
    detail:      'Place in ~/.config/zed/themes/  then set "theme" in settings',
    ext:         '.json',
    filterName:  'JSON',
    export:      exportZed,
  },
  {
    id:          'tmux',
    label:       '$(terminal-tmux) tmux (.conf)',
    description: 'tmux terminal multiplexer — status bar + pane borders',
    detail:      'source-file this from your ~/.tmux.conf',
    ext:         '.conf',
    filterName:  'tmux Config',
    export:      exportTmux,
  },
  {
    id:          'warp',
    label:       '$(rocket) Warp Terminal (.yaml)',
    description: 'Warp terminal emulator — theme YAML',
    detail:      'Place in ~/.warp/themes/  then select in Appearance → Themes',
    ext:         '.yaml',
    filterName:  'YAML',
    export:      exportWarp,
  },
];

module.exports = { buildPalette, EXPORT_TARGETS };
