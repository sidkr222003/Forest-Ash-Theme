-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#F8F7F6",
  fg        = "#46372A",
  accent    = "#46372A",
  ui_bg     = "#F2EFED",
  selection = "#E6CFBC",
  comment   = "#997E66",
  keyword   = "#865428",
  string    = "#865D32",
  func      = "#654929",
  type      = "#6D4F2C",
  number    = "#7A5329",
  variable  = "#3C332A",
}

function M.setup()
  vim.o.background = "light"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Ronin Lantern Light"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#46372A", bg = "#F8F7F6" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#46372A", bg = "#F2EFED" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#46372Acc", bg = "#F8F7F6" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#F8F7F630" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#46372A", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#3F3831" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#E6CFBC" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#E6CFBC" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#F8F7F6", bg = "#46372A" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#F8F7F6", bg = "#865428" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#46372A", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#46372A", bg = "#F3EFEC" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#46372A88", bg = "#F2EFED" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#46372A88", bg = "#F2EFED" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#46372A", bg = "#F8F7F6" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#F2EFED" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#CEB9AB" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#CEB9AB" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#46372A", bg = "#F2EFED" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#F8F7F6", bg = "#46372A" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#F2EFED" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#46372A" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#F2EFED" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#997E66", bg = "#F2EFED" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#997E66", bg = "#F2EFED" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#865D32" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#7A5329" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#654929" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#654929" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#7A532930" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#46372A30" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#865D3230" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#46372A60" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#997E66", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#865428", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#865428" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#865428" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#865428" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#46372A" })
  vim.api.nvim_set_hl(0, "String", { fg = "#865D32" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#7A5329" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#7A5329" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#7A5329" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#3C332A" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#654929" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#6D4F2C" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#6D4F2C" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#865428" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#6D4F2C" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#7A5329" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#865428" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#865428" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#865428" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#46372A" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#46372A" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#46372A" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#865428" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#865D32", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#F8F7F6", bg = "#46372A", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#865D32" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#7A5329" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#654929" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#997E66" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#865D32", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#7A5329", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#997E66", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#865428", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#865D32" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#7A5329" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#7A5329" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#654929" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#654929" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#654929" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#654929" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#6D4F2C" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#6D4F2C" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#3C332A" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#3C332A", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#3C332A" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#7A5329" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#6D4F2C" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#46372A" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#46372A" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#865428" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#3C332A" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#46372A" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#3A4044"
  vim.g.terminal_color_8 = "#60686E"
  vim.g.terminal_color_1     = "#A6513A"
  vim.g.terminal_color_9 = "#C95D40"
  vim.g.terminal_color_2     = "#5B7F39"
  vim.g.terminal_color_10 = "#74AA41"
  vim.g.terminal_color_3     = "#A37D33"
  vim.g.terminal_color_11 = "#CC9833"
  vim.g.terminal_color_4     = "#3C689A"
  vim.g.terminal_color_12 = "#417DC3"
  vim.g.terminal_color_5     = "#78469B"
  vim.g.terminal_color_13 = "#9355BE"
  vim.g.terminal_color_6     = "#418B83"
  vim.g.terminal_color_14 = "#47B8AB"
  vim.g.terminal_color_7     = "#E9EDF1"
  vim.g.terminal_color_15 = "#F7FAFD"
end

M.setup()
return M
