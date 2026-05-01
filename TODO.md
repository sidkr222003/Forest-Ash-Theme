# Web Extension Support Implementation

## Plan
Implement Path B (Graceful Degradation) for VS Code web extension support.

## Tasks

- [x] Create `src/extension-web.js` — Web-compatible entry point
  - `quickThemePicker`: Works with static themes only
  - Other commands: Show desktop-only friendly message
- [x] Update `package.json`
  - Add `"browser": "./src/extension-web.js"`
  - Add `"when": "!isWeb"` to commandPalette entries
- [x] Verify `.vscodeignore` doesn't exclude web extension file
- [x] Test that desktop functionality remains untouched

## Notes
- Desktop entry (`extension.js`) must remain unchanged
- Web entry uses only VS Code APIs, no Node.js modules
