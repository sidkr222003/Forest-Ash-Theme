-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#F5F7F9",
  fg        = "#25374B",
  accent    = "#25374B",
  ui_bg     = "#EBEFF4",
  selection = "#BECEE4",
  comment   = "#667D99",
  keyword   = "#284E86",
  string    = "#325386",
  func      = "#294065",
  type      = "#2C446D",
  number    = "#29467A",
  variable  = "#2A333C",
}

function M.setup()
  vim.o.background = "light"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Aizome Dusk Light"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#25374B", bg = "#F5F7F9" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#25374B", bg = "#EBEFF4" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#25374Bcc", bg = "#F5F7F9" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#F5F7F930" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#25374B", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#303740" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#BECEE4" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#BECEE4" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#F5F7F9", bg = "#25374B" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#F5F7F9", bg = "#284E86" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#25374B", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#25374B", bg = "#EBEFF5" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#25374B88", bg = "#EBEFF4" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#25374B88", bg = "#EBEFF4" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#25374B", bg = "#F5F7F9" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#EBEFF4" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#A7BAD2" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#A7BAD2" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#25374B", bg = "#EBEFF4" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#F5F7F9", bg = "#25374B" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#EBEFF4" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#25374B" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#EBEFF4" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#667D99", bg = "#EBEFF4" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#667D99", bg = "#EBEFF4" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#325386" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#29467A" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#294065" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#294065" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#29467A30" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#25374B30" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#32538630" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#25374B60" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#667D99", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#284E86", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#284E86" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#284E86" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#284E86" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#25374B" })
  vim.api.nvim_set_hl(0, "String", { fg = "#325386" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#29467A" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#29467A" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#29467A" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#2A333C" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#294065" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#2C446D" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#2C446D" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#284E86" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#2C446D" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#29467A" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#284E86" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#284E86" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#284E86" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#25374B" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#25374B" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#25374B" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#284E86" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#325386", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#F5F7F9", bg = "#25374B", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#325386" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#29467A" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#294065" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#667D99" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#325386", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#29467A", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#667D99", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#284E86", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#325386" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#29467A" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#29467A" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#294065" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#294065" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#294065" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#294065" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#2C446D" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#2C446D" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#2A333C" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#2A333C", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#2A333C" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#29467A" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#2C446D" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#25374B" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#25374B" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#284E86" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#2A333C" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#25374B" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#3A4044"
  vim.g.terminal_color_8 = "#60686E"
  vim.g.terminal_color_1     = "#A63A52"
  vim.g.terminal_color_9 = "#C9405F"
  vim.g.terminal_color_2     = "#397F5C"
  vim.g.terminal_color_10 = "#41AA75"
  vim.g.terminal_color_3     = "#A38633"
  vim.g.terminal_color_11 = "#CCA533"
  vim.g.terminal_color_4     = "#3C669A"
  vim.g.terminal_color_12 = "#417BC3"
  vim.g.terminal_color_5     = "#5E469B"
  vim.g.terminal_color_13 = "#7455BE"
  vim.g.terminal_color_6     = "#417C8B"
  vim.g.terminal_color_14 = "#47A1B8"
  vim.g.terminal_color_7     = "#E9EDF1"
  vim.g.terminal_color_15 = "#F7FAFD"
end

M.setup()
return M
