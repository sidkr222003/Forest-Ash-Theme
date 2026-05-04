# Changelog

All notable changes to this project will be documented in this file.

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
