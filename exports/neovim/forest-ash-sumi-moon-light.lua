-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#F6F6F8",
  fg        = "#353041",
  accent    = "#353041",
  ui_bg     = "#EEEEF2",
  selection = "#CAC5DE",
  comment   = "#766699",
  keyword   = "#492886",
  string    = "#493286",
  func      = "#432965",
  type      = "#442C6D",
  number    = "#4E297A",
  variable  = "#2F2A3C",
}

function M.setup()
  vim.o.background = "light"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Sumi Moon Light"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#353041", bg = "#F6F6F8" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#353041", bg = "#EEEEF2" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#353041cc", bg = "#F6F6F8" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#F6F6F830" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#353041", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#36313F" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#CAC5DE" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#CAC5DE" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#F6F6F8", bg = "#353041" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#F6F6F8", bg = "#492886" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#353041", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#353041", bg = "#EEEDF2" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#35304188", bg = "#EEEEF2" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#35304188", bg = "#EEEEF2" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#353041", bg = "#F6F6F8" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#EEEEF2" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#B4B0CA" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#B4B0CA" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#353041", bg = "#EEEEF2" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#F6F6F8", bg = "#353041" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#EEEEF2" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#353041" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#EEEEF2" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#766699", bg = "#EEEEF2" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#766699", bg = "#EEEEF2" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#493286" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#4E297A" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#432965" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#432965" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#4E297A30" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#35304130" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#49328630" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#35304160" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#766699", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#492886", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#492886" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#492886" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#492886" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#353041" })
  vim.api.nvim_set_hl(0, "String", { fg = "#493286" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#4E297A" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#4E297A" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#4E297A" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#2F2A3C" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#432965" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#442C6D" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#442C6D" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#492886" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#442C6D" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#4E297A" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#492886" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#492886" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#492886" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#353041" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#353041" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#353041" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#492886" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#493286", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#F6F6F8", bg = "#353041", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#493286" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#4E297A" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#432965" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#766699" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#493286", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#4E297A", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#766699", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#492886", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#493286" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#4E297A" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#4E297A" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#432965" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#432965" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#432965" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#432965" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#442C6D" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#442C6D" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#2F2A3C" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#2F2A3C", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#2F2A3C" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#4E297A" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#442C6D" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#353041" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#353041" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#492886" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#2F2A3C" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#353041" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#342EC6"
  vim.g.terminal_color_8 = "#295BCD"
  vim.g.terminal_color_1     = "#A63A62"
  vim.g.terminal_color_9 = "#C94073"
  vim.g.terminal_color_2     = "#397F57"
  vim.g.terminal_color_10 = "#41AA6E"
  vim.g.terminal_color_3     = "#A38133"
  vim.g.terminal_color_11 = "#CC9D33"
  vim.g.terminal_color_4     = "#3C5E9A"
  vim.g.terminal_color_12 = "#4170C3"
  vim.g.terminal_color_5     = "#6B469B"
  vim.g.terminal_color_13 = "#8355BE"
  vim.g.terminal_color_6     = "#417B8B"
  vim.g.terminal_color_14 = "#479FB8"
  vim.g.terminal_color_7     = "#23388A"
  vim.g.terminal_color_15 = "#DD5080"
end

M.setup()
return M
