-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#0E1412",
  fg        = "#DCE5DF",
  accent    = "#94C071",
  ui_bg     = "#17201C",
  selection = "#3E6B5A",
  comment   = "#8FA79A",
  keyword   = "#D6B56C",
  string    = "#6FAF97",
  func      = "#8FC3D8",
  type      = "#9EE0BA",
  number    = "#A2D9BC",
  variable  = "#DCE5DF",
}

function M.setup()
  vim.o.background = "dark"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#DCE5DF", bg = "#0E1412" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#DCE5DF", bg = "#17201C" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#DCE5DFcc", bg = "#0E1412" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#0E141230" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#DCE5DF", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#8FA79A" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#3E6B5A" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#3E6B5A" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#0E1412", bg = "#94C071" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#0E1412", bg = "#D6B56C" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#94C071", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#DCE5DF", bg = "#282E2D" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#DCE5DF88", bg = "#17201C" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#DCE5DF88", bg = "#17201C" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#DCE5DF", bg = "#0E1412" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#17201C" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#414339" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#414339" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#DCE5DF", bg = "#17201C" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#0E1412", bg = "#94C071" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#17201C" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#94C071" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#17201C" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#8FA79A", bg = "#17201C" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#8FA79A", bg = "#17201C" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#6FAF97" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#A2D9BC" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#8FC3D8" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#8FC3D8" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#A2D9BC30" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#94C07130" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#6FAF9730" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#94C07160" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#8FA79A", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#D6B56C", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#D6B56C" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#D6B56C" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#D6B56C" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#DCE5DF" })
  vim.api.nvim_set_hl(0, "String", { fg = "#6FAF97" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#A2D9BC" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#A2D9BC" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#A2D9BC" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#DCE5DF" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#8FC3D8" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#9EE0BA" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#9EE0BA" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#D6B56C" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#9EE0BA" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#A2D9BC" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#D6B56C" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#D6B56C" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#D6B56C" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#94C071" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#94C071" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#DCE5DF" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#D6B56C" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#6FAF97", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#0E1412", bg = "#94C071", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#6FAF97" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#A2D9BC" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#8FC3D8" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#8FA79A" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#6FAF97", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#A2D9BC", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#8FA79A", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#D6B56C", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#6FAF97" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#A2D9BC" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#A2D9BC" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#8FC3D8" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#8FC3D8" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#8FC3D8" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#8FC3D8" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#9EE0BA" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#9EE0BA" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#DCE5DF" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#DCE5DF", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#DCE5DF" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#A2D9BC" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#9EE0BA" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#DCE5DF" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#DCE5DF" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#D6B56C" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#DCE5DF" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#DCE5DF" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#242424"
  vim.g.terminal_color_8 = "#424446"
  vim.g.terminal_color_1     = "#B24A4A"
  vim.g.terminal_color_9 = "#E37272"
  vim.g.terminal_color_2     = "#577341"
  vim.g.terminal_color_10 = "#BBED84"
  vim.g.terminal_color_3     = "#9A8653"
  vim.g.terminal_color_11 = "#EDC766"
  vim.g.terminal_color_4     = "#6B898A"
  vim.g.terminal_color_12 = "#94CBDA"
  vim.g.terminal_color_5     = "#6A416B"
  vim.g.terminal_color_13 = "#E47CE7"
  vim.g.terminal_color_6     = "#4E6C60"
  vim.g.terminal_color_14 = "#93DEC0"
  vim.g.terminal_color_7     = "#C7C3BC"
  vim.g.terminal_color_15 = "#E9F1E5"
end

M.setup()
return M
