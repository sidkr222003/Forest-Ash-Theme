-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#F6F8F9",
  fg        = "#2E3C42",
  accent    = "#2E3C42",
  ui_bg     = "#ECF0F3",
  selection = "#BFD9E3",
  comment   = "#668899",
  keyword   = "#286C86",
  string    = "#327286",
  func      = "#295665",
  type      = "#2C5D6D",
  number    = "#29667A",
  variable  = "#2A363C",
}

function M.setup()
  vim.o.background = "light"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Shoji Night Light"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#2E3C42", bg = "#F6F8F9" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#2E3C42", bg = "#ECF0F3" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#2E3C42cc", bg = "#F6F8F9" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#F6F8F930" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#2E3C42", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#313A3F" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#BFD9E3" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#BFD9E3" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#F6F8F9", bg = "#2E3C42" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#F6F8F9", bg = "#286C86" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#2E3C42", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#2E3C42", bg = "#ECF1F3" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#2E3C4288", bg = "#ECF0F3" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#2E3C4288", bg = "#ECF0F3" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#2E3C42", bg = "#F6F8F9" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#ECF0F3" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#ADC3CD" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#ADC3CD" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#2E3C42", bg = "#ECF0F3" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#F6F8F9", bg = "#2E3C42" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#ECF0F3" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#2E3C42" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#ECF0F3" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#668899", bg = "#ECF0F3" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#668899", bg = "#ECF0F3" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#327286" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#29667A" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#295665" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#295665" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#29667A30" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#2E3C4230" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#32728630" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#2E3C4260" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#668899", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#286C86", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#286C86" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#286C86" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#286C86" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#2E3C42" })
  vim.api.nvim_set_hl(0, "String", { fg = "#327286" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#29667A" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#29667A" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#29667A" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#2A363C" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#295665" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#2C5D6D" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#2C5D6D" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#286C86" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#2C5D6D" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#29667A" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#286C86" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#286C86" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#286C86" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#2E3C42" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#2E3C42" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#2E3C42" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#286C86" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#327286", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#F6F8F9", bg = "#2E3C42", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#327286" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#29667A" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#295665" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#668899" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#327286", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#29667A", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#668899", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#286C86", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#327286" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#29667A" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#29667A" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#295665" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#295665" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#295665" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#295665" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#2C5D6D" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#2C5D6D" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#2A363C" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#2A363C", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#2A363C" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#29667A" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#2C5D6D" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#2E3C42" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#2E3C42" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#286C86" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#2A363C" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#2E3C42" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#3CF200"
  vim.g.terminal_color_8 = "#7E27CA"
  vim.g.terminal_color_1     = "#16FE02"
  vim.g.terminal_color_9 = "#8C97FF"
  vim.g.terminal_color_2     = "#397F61"
  vim.g.terminal_color_10 = "#41AA7D"
  vim.g.terminal_color_3     = "#A38C33"
  vim.g.terminal_color_11 = "#CCAD33"
  vim.g.terminal_color_4     = "#3985CF"
  vim.g.terminal_color_12 = "#550A95"
  vim.g.terminal_color_5     = "#5F469B"
  vim.g.terminal_color_13 = "#A75FD6"
  vim.g.terminal_color_6     = "#41818B"
  vim.g.terminal_color_14 = "#47A8B8"
  vim.g.terminal_color_7     = "#7154FD"
  vim.g.terminal_color_15 = "#1BC290"
end

M.setup()
return M
