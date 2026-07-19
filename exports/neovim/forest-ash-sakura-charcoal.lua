-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#151214",
  fg        = "#E3D8DE",
  accent    = "#D8A8BE",
  ui_bg     = "#191318",
  selection = "#624152",
  comment   = "#96828D",
  keyword   = "#D0B37C",
  string    = "#D4A0B8",
  func      = "#A7C0EB",
  type      = "#9CCFAE",
  number    = "#E7B9CF",
  variable  = "#E3D8DE",
}

function M.setup()
  vim.o.background = "dark"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Sakura Charcoal"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#E3D8DE", bg = "#151214" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#E3D8DE", bg = "#191318" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#E3D8DEcc", bg = "#151214" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#15121430" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#E3D8DE", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#96828D" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#624152" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#624152" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#151214", bg = "#D8A8BE" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#151214", bg = "#D0B37C" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#D8A8BE", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#E3D8DE", bg = "#271E24" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#E3D8DE88", bg = "#191318" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#E3D8DE88", bg = "#191318" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#E3D8DE", bg = "#151214" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#191318" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#563A49" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#563A49" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#E3D8DE", bg = "#191318" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#151214", bg = "#D8A8BE" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#191318" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#D8A8BE" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#191318" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#96828D", bg = "#191318" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#96828D", bg = "#191318" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#D4A0B8" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#E7B9CF" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#A7C0EB" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#A7C0EB" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#E7B9CF30" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#D8A8BE30" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#D4A0B830" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#D8A8BE60" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#96828D", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#D0B37C", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#D0B37C" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#D0B37C" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#D0B37C" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#E3D8DE" })
  vim.api.nvim_set_hl(0, "String", { fg = "#D4A0B8" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#E7B9CF" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#E7B9CF" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#E7B9CF" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#E3D8DE" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#A7C0EB" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#9CCFAE" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#9CCFAE" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#D0B37C" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#9CCFAE" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#E7B9CF" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#D0B37C" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#D0B37C" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#D0B37C" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#D8A8BE" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#D8A8BE" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#E3D8DE" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#D0B37C" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#D4A0B8", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#151214", bg = "#D8A8BE", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#D4A0B8" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#E7B9CF" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#A7C0EB" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#96828D" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#D4A0B8", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#E7B9CF", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#96828D", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#D0B37C", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#D4A0B8" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#E7B9CF" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#E7B9CF" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#A7C0EB" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#A7C0EB" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#A7C0EB" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#A7C0EB" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#9CCFAE" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#9CCFAE" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#E3D8DE" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#E3D8DE", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#E3D8DE" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#E7B9CF" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#9CCFAE" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#E3D8DE" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#E3D8DE" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#D0B37C" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#E3D8DE" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#E3D8DE" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#211920"
  vim.g.terminal_color_8 = "#565056"
  vim.g.terminal_color_1     = "#C35A6A"
  vim.g.terminal_color_9 = "#DAA4AF"
  vim.g.terminal_color_2     = "#95C1A2"
  vim.g.terminal_color_10 = "#ACCFB6"
  vim.g.terminal_color_3     = "#D0B37C"
  vim.g.terminal_color_11 = "#DAC499"
  vim.g.terminal_color_4     = "#91A9CC"
  vim.g.terminal_color_12 = "#A9BCD7"
  vim.g.terminal_color_5     = "#C09BD0"
  vim.g.terminal_color_13 = "#CEB1DA"
  vim.g.terminal_color_6     = "#92C5C8"
  vim.g.terminal_color_14 = "#AAD2D4"
  vim.g.terminal_color_7     = "#E3D8DE"
  vim.g.terminal_color_15 = "#E5DBE1"
end

M.setup()
return M
