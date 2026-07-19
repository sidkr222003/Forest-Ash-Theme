-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#11131A",
  fg        = "#DADDED",
  accent    = "#A9B0ED",
  ui_bg     = "#131826",
  selection = "#3A4276",
  comment   = "#7F86A0",
  keyword   = "#C7B97F",
  string    = "#9FA6E8",
  func      = "#CED2FA",
  type      = "#BDC1F7",
  number    = "#B6BCF0",
  variable  = "#DADDED",
}

function M.setup()
  vim.o.background = "dark"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Nebula Manga"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#DADDED", bg = "#11131A" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#DADDED", bg = "#131826" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#DADDEDcc", bg = "#11131A" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#11131A30" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#DADDED", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#7F86A0" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#3A4276" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#3A4276" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#11131A", bg = "#A9B0ED" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#11131A", bg = "#C7B97F" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#A9B0ED", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#DADDED", bg = "#1D2435" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#DADDED88", bg = "#131826" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#DADDED88", bg = "#131826" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#DADDED", bg = "#11131A" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#131826" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#3A466D" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#3A466D" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#DADDED", bg = "#131826" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#11131A", bg = "#A9B0ED" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#131826" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#A9B0ED" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#131826" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#7F86A0", bg = "#131826" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#7F86A0", bg = "#131826" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#9FA6E8" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#B6BCF0" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#CED2FA" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#CED2FA" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#B6BCF030" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#A9B0ED30" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#9FA6E830" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#A9B0ED60" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#7F86A0", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#C7B97F", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#C7B97F" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#C7B97F" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#C7B97F" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#DADDED" })
  vim.api.nvim_set_hl(0, "String", { fg = "#9FA6E8" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#B6BCF0" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#B6BCF0" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#B6BCF0" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#DADDED" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#CED2FA" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#BDC1F7" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#BDC1F7" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#C7B97F" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#BDC1F7" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#B6BCF0" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#C7B97F" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#C7B97F" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#C7B97F" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#A9B0ED" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#A9B0ED" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#DADDED" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#C7B97F" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#9FA6E8", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#11131A", bg = "#A9B0ED", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#9FA6E8" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#B6BCF0" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#CED2FA" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#7F86A0" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#9FA6E8", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#B6BCF0", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#7F86A0", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#C7B97F", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#9FA6E8" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#B6BCF0" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#B6BCF0" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#CED2FA" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#CED2FA" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#CED2FA" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#CED2FA" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#BDC1F7" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#BDC1F7" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#DADDED" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#DADDED", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#DADDED" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#B6BCF0" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#BDC1F7" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#DADDED" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#DADDED" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#C7B97F" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#DADDED" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#DADDED" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#171E2C"
  vim.g.terminal_color_8 = "#4F545F"
  vim.g.terminal_color_1     = "#CA8AA4"
  vim.g.terminal_color_9 = "#D6A4B8"
  vim.g.terminal_color_2     = "#90C4AA"
  vim.g.terminal_color_10 = "#A8D1BD"
  vim.g.terminal_color_3     = "#C7B97F"
  vim.g.terminal_color_11 = "#D3C89B"
  vim.g.terminal_color_4     = "#8EA9E1"
  vim.g.terminal_color_12 = "#A7BCE8"
  vim.g.terminal_color_5     = "#B79CDE"
  vim.g.terminal_color_13 = "#C7B2E5"
  vim.g.terminal_color_6     = "#8CC5D8"
  vim.g.terminal_color_14 = "#A5D2E1"
  vim.g.terminal_color_7     = "#DADDED"
  vim.g.terminal_color_15 = "#DDE0EE"
end

M.setup()
return M
