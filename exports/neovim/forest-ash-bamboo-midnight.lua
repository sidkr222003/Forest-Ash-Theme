-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#0F1512",
  fg        = "#D7E1D9",
  accent    = "#8ECFAE",
  ui_bg     = "#131C18",
  selection = "#2E5A46",
  comment   = "#7A8D80",
  keyword   = "#C4B77E",
  string    = "#86C3A1",
  func      = "#BDEFD3",
  type      = "#9DDEBC",
  number    = "#A2DCBF",
  variable  = "#D7E1D9",
}

function M.setup()
  vim.o.background = "dark"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Bamboo Midnight"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#D7E1D9", bg = "#0F1512" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#D7E1D9", bg = "#131C18" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#D7E1D9cc", bg = "#0F1512" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#0F151230" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#D7E1D9", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#7A8D80" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#2E5A46" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#2E5A46" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#0F1512", bg = "#8ECFAE" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#0F1512", bg = "#C4B77E" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#8ECFAE", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#D7E1D9", bg = "#1C2A23" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#D7E1D988", bg = "#131C18" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#D7E1D988", bg = "#131C18" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#D7E1D9", bg = "#0F1512" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#131C18" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#315042" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#315042" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#D7E1D9", bg = "#131C18" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#0F1512", bg = "#8ECFAE" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#131C18" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#8ECFAE" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#131C18" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#7A8D80", bg = "#131C18" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#7A8D80", bg = "#131C18" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#86C3A1" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#A2DCBF" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#BDEFD3" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#BDEFD3" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#A2DCBF30" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#8ECFAE30" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#86C3A130" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#8ECFAE60" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#7A8D80", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#C4B77E", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#C4B77E" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#C4B77E" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#C4B77E" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#D7E1D9" })
  vim.api.nvim_set_hl(0, "String", { fg = "#86C3A1" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#A2DCBF" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#A2DCBF" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#A2DCBF" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#D7E1D9" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#BDEFD3" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#9DDEBC" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#9DDEBC" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#C4B77E" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#9DDEBC" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#A2DCBF" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#C4B77E" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#C4B77E" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#C4B77E" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#8ECFAE" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#8ECFAE" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#D7E1D9" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#C4B77E" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#86C3A1", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#0F1512", bg = "#8ECFAE", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#86C3A1" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#A2DCBF" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#BDEFD3" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#7A8D80" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#86C3A1", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#A2DCBF", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#7A8D80", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#C4B77E", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#86C3A1" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#A2DCBF" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#A2DCBF" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#BDEFD3" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#BDEFD3" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#BDEFD3" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#BDEFD3" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#9DDEBC" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#9DDEBC" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#D7E1D9" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#D7E1D9", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#D7E1D9" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#A2DCBF" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#9DDEBC" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#D7E1D9" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#D7E1D9" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#C4B77E" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#D7E1D9" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#D7E1D9" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#17221D"
  vim.g.terminal_color_8 = "#4F5753"
  vim.g.terminal_color_1     = "#CC8A8A"
  vim.g.terminal_color_9 = "#D7A4A4"
  vim.g.terminal_color_2     = "#8CC29F"
  vim.g.terminal_color_10 = "#A5CFB4"
  vim.g.terminal_color_3     = "#C4B77E"
  vim.g.terminal_color_11 = "#D1C79A"
  vim.g.terminal_color_4     = "#86A8CA"
  vim.g.terminal_color_12 = "#A1BBD6"
  vim.g.terminal_color_5     = "#AB97CF"
  vim.g.terminal_color_13 = "#BDAEDA"
  vim.g.terminal_color_6     = "#86C7C0"
  vim.g.terminal_color_14 = "#A1D3CE"
  vim.g.terminal_color_7     = "#D7E1D9"
  vim.g.terminal_color_15 = "#DAE3DC"
end

M.setup()
return M
