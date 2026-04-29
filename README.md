# Forest Ash Theme (VS Code)

A curated set of dark and light, eye-friendly themes for Visual Studio Code, inspired by forest ash textures and anime mood boards. Each palette is designed for readability across long coding sessions.

![Forest Ash Theme preview](https://raw.githubusercontent.com/sidkr222003/Forest-Ash-Theme/main/resources/Preview.png)

## Theme Collection

This extension includes 21 hand-crafted themes plus unlimited custom themes you can generate yourself.

### Dark Palette Sheet

![Forest Ash dark palettes](https://raw.githubusercontent.com/sidkr222003/Forest-Ash-Theme/main/resources/dark.png)

#### Dark Themes

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

![Forest Ash light palettes](https://raw.githubusercontent.com/sidkr222003/Forest-Ash-Theme/main/resources/light.png)

#### Light Themes

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

---

## Theme Generator

Forest Ash includes a built-in **dynamic theme generator** that creates fully unique themes from any hex accent color. Every input color — including its hue, saturation, and lightness — influences the entire generated palette, so no two colors ever produce the same theme.

### How It Works

The generator extracts all three HSL components from your chosen color:

- **Hue** → drives the base color family and split-complementary triad (keywords, strings, functions, types)
- **Saturation** → scales how vivid or muted the entire palette is
- **Lightness** → shifts tonal weight across backgrounds, foregrounds, and syntax tokens

Contrast and readability are preserved automatically for both dark and light variants.

### How to Access the Generator

| Method | Instructions |
|--------|-------------|
| **Command Palette** (Recommended) | Press `Ctrl+Shift+P` / `Cmd+Shift+P`, type `Forest Ash: Generate Custom Theme`, press `Enter`. |
| **Right-Click (Editor)** | Right-click inside any open editor tab and select **Generate Custom Theme**. |
| **VS Code Settings** | Go to `Preferences > Settings`, search **Forest Ash**, and set your default accent color and variant. |

### Generation Steps

1. Enter a hex accent color (e.g. `#4a9eff`)
2. Choose **Dark** or **Light** variant
3. Give your theme a unique name
4. VS Code will prompt you to **Reload** — after reloading, your theme appears in the native theme picker (`Cmd+K Cmd+T` / `Ctrl+K Ctrl+T`) alongside all built-in themes

### Available Commands

| Command | Description |
|---------|-------------|
| `Forest Ash: Generate Custom Theme` | Create a new theme from a hex color, variant, and name |
| `Forest Ash: Apply Custom Theme` | Quickly switch between your saved custom themes |
| `Forest Ash: Delete Custom Theme` | Permanently remove a generated theme |
| `Forest Ash: List Saved Custom Themes` | View all custom themes in a webview panel with color swatches |
| `Forest Ash: Quick Theme Picker` | Browse and apply all Forest Ash themes (built-in + custom) in one picker |

### Custom Theme Persistence

Generated themes are saved inside the extension's `themes/custom/` folder and registered in `package.json` automatically. They survive VS Code restarts and are restored silently on every activation. If a theme file goes missing (e.g. after reinstall), the extension cleans up stale metadata automatically.

> **Note:** After generating or deleting a custom theme, a window reload is required for the change to appear in VS Code's native color theme picker.

---

## Design Goals

- Dark and low-glare backgrounds for reduced eye fatigue
- Calm, desaturated accents with anime-inspired mood
- Distinct identity per theme without harsh neon contrast
- Balanced syntax tokens for comments, strings, keywords, functions, types, and punctuation
- Full semantic highlighting support
- Clean terminal ANSI colors that match each palette
- Bracket pair colorization built in

---

## Install

### Marketplace
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for `Forest Ash Theme`
4. Install and switch via `Preferences: Color Theme`

### Local Source
1. Clone this repository
2. Run `npm install`
3. Run `npm run package` (requires `vsce`)
4. Install the generated `.vsix` via `Extensions > ... > Install from VSIX`

---

## Package Metadata

| Field | Value |
|-------|-------|
| `name` | `forest-ash-theme` |
| `displayName` | `Forest Ash Theme` |
| `publisher` | `NK2552003` |
| `version` | `1.3.0` |
| `engines.vscode` | `^1.70.0` |

---

## Development

```bash
npm install          # install dependencies
npm run package      # build .vsix with vsce
npm run publish      # publish to VS Code Marketplace
```

---

## Repository Structure

```
forest-ash-theme/
├── extension.js              # extension entry point, all commands
├── package.json              # manifest, contributes.themes, commands
├── src/
│   └── themeGenerator.js     # dynamic palette + theme JSON builder
├── themes/
│   ├── *.json                # 21 hand-crafted static themes
│   └── custom/               # runtime-generated user themes (git-ignored)
│       └── .gitkeep
├── resources/
│   ├── icon.png
│   ├── Preview.png
│   ├── dark.png
│   └── light.png
└── README.md
```

---

## License

MIT