-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#10141B",
  fg        = "#D5DFEA",
  accent    = "#8EACE2",
  ui_bg     = "#131A24",
  selection = "#334969",
  comment   = "#79889A",
  keyword   = "#C4B27E",
  string    = "#7FA3D9",
  func      = "#BED2F3",
  type      = "#9DB8E8",
  number    = "#A3BDEB",
  variable  = "#D5DFEA",
}

function M.setup()
  vim.o.background = "dark"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Aizome Dusk"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#D5DFEA", bg = "#10141B" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#D5DFEA", bg = "#131A24" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#D5DFEAcc", bg = "#10141B" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#10141B30" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#D5DFEA", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#79889A" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#334969" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#334969" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#10141B", bg = "#8EACE2" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#10141B", bg = "#C4B27E" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#8EACE2", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#D5DFEA", bg = "#1C2736" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#D5DFEA88", bg = "#131A24" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#D5DFEA88", bg = "#131A24" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#D5DFEA", bg = "#10141B" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#131A24" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#344A66" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#344A66" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#D5DFEA", bg = "#131A24" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#10141B", bg = "#8EACE2" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#131A24" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#8EACE2" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#131A24" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#79889A", bg = "#131A24" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#79889A", bg = "#131A24" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#7FA3D9" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#A3BDEB" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#BED2F3" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#BED2F3" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#A3BDEB30" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#8EACE230" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#7FA3D930" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#8EACE260" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#79889A", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#C4B27E", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#C4B27E" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#C4B27E" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#C4B27E" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#D5DFEA" })
  vim.api.nvim_set_hl(0, "String", { fg = "#7FA3D9" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#A3BDEB" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#A3BDEB" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#A3BDEB" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#D5DFEA" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#BED2F3" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#9DB8E8" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#9DB8E8" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#C4B27E" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#9DB8E8" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#A3BDEB" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#C4B27E" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#C4B27E" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#C4B27E" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#8EACE2" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#8EACE2" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#D5DFEA" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#C4B27E" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#7FA3D9", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#10141B", bg = "#8EACE2", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#7FA3D9" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#A3BDEB" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#BED2F3" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#79889A" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#7FA3D9", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#A3BDEB", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#79889A", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#C4B27E", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#7FA3D9" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#A3BDEB" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#A3BDEB" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#BED2F3" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#BED2F3" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#BED2F3" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#BED2F3" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#9DB8E8" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#9DB8E8" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#D5DFEA" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#D5DFEA", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#D5DFEA" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#A3BDEB" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#9DB8E8" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#D5DFEA" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#D5DFEA" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#C4B27E" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#D5DFEA" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#D5DFEA" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#17202B"
  vim.g.terminal_color_8 = "#4F565E"
  vim.g.terminal_color_1     = "#C98695"
  vim.g.terminal_color_9 = "#D5A1AC"
  vim.g.terminal_color_2     = "#90BEA7"
  vim.g.terminal_color_10 = "#A8CCBA"
  vim.g.terminal_color_3     = "#C4B27E"
  vim.g.terminal_color_11 = "#D1C39A"
  vim.g.terminal_color_4     = "#7EA6D8"
  vim.g.terminal_color_12 = "#9ABAE1"
  vim.g.terminal_color_5     = "#A693D4"
  vim.g.terminal_color_13 = "#BAABDD"
  vim.g.terminal_color_6     = "#80C1D1"
  vim.g.terminal_color_14 = "#9CCFDB"
  vim.g.terminal_color_7     = "#D5DFEA"
  vim.g.terminal_color_15 = "#D8E2EC"
end

M.setup()
return M
