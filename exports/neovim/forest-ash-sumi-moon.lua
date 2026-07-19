-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#121217",
  fg        = "#DCD9E3",
  accent    = "#B9A9DD",
  ui_bg     = "#15151C",
  selection = "#3C3653",
  comment   = "#878194",
  keyword   = "#C6AF7B",
  string    = "#AFA0D6",
  func      = "#9BBCE6",
  type      = "#9BC6B9",
  number    = "#D2BEEA",
  variable  = "#DCD9E3",
}

function M.setup()
  vim.o.background = "dark"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Sumi Moon"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#DCD9E3", bg = "#121217" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#DCD9E3", bg = "#15151C" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#DCD9E3cc", bg = "#121217" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#12121730" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#DCD9E3", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#878194" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#3C3653" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#3C3653" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#121217", bg = "#B9A9DD" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#121217", bg = "#C6AF7B" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#B9A9DD", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#DCD9E3", bg = "#21202C" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#DCD9E388", bg = "#15151C" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#DCD9E388", bg = "#15151C" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#DCD9E3", bg = "#121217" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#15151C" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#36324A" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#36324A" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#DCD9E3", bg = "#15151C" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#121217", bg = "#B9A9DD" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#15151C" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#B9A9DD" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#15151C" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#878194", bg = "#15151C" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#878194", bg = "#15151C" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#AFA0D6" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#D2BEEA" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#9BBCE6" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#9BBCE6" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#D2BEEA30" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#B9A9DD30" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#AFA0D630" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#B9A9DD60" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#878194", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#C6AF7B", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#C6AF7B" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#C6AF7B" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#C6AF7B" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#DCD9E3" })
  vim.api.nvim_set_hl(0, "String", { fg = "#AFA0D6" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#D2BEEA" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#D2BEEA" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#D2BEEA" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#DCD9E3" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#9BBCE6" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#9BC6B9" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#9BC6B9" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#C6AF7B" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#9BC6B9" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#D2BEEA" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#C6AF7B" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#C6AF7B" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#C6AF7B" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#B9A9DD" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#B9A9DD" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#DCD9E3" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#C6AF7B" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#AFA0D6", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#121217", bg = "#B9A9DD", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#AFA0D6" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#D2BEEA" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#9BBCE6" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#878194" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#AFA0D6", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#D2BEEA", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#878194", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#C6AF7B", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#AFA0D6" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#D2BEEA" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#D2BEEA" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#9BBCE6" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#9BBCE6" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#9BBCE6" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#9BBCE6" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#9BC6B9" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#9BC6B9" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#DCD9E3" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#DCD9E3", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#DCD9E3" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#D2BEEA" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#9BC6B9" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#DCD9E3" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#DCD9E3" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#C6AF7B" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#DCD9E3" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#DCD9E3" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#1D1D24"
  vim.g.terminal_color_8 = "#535359"
  vim.g.terminal_color_1     = "#C7869E"
  vim.g.terminal_color_9 = "#D3A1B3"
  vim.g.terminal_color_2     = "#9CC6AE"
  vim.g.terminal_color_10 = "#B2D3C0"
  vim.g.terminal_color_3     = "#C6AF7B"
  vim.g.terminal_color_11 = "#D3C198"
  vim.g.terminal_color_4     = "#8CA3CC"
  vim.g.terminal_color_12 = "#A5B7D7"
  vim.g.terminal_color_5     = "#B294D8"
  vim.g.terminal_color_13 = "#C3ACE1"
  vim.g.terminal_color_6     = "#8DBFCD"
  vim.g.terminal_color_14 = "#A6CDD8"
  vim.g.terminal_color_7     = "#DCD9E3"
  vim.g.terminal_color_15 = "#DFDCE5"
end

M.setup()
return M
