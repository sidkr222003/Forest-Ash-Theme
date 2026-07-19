-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#F8F6F8",
  fg        = "#412F39",
  accent    = "#412F39",
  ui_bg     = "#F2EEF1",
  selection = "#DDC5D1",
  comment   = "#996682",
  keyword   = "#862857",
  string    = "#863259",
  func      = "#65294A",
  type      = "#6D2C49",
  number    = "#7A2950",
  variable  = "#3C2A34",
}

function M.setup()
  vim.o.background = "light"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Sakura Charcoal Light"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#412F39", bg = "#F8F6F8" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#412F39", bg = "#F2EEF1" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#412F39cc", bg = "#F8F6F8" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#F8F6F830" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#412F39", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#3F3139" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#DDC5D1" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#DDC5D1" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#F8F6F8", bg = "#412F39" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#F8F6F8", bg = "#862857" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#412F39", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#412F39", bg = "#F2EEF0" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#412F3988", bg = "#F2EEF1" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#412F3988", bg = "#F2EEF1" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#412F39", bg = "#F8F6F8" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#F2EEF1" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#CAB0BE" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#CAB0BE" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#412F39", bg = "#F2EEF1" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#F8F6F8", bg = "#412F39" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#F2EEF1" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#412F39" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#F2EEF1" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#996682", bg = "#F2EEF1" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#996682", bg = "#F2EEF1" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#863259" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#7A2950" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#65294A" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#65294A" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#7A295030" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#412F3930" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#86325930" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#412F3960" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#996682", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#862857", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#862857" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#862857" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#862857" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#412F39" })
  vim.api.nvim_set_hl(0, "String", { fg = "#863259" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#7A2950" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#7A2950" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#7A2950" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#3C2A34" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#65294A" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#6D2C49" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#6D2C49" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#862857" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#6D2C49" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#7A2950" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#862857" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#862857" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#862857" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#412F39" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#412F39" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#412F39" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#862857" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#863259", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#F8F6F8", bg = "#412F39", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#863259" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#7A2950" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#65294A" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#996682" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#863259", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#7A2950", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#996682", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#862857", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#863259" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#7A2950" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#7A2950" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#65294A" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#65294A" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#65294A" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#65294A" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#6D2C49" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#6D2C49" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#3C2A34" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#3C2A34", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#3C2A34" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#7A2950" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#6D2C49" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#412F39" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#412F39" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#862857" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#3C2A34" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#412F39" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#6A7549"
  vim.g.terminal_color_8 = "#785117"
  vim.g.terminal_color_1     = "#A63A50"
  vim.g.terminal_color_9 = "#C9405B"
  vim.g.terminal_color_2     = "#397F4E"
  vim.g.terminal_color_10 = "#41AA60"
  vim.g.terminal_color_3     = "#A37C33"
  vim.g.terminal_color_11 = "#CC9733"
  vim.g.terminal_color_4     = "#3C629A"
  vim.g.terminal_color_12 = "#1CDF5B"
  vim.g.terminal_color_5     = "#81469B"
  vim.g.terminal_color_13 = "#9F55BE"
  vim.g.terminal_color_6     = "#41878B"
  vim.g.terminal_color_14 = "#47B1B8"
  vim.g.terminal_color_7     = "#6C7BB7"
  vim.g.terminal_color_15 = "#FE31F6"
end

M.setup()
return M
