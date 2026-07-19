-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#F6F9F7",
  fg        = "#304033",
  accent    = "#304033",
  ui_bg     = "#EDF3F0",
  selection = "#BFE3D3",
  comment   = "#669976",
  keyword   = "#288651",
  string    = "#328657",
  func      = "#296544",
  type      = "#2C6D4B",
  number    = "#297A52",
  variable  = "#2A3C2D",
}

function M.setup()
  vim.o.background = "light"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Bamboo Midnight Light"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#304033", bg = "#F6F9F7" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#304033", bg = "#EDF3F0" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#304033cc", bg = "#F6F9F7" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#F6F9F730" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#304033", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#313F36" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#BFE3D3" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#BFE3D3" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#F6F9F7", bg = "#304033" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#F6F9F7", bg = "#288651" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#304033", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#304033", bg = "#EDF3F0" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#30403388", bg = "#EDF3F0" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#30403388", bg = "#EDF3F0" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#304033", bg = "#F6F9F7" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#EDF3F0" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#ADCDBE" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#ADCDBE" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#304033", bg = "#EDF3F0" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#F6F9F7", bg = "#304033" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#EDF3F0" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#304033" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#EDF3F0" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#669976", bg = "#EDF3F0" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#669976", bg = "#EDF3F0" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#328657" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#297A52" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#296544" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#296544" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#297A5230" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#30403330" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#32865730" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#30403360" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#669976", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#288651", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#288651" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#288651" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#288651" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#304033" })
  vim.api.nvim_set_hl(0, "String", { fg = "#328657" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#297A52" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#297A52" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#297A52" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#2A3C2D" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#296544" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#2C6D4B" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#2C6D4B" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#288651" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#2C6D4B" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#297A52" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#288651" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#288651" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#288651" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#304033" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#304033" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#304033" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#288651" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#328657", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#F6F9F7", bg = "#304033", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#328657" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#297A52" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#296544" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#669976" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#328657", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#297A52", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#669976", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#288651", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#328657" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#297A52" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#297A52" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#296544" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#296544" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#296544" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#296544" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#2C6D4B" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#2C6D4B" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#2A3C2D" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#2A3C2D", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#2A3C2D" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#297A52" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#2C6D4B" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#304033" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#304033" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#288651" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#2A3C2D" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#304033" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#BC3FE9"
  vim.g.terminal_color_8 = "#B81404"
  vim.g.terminal_color_1     = "#A63A3A"
  vim.g.terminal_color_9 = "#C94040"
  vim.g.terminal_color_2     = "#397F51"
  vim.g.terminal_color_10 = "#41AA66"
  vim.g.terminal_color_3     = "#A38E33"
  vim.g.terminal_color_11 = "#CCB033"
  vim.g.terminal_color_4     = "#3C6B9A"
  vim.g.terminal_color_12 = "#4182C3"
  vim.g.terminal_color_5     = "#64469B"
  vim.g.terminal_color_13 = "#7B55BE"
  vim.g.terminal_color_6     = "#418B83"
  vim.g.terminal_color_14 = "#47B8AC"
  vim.g.terminal_color_7     = "#376E4B"
  vim.g.terminal_color_15 = "#3946DB"
end

M.setup()
return M
