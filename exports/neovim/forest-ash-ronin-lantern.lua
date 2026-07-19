-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#14110F",
  fg        = "#E2D8CF",
  accent    = "#D5A26D",
  ui_bg     = "#181411",
  selection = "#62432A",
  comment   = "#918377",
  keyword   = "#D0B277",
  string    = "#D6A46F",
  func      = "#F0C89A",
  type      = "#E7B983",
  number    = "#E5B989",
  variable  = "#E2D8CF",
}

function M.setup()
  vim.o.background = "dark"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Ronin Lantern"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#E2D8CF", bg = "#14110F" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#E2D8CF", bg = "#181411" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#E2D8CFcc", bg = "#14110F" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#14110F30" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#E2D8CF", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#918377" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#62432A" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#62432A" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#14110F", bg = "#D5A26D" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#14110F", bg = "#D0B277" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#D5A26D", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#E2D8CF", bg = "#251D18" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#E2D8CF88", bg = "#181411" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#E2D8CF88", bg = "#181411" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#E2D8CF", bg = "#14110F" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#181411" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#523D30" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#523D30" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#E2D8CF", bg = "#181411" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#14110F", bg = "#D5A26D" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#181411" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#D5A26D" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#181411" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#918377", bg = "#181411" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#918377", bg = "#181411" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#D6A46F" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#E5B989" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#F0C89A" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#F0C89A" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#E5B98930" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#D5A26D30" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#D6A46F30" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#D5A26D60" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#918377", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#D0B277", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#D0B277" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#D0B277" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#D0B277" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#E2D8CF" })
  vim.api.nvim_set_hl(0, "String", { fg = "#D6A46F" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#E5B989" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#E5B989" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#E5B989" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#E2D8CF" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#F0C89A" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#E7B983" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#E7B983" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#D0B277" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#E7B983" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#E5B989" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#D0B277" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#D0B277" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#D0B277" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#D5A26D" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#D5A26D" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#E2D8CF" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#D0B277" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#D6A46F", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#14110F", bg = "#D5A26D", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#D6A46F" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#E5B989" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#F0C89A" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#918377" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#D6A46F", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#E5B989", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#918377", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#D0B277", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#D6A46F" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#E5B989" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#E5B989" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#F0C89A" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#F0C89A" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#F0C89A" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#F0C89A" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#E7B983" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#E7B983" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#E2D8CF" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#E2D8CF", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#E2D8CF" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#E5B989" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#E7B983" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#E2D8CF" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#E2D8CF" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#D0B277" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#E2D8CF" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#E2D8CF" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#211A16"
  vim.g.terminal_color_8 = "#56514E"
  vim.g.terminal_color_1     = "#D18A77"
  vim.g.terminal_color_9 = "#DBA495"
  vim.g.terminal_color_2     = "#A8C190"
  vim.g.terminal_color_10 = "#BBCFA8"
  vim.g.terminal_color_3     = "#D0B277"
  vim.g.terminal_color_11 = "#DAC395"
  vim.g.terminal_color_4     = "#8EA8C6"
  vim.g.terminal_color_12 = "#A7BBD3"
  vim.g.terminal_color_5     = "#B897CF"
  vim.g.terminal_color_13 = "#C8AEDA"
  vim.g.terminal_color_6     = "#90C7C1"
  vim.g.terminal_color_14 = "#A8D3CF"
  vim.g.terminal_color_7     = "#E2D8CF"
  vim.g.terminal_color_15 = "#E4DBD3"
end

M.setup()
return M
