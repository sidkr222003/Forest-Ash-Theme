-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#F6F6F9",
  fg        = "#252B4B",
  accent    = "#252B4B",
  ui_bg     = "#EBEDF5",
  selection = "#BFC4E4",
  comment   = "#667199",
  keyword   = "#283186",
  string    = "#323A86",
  func      = "#292F65",
  type      = "#2C316D",
  number    = "#29317A",
  variable  = "#2A2D3C",
}

function M.setup()
  vim.o.background = "light"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Nebula Manga Light"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#252B4B", bg = "#F6F6F9" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#252B4B", bg = "#EBEDF5" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#252B4Bcc", bg = "#F6F6F9" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#F6F6F930" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#252B4B", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#303340" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#BFC4E4" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#BFC4E4" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#F6F6F9", bg = "#252B4B" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#F6F6F9", bg = "#283186" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#252B4B", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#252B4B", bg = "#EBEEF4" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#252B4B88", bg = "#EBEDF5" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#252B4B88", bg = "#EBEDF5" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#252B4B", bg = "#F6F6F9" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#EBEDF5" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#A8B2D1" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#A8B2D1" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#252B4B", bg = "#EBEDF5" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#F6F6F9", bg = "#252B4B" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#EBEDF5" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#252B4B" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#EBEDF5" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#667199", bg = "#EBEDF5" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#667199", bg = "#EBEDF5" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#323A86" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#29317A" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#292F65" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#292F65" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#29317A30" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#252B4B30" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#323A8630" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#252B4B60" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#667199", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#283186", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#283186" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#283186" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#283186" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#252B4B" })
  vim.api.nvim_set_hl(0, "String", { fg = "#323A86" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#29317A" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#29317A" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#29317A" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#2A2D3C" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#292F65" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#2C316D" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#2C316D" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#283186" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#2C316D" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#29317A" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#283186" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#283186" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#283186" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#252B4B" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#252B4B" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#252B4B" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#283186" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#323A86", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#F6F6F9", bg = "#252B4B", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#323A86" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#29317A" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#292F65" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#667199" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#323A86", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#29317A", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#667199", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#283186", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#323A86" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#29317A" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#29317A" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#292F65" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#292F65" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#292F65" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#292F65" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#2C316D" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#2C316D" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#2A2D3C" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#2A2D3C", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#2A2D3C" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#29317A" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#2C316D" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#252B4B" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#252B4B" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#283186" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#2A2D3C" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#252B4B" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#B40D4E"
  vim.g.terminal_color_8 = "#BD514C"
  vim.g.terminal_color_1     = "#A63A66"
  vim.g.terminal_color_9 = "#C94078"
  vim.g.terminal_color_2     = "#1F4D04"
  vim.g.terminal_color_10 = "#D34872"
  vim.g.terminal_color_3     = "#A38D33"
  vim.g.terminal_color_11 = "#CCAE33"
  vim.g.terminal_color_4     = "#3C5B9A"
  vim.g.terminal_color_12 = "#416BC3"
  vim.g.terminal_color_5     = "#68469B"
  vim.g.terminal_color_13 = "#8055BE"
  vim.g.terminal_color_6     = "#41788B"
  vim.g.terminal_color_14 = "#479CB8"
  vim.g.terminal_color_7     = "#133C22"
  vim.g.terminal_color_15 = "#BB067F"
end

M.setup()
return M
