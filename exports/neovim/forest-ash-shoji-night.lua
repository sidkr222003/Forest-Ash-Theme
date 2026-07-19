-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#10161A",
  fg        = "#D8E0E4",
  accent    = "#8BC6D9",
  ui_bg     = "#141B20",
  selection = "#2D4D59",
  comment   = "#7A8A92",
  keyword   = "#C2B47E",
  string    = "#87BFD0",
  func      = "#BFE4F1",
  type      = "#9FD5E6",
  number    = "#A5D5E5",
  variable  = "#D8E0E4",
}

function M.setup()
  vim.o.background = "dark"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Shoji Night"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#D8E0E4", bg = "#10161A" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#D8E0E4", bg = "#141B20" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#D8E0E4cc", bg = "#10161A" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#10161A30" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#D8E0E4", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#7A8A92" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#2D4D59" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#2D4D59" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#10161A", bg = "#8BC6D9" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#10161A", bg = "#C2B47E" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#8BC6D9", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#D8E0E4", bg = "#1C262C" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#D8E0E488", bg = "#141B20" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#D8E0E488", bg = "#141B20" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#D8E0E4", bg = "#10161A" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#141B20" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#314750" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#314750" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#D8E0E4", bg = "#141B20" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#10161A", bg = "#8BC6D9" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#141B20" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#8BC6D9" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#141B20" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#7A8A92", bg = "#141B20" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#7A8A92", bg = "#141B20" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#87BFD0" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#A5D5E5" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#BFE4F1" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#BFE4F1" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#A5D5E530" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#8BC6D930" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#87BFD030" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#8BC6D960" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#7A8A92", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#C2B47E", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#C2B47E" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#C2B47E" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#C2B47E" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#D8E0E4" })
  vim.api.nvim_set_hl(0, "String", { fg = "#87BFD0" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#A5D5E5" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#A5D5E5" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#A5D5E5" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#D8E0E4" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#BFE4F1" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#9FD5E6" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#9FD5E6" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#C2B47E" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#9FD5E6" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#A5D5E5" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#C2B47E" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#C2B47E" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#C2B47E" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#8BC6D9" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#8BC6D9" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#D8E0E4" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#C2B47E" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#87BFD0", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#10161A", bg = "#8BC6D9", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#87BFD0" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#A5D5E5" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#BFE4F1" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#7A8A92" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#87BFD0", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#A5D5E5", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#7A8A92", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#C2B47E", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#87BFD0" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#A5D5E5" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#A5D5E5" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#BFE4F1" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#BFE4F1" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#BFE4F1" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#BFE4F1" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#9FD5E6" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#9FD5E6" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#D8E0E4" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#D8E0E4", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#D8E0E4" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#A5D5E5" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#9FD5E6" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#D8E0E4" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#D8E0E4" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#C2B47E" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#D8E0E4" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#D8E0E4" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#182026"
  vim.g.terminal_color_8 = "#4F565A"
  vim.g.terminal_color_1     = "#CA8484"
  vim.g.terminal_color_9 = "#D69F9F"
  vim.g.terminal_color_2     = "#8AC0A9"
  vim.g.terminal_color_10 = "#A4CEBC"
  vim.g.terminal_color_3     = "#C2B47E"
  vim.g.terminal_color_11 = "#CFC59A"
  vim.g.terminal_color_4     = "#7BA9CD"
  vim.g.terminal_color_12 = "#98BCD8"
  vim.g.terminal_color_5     = "#A795D2"
  vim.g.terminal_color_13 = "#BAACDC"
  vim.g.terminal_color_6     = "#7EC4CF"
  vim.g.terminal_color_14 = "#9AD1DA"
  vim.g.terminal_color_7     = "#D8E0E4"
  vim.g.terminal_color_15 = "#DBE2E6"
end

M.setup()
return M
