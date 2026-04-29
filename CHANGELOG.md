# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2026-04-10

- Completed theme generator overhaul: Achieved 100% color key (344) and token scope (84) parity with static themes.
- Added missing scopes including `meta.function-call` and `entity.name.interface`.
- Fixed `termRed` destructuring and ensured generated themes produce valid JSON that loads successfully in VS Code.
- Updated package version to 1.3.0 and prepared vsix packaging.

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

