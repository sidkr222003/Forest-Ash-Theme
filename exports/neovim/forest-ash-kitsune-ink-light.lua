-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#F8F6F6",
  fg        = "#41382F",
  accent    = "#41382F",
  ui_bg     = "#F2EFEE",
  selection = "#E1CDC1",
  comment   = "#997D66",
  keyword   = "#864F28",
  string    = "#865832",
  func      = "#654729",
  type      = "#6D4A2C",
  number    = "#7A5129",
  variable  = "#3C332A",
}

function M.setup()
  vim.o.background = "light"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Kitsune Ink Light"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#41382F", bg = "#F8F6F6" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#41382F", bg = "#F2EFEE" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#41382Fcc", bg = "#F8F6F6" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#F8F6F630" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#41382F", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#3F3731" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#E1CDC1" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#E1CDC1" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#F8F6F6", bg = "#41382F" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#F8F6F6", bg = "#864F28" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#41382F", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#41382F", bg = "#F2EFED" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#41382F88", bg = "#F2EFEE" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#41382F88", bg = "#F2EFEE" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#41382F", bg = "#F8F6F6" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#F2EFEE" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#CABAAF" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#CABAAF" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#41382F", bg = "#F2EFEE" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#F8F6F6", bg = "#41382F" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#F2EFEE" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#41382F" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#F2EFEE" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#997D66", bg = "#F2EFEE" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#997D66", bg = "#F2EFEE" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#865832" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#7A5129" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#654729" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#654729" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#7A512930" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#41382F30" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#86583230" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#41382F60" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#997D66", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#864F28", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#864F28" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#864F28" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#864F28" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#41382F" })
  vim.api.nvim_set_hl(0, "String", { fg = "#865832" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#7A5129" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#7A5129" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#7A5129" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#3C332A" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#654729" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#6D4A2C" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#6D4A2C" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#864F28" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#6D4A2C" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#7A5129" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#864F28" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#864F28" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#864F28" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#41382F" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#41382F" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#41382F" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#864F28" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#865832", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#F8F6F6", bg = "#41382F", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#865832" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#7A5129" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#654729" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#997D66" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#865832", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#7A5129", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#997D66", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#864F28", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#865832" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#7A5129" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#7A5129" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#654729" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#654729" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#654729" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#654729" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#6D4A2C" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#6D4A2C" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#3C332A" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#3C332A", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#3C332A" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#7A5129" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#6D4A2C" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#41382F" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#41382F" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#864F28" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#3C332A" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#41382F" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#C12971"
  vim.g.terminal_color_8 = "#472777"
  vim.g.terminal_color_1     = "#A6563A"
  vim.g.terminal_color_9 = "#C96340"
  vim.g.terminal_color_2     = "#607F39"
  vim.g.terminal_color_10 = "#7CAA41"
  vim.g.terminal_color_3     = "#A37D33"
  vim.g.terminal_color_11 = "#CC9833"
  vim.g.terminal_color_4     = "#3C719A"
  vim.g.terminal_color_12 = "#418AC3"
  vim.g.terminal_color_5     = "#87469B"
  vim.g.terminal_color_13 = "#A655BE"
  vim.g.terminal_color_6     = "#418B89"
  vim.g.terminal_color_14 = "#47B8B5"
  vim.g.terminal_color_7     = "#5F8319"
  vim.g.terminal_color_15 = "#1B15CA"
end

M.setup()
return M
