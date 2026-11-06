# Changelog

All notable changes to this project will be documented in this file.

## [1.5.3] - 2026-11-06

### New Features

- Theme Studio now applies scoped workbench, TextMate, and semantic-token
  overrides live while editing, with throttled updates and a visible live
  status indicator.
- Completely redesigned the Theme of the Week experience with a spacious
  editor-area spotlight layout, stronger visual hierarchy, responsive palette
  cards, richer editor preview, and clearer primary actions.
- Added TextMate token editing, semantic highlighting toggle, bounded undo/redo,
  autosave snapshots, discard, and panic removal of all Studio overrides.
- Added Theme Studio with live color editing, syntax previews, presets, search
  and filters, favorites, recent themes, contrast reporting, simulations, and
  reduced-glare mode.
- Added palette import, batch custom-theme export, complete backup/restore, and
  workspace-specific theme mappings.
- Theme of the Week now opens as a focused, dismissible editor-area overlay
  panel instead of rendering inside the Theme Preview sidebar.
- Weekly recommendations include saved custom themes as well as built-in
  palettes.
- Added a direct **Generate Custom Theme** action to the weekly spotlight.

### Bug Fixes

- Theme generation now remembers the last accent color and uses the configured
  default variant when opening the generator.
- Custom theme names are checked case-insensitively and limited to a safe,
  readable length.
- Custom theme registration writes are awaited so a failed package update is
  reported instead of appearing to succeed.
- Weekly palette swatches can now be copied to the clipboard.

### Documentation

- Updated the Theme of the Week and custom generation documentation.

## [1.5.2] - 2026-09-07

### Changed

- Bumped the extension and package metadata version to `1.5.2`.
- Updated current version references in the README and extension entry points as
  part of this pull request.
- Adds Helix editor (.toml) as a new export target in the multi-tool export engine. Users can export Forest Ash themes to ~/.config/helix/ themes/ and activate via config.toml.


## [1.5.0] - 2026-07-19

### New Features

#### Multi-Tool Export Engine (`src/themeExporter.js`)
- **`Forest Ash: Export Theme for External Tool`** — Step-by-step wizard to export any Forest Ash palette to 9 external editors and terminals: JetBrains IDEs (`.icls`), Neovim/Vim (`.lua`), Sublime Text (`.tmTheme`), Windows Terminal (`fragment.json`), iTerm2 (`.itermcolors`), Alacritty (`.toml`), Zed (`.json`), tmux (`.conf`), and Warp Terminal (`.yaml`).
- **`Forest Ash: Export All Themes for External Tool`** — Batch-exports all 21 built-in themes for a chosen tool into a folder in one step. Includes a progress notification.
- New `src/themeExporter.js` — pure, dependency-free export engine. No VS Code imports; all format renders are plain string templates.

#### Custom Theme Management
- **`Forest Ash: Rename Custom Theme`** — Rename a saved custom theme (updates the JSON name field, `package.json` entry, and global state atomically).
- **`Forest Ash: Duplicate Custom Theme`** — Clone a custom theme to a new name (copies the JSON file and creates an independent entry).

#### Discovery
- **`Forest Ash: Surprise Me (Random Theme)`** — Instantly applies a random Forest Ash theme (built-in or custom), excluding the currently active one. Shows the mood description in the notification.

#### Export
- **`Forest Ash: Export Palette as SCSS`** — Exports the active palette as SCSS variables (`$fa-*`) with a companion `:root {}` CSS custom properties block.

### Bug Fixes

- **Status bar swatch** — The `forestAsh.showSwatchInStatusBar` setting existed in configuration since v1.3 but was never wired to an actual status bar item. Now implemented: when any Forest Ash theme is active, a `$(symbol-color) <theme-name>` item appears in the right status bar. Clicking it opens the Quick Theme Picker. The item updates automatically when you switch themes.
- **Quick Picker mood descriptions** — The `THEME_MOODS` map was populated but never used in `cmdQuickThemePicker`. All 21 built-in themes now show their atmospheric mood in the `detail` line of the Quick Pick dropdown.
- **Focus Mode debounce flicker** — Reduced `scheduleFocusUpdate` delay from 120ms to 80ms to eliminate the brief visible line-number flicker on cursor movement.
- **`patchPackageJson` race condition** — Concurrent calls (e.g., from `generate` + `syncOnActivation` running simultaneously) could produce a partially written or corrupt `package.json`. Writes are now serialised through a `pkgWriteLock` promise chain.
- **Web extension Quick Picker** — Dark/light description fixed from raw `vs-dark`/`vs` strings to human-readable `$(moon) Dark` / `$(sun) Light` labels.

### Changed

