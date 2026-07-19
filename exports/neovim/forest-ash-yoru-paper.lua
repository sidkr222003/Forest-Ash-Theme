-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#111417",
  fg        = "#D7DDD7",
  accent    = "#86BFA8",
  ui_bg     = "#151A1D",
  selection = "#294B43",
  comment   = "#7F8C89",
  keyword   = "#BBA876",
  string    = "#8EC7B0",
  func      = "#C0E5D2",
  type      = "#9FDAC0",
  number    = "#A3D8C5",
  variable  = "#D7DDD7",
}

function M.setup()
  vim.o.background = "dark"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Yoru Paper"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#D7DDD7", bg = "#111417" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#D7DDD7", bg = "#151A1D" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#D7DDD7cc", bg = "#111417" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#11141730" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#D7DDD7", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#7F8C89" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#294B43" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#294B43" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#111417", bg = "#86BFA8" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#111417", bg = "#BBA876" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#86BFA8", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#D7DDD7", bg = "#202729" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#D7DDD788", bg = "#151A1D" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#D7DDD788", bg = "#151A1D" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#D7DDD7", bg = "#111417" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#151A1D" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#2F3D38" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#2F3D38" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#D7DDD7", bg = "#151A1D" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#111417", bg = "#86BFA8" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#151A1D" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#86BFA8" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#151A1D" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#7F8C89", bg = "#151A1D" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#7F8C89", bg = "#151A1D" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#8EC7B0" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#A3D8C5" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#C0E5D2" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#C0E5D2" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#A3D8C530" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#86BFA830" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#8EC7B030" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#86BFA860" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#7F8C89", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#BBA876", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#BBA876" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#BBA876" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#BBA876" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#D7DDD7" })
  vim.api.nvim_set_hl(0, "String", { fg = "#8EC7B0" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#A3D8C5" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#A3D8C5" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#A3D8C5" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#D7DDD7" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#C0E5D2" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#9FDAC0" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#9FDAC0" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#BBA876" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#9FDAC0" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#A3D8C5" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#BBA876" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#BBA876" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#BBA876" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#86BFA8" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#86BFA8" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#D7DDD7" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#BBA876" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#8EC7B0", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#111417", bg = "#86BFA8", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#8EC7B0" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#A3D8C5" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#C0E5D2" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#7F8C89" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#8EC7B0", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#A3D8C5", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#7F8C89", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#BBA876", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#8EC7B0" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#A3D8C5" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#A3D8C5" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#C0E5D2" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#C0E5D2" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#C0E5D2" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#C0E5D2" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#9FDAC0" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#9FDAC0" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#D7DDD7" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#D7DDD7", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#D7DDD7" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#A3D8C5" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#9FDAC0" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#D7DDD7" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#D7DDD7" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#BBA876" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#D7DDD7" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#D7DDD7" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#1C2122"
  vim.g.terminal_color_8 = "#525657"
  vim.g.terminal_color_1     = "#C07878"
  vim.g.terminal_color_9 = "#CE9696"
  vim.g.terminal_color_2     = "#83B89D"
  vim.g.terminal_color_10 = "#9EC8B3"
  vim.g.terminal_color_3     = "#BBA876"
  vim.g.terminal_color_11 = "#CABB94"
  vim.g.terminal_color_4     = "#7BA0B8"
  vim.g.terminal_color_12 = "#98B5C8"
  vim.g.terminal_color_5     = "#AA8EBE"
  vim.g.terminal_color_13 = "#BDA7CC"
  vim.g.terminal_color_6     = "#7DBBB0"
  vim.g.terminal_color_14 = "#9ACAC1"
  vim.g.terminal_color_7     = "#D7DDD7"
  vim.g.terminal_color_15 = "#DAE0DA"
end

M.setup()
return M
