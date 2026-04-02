# Forest Ash Theme (VS Code)

A curated set of dark and light, eye-friendly themes for Visual Studio Code, inspired by forest ash textures and anime mood boards. Each palette is designed for readability across long coding sessions.

![Forest Ash Theme preview](Preview.png)

## Theme Collection

This extension now includes 21 themes:

### Dark Palette Sheet

![Forest Ash dark palettes](dark.png)

#### Dark Themes Name
1. Forest Ash
2. Forest Ash Yoru Paper
3. Forest Ash Sumi Moon
4. Forest Ash Kitsune Ink
5. Forest Ash Shoji Night
6. Forest Ash Aizome Dusk
7. Forest Ash Ronin Lantern
8. Forest Ash Bamboo Midnight
9. Forest Ash Nebula Manga
10. Forest Ash Sakura Charcoal
11. Forest Ash Kage Washi


### Light Palette Sheet

![Forest Ash light palettes](light.png)

#### Light Themes Name

12. Forest Ash Yoru Paper Light
13. Forest Ash Sumi Moon Light
14. Forest Ash Kitsune Ink Light
15. Forest Ash Shoji Night Light
16. Forest Ash Aizome Dusk Light
17. Forest Ash Ronin Lantern Light
18. Forest Ash Bamboo Midnight Light
19. Forest Ash Nebula Manga Light
20. Forest Ash Sakura Charcoal Light
21. Forest Ash Kage Washi Light

## Design Goals

- Dark and low-glare backgrounds for reduced eye fatigue
- Calm, desaturated accents with anime-inspired mood
- Distinct identity per theme without harsh neon contrast
- Balanced syntax tokens for comments, strings, keywords, and functions
- Clean terminal ANSI colors that match each palette

## Package Metadata

- `name`: `forest-ash-theme-vscode`
- `displayName`: `Forest Ash Theme`
- `publisher`: `NK2552003`
- `version`: `1.2.7`
- `engines.vscode`: `^1.70.0`

## Install

### Marketplace
1. Open VS Code.
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`).
3. Search for `Forest Ash Theme`.
4. Install and switch via `Preferences: Color Theme`.

### Local Source
1. Clone this repository.
2. Run `npm install`.
3. Run `npm run package` (requires `vsce`).
4. Install the generated `.vsix` in VS Code (`Extensions` > `...` > `Install from VSIX`).

## Development

- Build package: `npm run package`
- Publish package: `npm run publish`
- Prepublish guard: `npm run prepublishOnly`

## Repository Structure

- `package.json` - extension manifest and scripts
- `themes/` - all contributed color theme JSON files
- `README.md` - documentation and theme catalog

## License

MIT
