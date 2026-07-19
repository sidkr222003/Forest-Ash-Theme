-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#121515",
  fg        = "#DBDFDC",
  accent    = "#A6C0B6",
  ui_bg     = "#141A19",
  selection = "#3A5049",
  comment   = "#838E8B",
  keyword   = "#C7B781",
  string    = "#9CB8AE",
  func      = "#D0E6DD",
  type      = "#B4CEC4",
  number    = "#B8D6CA",
  variable  = "#DBDFDC",
}

function M.setup()
  vim.o.background = "dark"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Kage Washi"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#DBDFDC", bg = "#121515" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#DBDFDC", bg = "#141A19" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#DBDFDCcc", bg = "#121515" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#12151530" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#DBDFDC", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#838E8B" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#3A5049" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#3A5049" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#121515", bg = "#A6C0B6" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#121515", bg = "#C7B781" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#A6C0B6", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#DBDFDC", bg = "#1F2826" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#DBDFDC88", bg = "#141A19" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#DBDFDC88", bg = "#141A19" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#DBDFDC", bg = "#121515" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#141A19" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#37504A" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#37504A" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#DBDFDC", bg = "#141A19" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#121515", bg = "#A6C0B6" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#141A19" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#A6C0B6" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#141A19" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#838E8B", bg = "#141A19" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#838E8B", bg = "#141A19" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#9CB8AE" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#B8D6CA" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#D0E6DD" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#D0E6DD" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#B8D6CA30" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#A6C0B630" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#9CB8AE30" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#A6C0B660" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#838E8B", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#C7B781", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#C7B781" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#C7B781" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#C7B781" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#DBDFDC" })
  vim.api.nvim_set_hl(0, "String", { fg = "#9CB8AE" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#B8D6CA" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#B8D6CA" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#B8D6CA" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#DBDFDC" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#D0E6DD" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#B4CEC4" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#B4CEC4" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#C7B781" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#B4CEC4" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#B8D6CA" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#C7B781" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#C7B781" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#C7B781" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#A6C0B6" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#A6C0B6" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#DBDFDC" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#C7B781" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#9CB8AE", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#121515", bg = "#A6C0B6", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#9CB8AE" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#B8D6CA" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#D0E6DD" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#838E8B" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#9CB8AE", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#B8D6CA", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#838E8B", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#C7B781", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#9CB8AE" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#B8D6CA" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#B8D6CA" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#D0E6DD" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#D0E6DD" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#D0E6DD" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#D0E6DD" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#B4CEC4" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#B4CEC4" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#DBDFDC" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#DBDFDC", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#DBDFDC" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#B8D6CA" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#B4CEC4" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#DBDFDC" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#DBDFDC" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#C7B781" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#DBDFDC" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#DBDFDC" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#1A2221"
  vim.g.terminal_color_8 = "#515756"
  vim.g.terminal_color_1     = "#CC9090"
  vim.g.terminal_color_9 = "#D7A8A8"
  vim.g.terminal_color_2     = "#93C0AA"
  vim.g.terminal_color_10 = "#ABCEBD"
  vim.g.terminal_color_3     = "#C7B781"
  vim.g.terminal_color_11 = "#D3C79D"
  vim.g.terminal_color_4     = "#8FA8CC"
  vim.g.terminal_color_12 = "#A8BBD7"
  vim.g.terminal_color_5     = "#B29FD3"
  vim.g.terminal_color_13 = "#C3B4DD"
  vim.g.terminal_color_6     = "#8FC8C2"
  vim.g.terminal_color_14 = "#A8D4CF"
  vim.g.terminal_color_7     = "#DBDFDC"
  vim.g.terminal_color_15 = "#DEE2DF"
end

M.setup()
return M
