# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2026-04-10

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