- `package.json` version bumped to `1.5.0`.
- `description` in `package.json` updated to mention multi-tool export and all supported tools.
- `keywords` extended with: `jetbrains`, `neovim`, `vim`, `sublime`, `iterm2`, `alacritty`, `zed`, `warp`, `tmux`, `windows-terminal`.
- New setting `forestAsh.multiToolExport.lastTool` added (stores last used export target for future pre-selection UX).
- All new commands registered in both desktop (`extension.js`) and web (`extension-web.js`) entry points.

### Internal

- `src/extension-web.js` refactored to use one-liner stubs for all commands (reduces file length while maintaining full parity).

## [1.4.0] - 2026-05-18


### High Impact Features

- Added Focus Mode with Zen palette overrides and active-block dimming.
- Added Circadian auto-switching between day/night themes with timezone support.
- Added per-language accent overrides through `forestAsh.languageAccents`.
- Added Italic Mode toggle and High Contrast Boost commands.
- Added Theme Preview and Palette Inspector webviews.
- Added custom theme import/export plus CSS palette export.
- Added Theme of the Week welcome panel with weekly cadence.
- Added vscode.dev compatibility metadata and sponsor badges.

### Changed

#### Updated the `themegenerator.js`
  - All harmony math now lives in OKLCh (uniform hue spacing, no hue warp)
  - Gamut clamping on every synthetic color (binary search on chroma)
  - APCA contrast checking alongside WCAG for modern accessibility
  - ColorDNA: 20+ perceptual properties derived from the base color
  - Hue-family detection: 12-zone wheel (red/orange/amber/yellow/chartreuse/green/teal/cyan/blue/indigo/violet/magenta)
  - Psychological temperature profile (warm/neutral/cool + exact K estimate)
  - Semantic target locking: functions are always "action", types are always "identity", string are always "content" — mapped to color families that carry those meanings cross-culturally
  - Chromatic adaptation for muted inputs: even near-grey inputs produce readable, harmonious themes rather than washed-out ones
  - Light-theme specific chroma boosts and lightness calibration
  - Terminal ANSI tinting refined with perceptual blending

## [1.3.6] - 2026-05-04

This. uppdate only contains some bug fixes and doucmentation updates

## [1.3.5] - 2026-05-01

### Web Extension Support

The extension now works in VS Code for the Web (vscode.dev) with graceful
degradation for features that require filesystem access.

- Added `src/extension-web.js` as a browser-compatible entry point that uses
  only VS Code APIs — no Node.js `fs`, `path`, or `__dirname` dependencies.
- `Forest Ash: Quick Theme Picker` is fully functional in the web, allowing
  users to switch between all 21 built-in static themes.
- Desktop-only commands (`Generate Custom Theme`, `Apply Custom Theme`,
  `Delete Custom Theme`, `List Saved Custom Themes`) are hidden from the
  Command Palette in web contexts and show a friendly desktop-only message
  if triggered.
- Added `"browser"` field to `package.json` pointing to the web entry point.
- Added `"when": "!isWeb"` context clauses to menus so unavailable commands
  are not shown in `vscode.dev`.

## [1.3.0] - 2026-04-29

### New Feature: Single-Hex Custom Theme Generator

You can now generate a fully personalized VS Code theme from a single hex color.
Provide any hex color as your accent, and the generator derives a complete,
cohesive palette — covering all 344 color keys and 84 token scopes — in both
dark and light variants.

### Generator Overhaul

- Rebuilt the theme generator to achieve 100% parity with hand-crafted static
  themes across all 344 color keys and 84 token scopes.
- Added previously missing token scopes including `meta.function-call` and
  `entity.name.interface`.
- Fixed `termRed` destructuring bug that caused invalid JSON output in generated
  themes.
- Generated themes now load successfully in VS Code without errors.

### Packaging

- Updated package version to 1.3.0.
- Prepared and validated `.vsix` packaging for Marketplace release.
  
## [1.2.7] - 2026-03-22

- Updated color tokens and semantic highlighting across the Forest Ash theme set (dark and light variants) for improved readability and consistency.
- Refined UI color mappings in multiple theme files, including links, keyword accents, widget shadows, terminal colors, and diagnostics-related tokens.
- Added CI/CD release automation via GitHub Actions to detect version bumps, create tags, and publish releases automatically.
- Added automated changelog integration so version-specific changelog notes are included in GitHub release descriptions.

## [1.2.6] - 2026-02-14

- Tuned theme contrast and semantic token rendering for better consistency across VS Code and editor color modes.
- Improved highlight styling for markdown headings, bracket pairs, and inline code blocks.
- Polished terminal ANSI colors and fixed color drift in the light variants.

## [1.2.5] - 2026-01-09

- Added refreshed palette adjustments for Sakura Charcoal and Yoru Paper themes.
- Fixed custom theme generation edge cases for low-saturation accent colors.
- Resolved theme activation issues on VS Code stable releases near 1.74.
