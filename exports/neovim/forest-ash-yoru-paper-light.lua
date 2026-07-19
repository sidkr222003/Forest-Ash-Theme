-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#F6F7F8",
  fg        = "#313F31",
  accent    = "#313F31",
  ui_bg     = "#EDF0F2",
  selection = "#C1E1DA",
  comment   = "#66998D",
  keyword   = "#28865D",
  string    = "#328664",
  func      = "#296547",
  type      = "#2C6D50",
  number    = "#297A5D",
  variable  = "#2A3C2A",
}

function M.setup()
  vim.o.background = "light"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Yoru Paper Light"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#313F31", bg = "#F6F7F8" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#313F31", bg = "#EDF0F2" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#313F31cc", bg = "#F6F7F8" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#F6F7F830" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#313F31", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#313F3C" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#C1E1DA" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#C1E1DA" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#F6F7F8", bg = "#313F31" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#F6F7F8", bg = "#28865D" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#313F31", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#313F31", bg = "#EEF1F2" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#313F3188", bg = "#EDF0F2" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#313F3188", bg = "#EDF0F2" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#313F31", bg = "#F6F7F8" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#EDF0F2" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#B4C5BF" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#B4C5BF" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#313F31", bg = "#EDF0F2" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#F6F7F8", bg = "#313F31" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#EDF0F2" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#313F31" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#EDF0F2" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#66998D", bg = "#EDF0F2" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#66998D", bg = "#EDF0F2" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#328664" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#297A5D" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#296547" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#296547" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#297A5D30" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#313F3130" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#32866430" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#313F3160" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#66998D", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#28865D", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#28865D" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#28865D" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#28865D" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#313F31" })
  vim.api.nvim_set_hl(0, "String", { fg = "#328664" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#297A5D" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#297A5D" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#297A5D" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#2A3C2A" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#296547" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#2C6D50" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#2C6D50" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#28865D" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#2C6D50" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#297A5D" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#28865D" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#28865D" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#28865D" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#313F31" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#313F31" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#313F31" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#28865D" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#328664", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#F6F7F8", bg = "#313F31", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#328664" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#297A5D" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#296547" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#66998D" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#328664", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#297A5D", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#66998D", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#28865D", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#328664" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#297A5D" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#297A5D" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#296547" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#296547" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#296547" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#296547" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#2C6D50" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#2C6D50" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#2A3C2A" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#2A3C2A", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#2A3C2A" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#297A5D" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#2C6D50" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#313F31" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#313F31" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#28865D" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#2A3C2A" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#313F31" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#3A4044"
  vim.g.terminal_color_8 = "#60686E"
  vim.g.terminal_color_1     = "#A63A3A"
  vim.g.terminal_color_9 = "#C94040"
  vim.g.terminal_color_2     = "#397F5B"
  vim.g.terminal_color_10 = "#41AA74"
  vim.g.terminal_color_3     = "#A38433"
  vim.g.terminal_color_11 = "#CCA233"
  vim.g.terminal_color_4     = "#3C759A"
  vim.g.terminal_color_12 = "#4190C3"
  vim.g.terminal_color_5     = "#77469B"
  vim.g.terminal_color_13 = "#9255BE"
  vim.g.terminal_color_6     = "#418B7E"
  vim.g.terminal_color_14 = "#47B8A4"
  vim.g.terminal_color_7     = "#E9EDF1"
  vim.g.terminal_color_15 = "#F7FAFD"
end

M.setup()
return M
