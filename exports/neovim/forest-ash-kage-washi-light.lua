-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#F6F8F8",
  fg        = "#313F35",
  accent    = "#313F35",
  ui_bg     = "#EEF2F1",
  selection = "#C7DBD5",
  comment   = "#66998B",
  keyword   = "#288665",
  string    = "#328668",
  func      = "#29654D",
  type      = "#2C6D54",
  number    = "#297A5A",
  variable  = "#2A3C2E",
}

function M.setup()
  vim.o.background = "light"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Kage Washi Light"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#313F35", bg = "#F6F8F8" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#313F35", bg = "#EEF2F1" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#313F35cc", bg = "#F6F8F8" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#F6F8F830" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#313F35", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#313F3B" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#C7DBD5" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#C7DBD5" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#F6F8F8", bg = "#313F35" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#F6F8F8", bg = "#288665" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#313F35", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#313F35", bg = "#EEF2F1" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#313F3588", bg = "#EEF2F1" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#313F3588", bg = "#EEF2F1" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#313F35", bg = "#F6F8F8" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#EEF2F1" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#B0C9C3" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#B0C9C3" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#313F35", bg = "#EEF2F1" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#F6F8F8", bg = "#313F35" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#EEF2F1" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#313F35" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#EEF2F1" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#66998B", bg = "#EEF2F1" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#66998B", bg = "#EEF2F1" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#328668" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#297A5A" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#29654D" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#29654D" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#297A5A30" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#313F3530" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#32866830" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#313F3560" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#66998B", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#288665", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#288665" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#288665" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#288665" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#313F35" })
  vim.api.nvim_set_hl(0, "String", { fg = "#328668" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#297A5A" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#297A5A" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#297A5A" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#2A3C2E" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#29654D" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#2C6D54" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#2C6D54" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#288665" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#2C6D54" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#297A5A" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#288665" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#288665" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#288665" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#313F35" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#313F35" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#313F35" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#288665" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#328668", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#F6F8F8", bg = "#313F35", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#328668" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#297A5A" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#29654D" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#66998B" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#328668", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#297A5A", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#66998B", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#288665", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#328668" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#297A5A" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#297A5A" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#29654D" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#29654D" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#29654D" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#29654D" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#2C6D54" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#2C6D54" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#2A3C2E" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#2A3C2E", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#2A3C2E" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#297A5A" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#2C6D54" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#313F35" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#313F35" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#288665" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#2A3C2E" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#313F35" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#7397FA"
  vim.g.terminal_color_8 = "#7E90C7"
  vim.g.terminal_color_1     = "#3AC921"
  vim.g.terminal_color_9 = "#53ED2E"
  vim.g.terminal_color_2     = "#397F5D"
  vim.g.terminal_color_10 = "#41AA76"
  vim.g.terminal_color_3     = "#A38933"
  vim.g.terminal_color_11 = "#CCA933"
  vim.g.terminal_color_4     = "#3C639A"
  vim.g.terminal_color_12 = "#4176C3"
  vim.g.terminal_color_5     = "#65469B"
  vim.g.terminal_color_13 = "#61818D"
  vim.g.terminal_color_6     = "#678D57"
  vim.g.terminal_color_14 = "#BE3ADC"
  vim.g.terminal_color_7     = "#1D554D"
  vim.g.terminal_color_15 = "#EF2D49"
end

M.setup()
return M
