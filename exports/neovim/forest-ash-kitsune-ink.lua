-- Forest Ash Theme — Neovim/Vim Lua Colorscheme
-- Generated: 2026-07-19
-- Usage: place in ~/.config/nvim/colors/forest-ash.lua
--        then add  vim.cmd("colorscheme forest-ash")  to your init.lua
-- Compatible with: Neovim 0.8+, Vim 9+ (via vim.api shim)

local M = {}

M.colors = {
  bg        = "#141313",
  fg        = "#DED8D2",
  accent    = "#D9A57B",
  ui_bg     = "#181513",
  selection = "#5A4031",
  comment   = "#8D837B",
  keyword   = "#C9AC73",
  string    = "#D4A57D",
  func      = "#8FB4D8",
  type      = "#9BC6AE",
  number    = "#E0B78F",
  variable  = "#DED8D2",
}

function M.setup()
  vim.o.background = "dark"
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end
  vim.g.colors_name = "Forest Ash Kitsune Ink"

  -- ── Highlights ─────────────────────────────────────────────────────────────
  vim.api.nvim_set_hl(0, "Normal", { fg = "#DED8D2", bg = "#141313" })
  vim.api.nvim_set_hl(0, "NormalFloat", { fg = "#DED8D2", bg = "#181513" })
  vim.api.nvim_set_hl(0, "NormalNC", { fg = "#DED8D2cc", bg = "#141313" })
  vim.api.nvim_set_hl(0, "CursorLine", { bg = "#14131330" })
  vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#DED8D2", bold = true })
  vim.api.nvim_set_hl(0, "LineNr", { fg = "#8D837B" })
  vim.api.nvim_set_hl(0, "Visual", { bg = "#5A4031" })
  vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#5A4031" })
  vim.api.nvim_set_hl(0, "Search", { fg = "#141313", bg = "#D9A57B" })
  vim.api.nvim_set_hl(0, "IncSearch", { fg = "#141313", bg = "#C9AC73" })
  vim.api.nvim_set_hl(0, "MatchParen", { fg = "#D9A57B", bold = true })
  vim.api.nvim_set_hl(0, "StatusLine", { fg = "#DED8D2", bg = "#241E1A" })
  vim.api.nvim_set_hl(0, "StatusLineNC", { fg = "#DED8D288", bg = "#181513" })
  vim.api.nvim_set_hl(0, "TabLine", { fg = "#DED8D288", bg = "#181513" })
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = "#DED8D2", bg = "#141313" })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = "#181513" })
  vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#483A30" })
  vim.api.nvim_set_hl(0, "VertSplit", { fg = "#483A30" })
  vim.api.nvim_set_hl(0, "Pmenu", { fg = "#DED8D2", bg = "#181513" })
  vim.api.nvim_set_hl(0, "PmenuSel", { fg = "#141313", bg = "#D9A57B" })
  vim.api.nvim_set_hl(0, "PmenuSbar", { bg = "#181513" })
  vim.api.nvim_set_hl(0, "PmenuThumb", { bg = "#D9A57B" })
  vim.api.nvim_set_hl(0, "SignColumn", { bg = "#181513" })
  vim.api.nvim_set_hl(0, "FoldColumn", { fg = "#8D837B", bg = "#181513" })
  vim.api.nvim_set_hl(0, "Folded", { fg = "#8D837B", bg = "#181513" })
  vim.api.nvim_set_hl(0, "ErrorMsg", { fg = "#D4A57D" })
  vim.api.nvim_set_hl(0, "WarningMsg", { fg = "#E0B78F" })
  vim.api.nvim_set_hl(0, "Question", { fg = "#8FB4D8" })
  vim.api.nvim_set_hl(0, "MoreMsg", { fg = "#8FB4D8" })
  vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#E0B78F30" })
  vim.api.nvim_set_hl(0, "DiffChange", { bg = "#D9A57B30" })
  vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#D4A57D30" })
  vim.api.nvim_set_hl(0, "DiffText", { bg = "#D9A57B60" })
  vim.api.nvim_set_hl(0, "Comment", { fg = "#8D837B", italic = true })
  vim.api.nvim_set_hl(0, "Keyword", { fg = "#C9AC73", bold = true })
  vim.api.nvim_set_hl(0, "Statement", { fg = "#C9AC73" })
  vim.api.nvim_set_hl(0, "Conditional", { fg = "#C9AC73" })
  vim.api.nvim_set_hl(0, "Repeat", { fg = "#C9AC73" })
  vim.api.nvim_set_hl(0, "Operator", { fg = "#DED8D2" })
  vim.api.nvim_set_hl(0, "String", { fg = "#D4A57D" })
  vim.api.nvim_set_hl(0, "Number", { fg = "#E0B78F" })
  vim.api.nvim_set_hl(0, "Float", { fg = "#E0B78F" })
  vim.api.nvim_set_hl(0, "Boolean", { fg = "#E0B78F" })
  vim.api.nvim_set_hl(0, "Identifier", { fg = "#DED8D2" })
  vim.api.nvim_set_hl(0, "Function", { fg = "#8FB4D8" })
  vim.api.nvim_set_hl(0, "Type", { fg = "#9BC6AE" })
  vim.api.nvim_set_hl(0, "TypeDef", { fg = "#9BC6AE" })
  vim.api.nvim_set_hl(0, "StorageClass", { fg = "#C9AC73" })
  vim.api.nvim_set_hl(0, "Structure", { fg = "#9BC6AE" })
  vim.api.nvim_set_hl(0, "Constant", { fg = "#E0B78F" })
  vim.api.nvim_set_hl(0, "PreProc", { fg = "#C9AC73" })
  vim.api.nvim_set_hl(0, "Include", { fg = "#C9AC73" })
  vim.api.nvim_set_hl(0, "Define", { fg = "#C9AC73" })
  vim.api.nvim_set_hl(0, "Macro", { fg = "#D9A57B" })
  vim.api.nvim_set_hl(0, "Special", { fg = "#D9A57B" })
  vim.api.nvim_set_hl(0, "Delimiter", { fg = "#DED8D2" })
  vim.api.nvim_set_hl(0, "Tag", { fg = "#C9AC73" })
  vim.api.nvim_set_hl(0, "Error", { fg = "#D4A57D", bold = true })
  vim.api.nvim_set_hl(0, "Todo", { fg = "#141313", bg = "#D9A57B", bold = true })
  vim.api.nvim_set_hl(0, "DiagnosticError", { fg = "#D4A57D" })
  vim.api.nvim_set_hl(0, "DiagnosticWarn", { fg = "#E0B78F" })
  vim.api.nvim_set_hl(0, "DiagnosticInfo", { fg = "#8FB4D8" })
  vim.api.nvim_set_hl(0, "DiagnosticHint", { fg = "#8D837B" })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { sp = "#D4A57D", underline = true })
  vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { sp = "#E0B78F", underline = true })
  vim.api.nvim_set_hl(0, "@comment", { fg = "#8D837B", italic = true })
  vim.api.nvim_set_hl(0, "@keyword", { fg = "#C9AC73", bold = true })
  vim.api.nvim_set_hl(0, "@string", { fg = "#D4A57D" })
  vim.api.nvim_set_hl(0, "@number", { fg = "#E0B78F" })
  vim.api.nvim_set_hl(0, "@float", { fg = "#E0B78F" })
  vim.api.nvim_set_hl(0, "@function", { fg = "#8FB4D8" })
  vim.api.nvim_set_hl(0, "@function.call", { fg = "#8FB4D8" })
  vim.api.nvim_set_hl(0, "@method", { fg = "#8FB4D8" })
  vim.api.nvim_set_hl(0, "@method.call", { fg = "#8FB4D8" })
  vim.api.nvim_set_hl(0, "@type", { fg = "#9BC6AE" })
  vim.api.nvim_set_hl(0, "@type.builtin", { fg = "#9BC6AE" })
  vim.api.nvim_set_hl(0, "@variable", { fg = "#DED8D2" })
  vim.api.nvim_set_hl(0, "@parameter", { fg = "#DED8D2", italic = true })
  vim.api.nvim_set_hl(0, "@property", { fg = "#DED8D2" })
  vim.api.nvim_set_hl(0, "@constant", { fg = "#E0B78F" })
  vim.api.nvim_set_hl(0, "@constructor", { fg = "#9BC6AE" })
  vim.api.nvim_set_hl(0, "@punctuation.bracket", { fg = "#DED8D2" })
  vim.api.nvim_set_hl(0, "@punctuation.delimiter", { fg = "#DED8D2" })
  vim.api.nvim_set_hl(0, "@tag", { fg = "#C9AC73" })
  vim.api.nvim_set_hl(0, "@tag.attribute", { fg = "#DED8D2" })
  vim.api.nvim_set_hl(0, "@tag.delimiter", { fg = "#DED8D2" })

  -- ── Terminal colors ────────────────────────────────────────────────────────
  vim.g.terminal_color_0     = "#1F1A17"
  vim.g.terminal_color_8 = "#55514F"
  vim.g.terminal_color_1     = "#C98872"
  vim.g.terminal_color_9 = "#D5A291"
  vim.g.terminal_color_2     = "#A9C18A"
  vim.g.terminal_color_10 = "#BCCFA4"
  vim.g.terminal_color_3     = "#C9AC73"
  vim.g.terminal_color_11 = "#D5BE92"
  vim.g.terminal_color_4     = "#8AA6BC"
  vim.g.terminal_color_12 = "#A4BACB"
  vim.g.terminal_color_5     = "#B28BBE"
  vim.g.terminal_color_13 = "#C3A5CC"
  vim.g.terminal_color_6     = "#8BBFBE"
  vim.g.terminal_color_14 = "#A5CDCC"
  vim.g.terminal_color_7     = "#DED8D2"
  vim.g.terminal_color_15 = "#E1DBD6"
end

M.setup()
return M
