# Forest Ash Theme (VS Code)

A curated set of dark and light, eye-friendly themes for Visual Studio Code, inspired by forest ash textures and anime mood boards. Each palette is designed for readability across long coding sessions.

**New in v1.3.0**: Custom accent color picker, WCAG high contrast variants, and enhanced accessibility options.

![Forest Ash Theme preview](Preview.png)

## Features

### 🎨 Custom Accent Color Picker (Issue #11)

Customize the primary accent color across all themes. Access via command palette:
- **Forest Ash: Pick Accent Color** - Choose from preset accent colors
- **Forest Ash: Custom Accent Color** - Enter a custom hex, RGB, or HSL color
- **Forest Ash: Revert Accent Color** - Reset to default accent color
- **Forest Ash: Export Accent Color** - Copy your custom color to clipboard

All syntax highlighting, selections, tab highlights, and UI elements automatically update with your chosen accent color.

**Supported color formats:**
- Hex: `#A8D8EA`
- RGB: `rgb(168, 216, 234)`
- HSL: `hsl(180, 70%, 79%)`

### 🎭 Mood-Based Theme Switching (Issue #1)

Switch between four mood-based theme variants to match your current mood:
- **Happy** - Bright, vibrant, energetic palette
- **Focused** - Neutral, calming palette with high contrast
- **Tired** - Warm, relaxing palette with softer tones
- **Creative** - Dynamic, artistic palette with accent variations

**Commands:**
- **Forest Ash: Switch Mood** - Select your current mood
- **Forest Ash: Toggle Mood-Based Theming** - Enable/disable mood theming

**Settings:**
- `forestAshTheme.enableMoodTheming` - Enable mood variants (disabled by default)
- `forestAshTheme.currentMood` - Choose: happy, focused, tired, creative

### 🗣️ Active File Language Auto-Theming (Issue #9)

Automatically apply subtle accent color shifts based on the programming language of your active file. Provides visual language identification without switching themes.

**Supported Languages & Colors:**
- TypeScript/JavaScript: Blue
- Python: Green
- Rust: Orange
- Go: Cyan
- Java: Red
- C/C++: Purple
- CSS/SCSS: Pink
- HTML: Orange-red
- JSON/YAML: Gray-blue
- SQL: Teal
- And more...

**Commands:**
- **Forest Ash: Toggle Language Auto-Theme** - Enable/disable language-based coloring
- **Forest Ash: Customize Language Accent Intensity** - Adjust color intensity (0.0-1.0)

**Settings:**
- `forestAshTheme.enableLanguageAutoTheme` - Enable language theming (disabled by default)
- `forestAshTheme.languageAccentIntensity` - Intensity of accent (default: 0.3)

### 👨‍💻 Developer Persona Presets (Issue #10)

Choose a developer persona to customize syntax highlighting and color philosophy for your coding style:

1. **Hacker** - High contrast, neon accents
   - Recommended: Nebula Manga, Kitsune Ink
   
2. **Designer** - Refined palette, balanced aesthetics
   - Recommended: Yoru Paper, Sakura Charcoal
   
3. **Data Scientist** - Color-blind friendly, semantic colors
   - Recommended: Aizome Dusk, Sumi Moon
   
4. **Minimalist** - Grayscale with single accent
   - Recommended: Sumi Moon, Shoji Night
   
5. **Artistic** - Vibrant, expressive colors
   - Recommended: Ronin Lantern, Bamboo Midnight

**Commands:**
- **Forest Ash: Apply Developer Persona** - Select your persona
- **Forest Ash: Show Persona Recommendations** - Learn about each persona

**Settings:**
- `forestAshTheme.developerPersona` - Choose: hacker, designer, datascientist, minimalist, artistic

### ♿ WCAG High Contrast Variants (Issue #13)

All 21 Forest Ash themes now include WCAG AAA compliant high-contrast variants for enhanced accessibility:
- **Enhanced contrast ratios** for readability
- **Color blindness safe** palettes (deuteranopia, protanopia, tritanopia)
- **Optimized for low-vision users**

Available as separate theme options:
- Forest Ash (WCAG High Contrast)
- Forest Ash Yoru Paper (WCAG High Contrast)
- ... and all other variants with "(WCAG High Contrast)" suffix

**Total themes available: 42** (21 original + 21 WCAG variants)

### Configuration

Edit workspace or user settings to configure all features:

```json
{
  "forestAshTheme.customAccentColor": "#A8D8EA",
  "forestAshTheme.wcagHighContrast": false,
  "forestAshTheme.enableMoodTheming": false,
  "forestAshTheme.currentMood": "focused",
  "forestAshTheme.enableLanguageAutoTheme": false,
  "forestAshTheme.languageAccentIntensity": 0.3,
  "forestAshTheme.developerPersona": null
}
```

**Note:** All new features are **disabled by default**. Enable via command palette or settings as needed.

**Feature Status Bar Indicators:**
- Language indicator: Shows when language auto-theming is active
- Mood indicator: Shows current mood when mood theming is enabled

## Theme Collection

This extension now includes 42 themes:

### Original Themes (21)

#### Dark Themes (11)
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

#### Light Themes (10)
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

### WCAG High Contrast Variants (21)
All themes also available with "(WCAG High Contrast)" suffix for enhanced accessibility compliance.

### Dark Palette Sheet

![Forest Ash dark palettes](dark.png)

### Light Palette Sheet

![Forest Ash light palettes](light.png)

## Design Goals

- Dark and low-glare backgrounds for reduced eye fatigue
- Calm, desaturated accents with anime-inspired mood
- Distinct identity per theme without harsh neon contrast
- Balanced syntax tokens for comments, strings, keywords, and functions
- Clean terminal ANSI colors that match each palette
- WCAG accessibility compliance for all variants
- Customizable accent colors for personalization

## Package Metadata

- `name`: `forest-ash-theme`
- `displayName`: `Forest Ash Theme`
- `publisher`: `NK2552003`
- `version`: `1.3.0`
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

## Usage

### Enable Custom Accent Color

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Search for **"Forest Ash: Pick Accent Color"** or **"Forest Ash: Custom Accent Color"**
3. Select your preferred color
4. Reload VS Code when prompted

### Enable WCAG High Contrast

1. Open VS Code Settings
2. Search for **"Forest Ash Theme"**
3. Check **"Wcag High Contrast"** or use command: **"Forest Ash: Toggle WCAG High Contrast"**
4. Reload VS Code to apply

### Using WCAG Variants Directly

Simply select any theme with **(WCAG High Contrast)** suffix from the Color Theme selector.

## Development

- Build package: `npm run package`
- Publish package: `npm run publish`
- Generate WCAG variants: `node wcagThemeGenerator.js`
- Prepublish guard: `npm run prepublishOnly`

## Repository Structure

- `package.json` - extension manifest, commands, and settings
- `extension.js` - VS Code extension main entry point
- `colorUtils.js` - color manipulation utilities
- `wcagThemeGenerator.js` - WCAG high-contrast theme generator
- `themes/` - all contributed color theme JSON files (original + WCAG variants)
- `README.md` - documentation and theme catalog

## Accessibility

This theme extension includes comprehensive accessibility features:

- **WCAG AAA Compliance**: High contrast variants meet AAA contrast ratio standards
- **Color Blindness Testing**: Optimized for different types of color blindness
- **Customizable Colors**: Adapt themes to your specific accessibility needs
- **Multiple Variants**: 42 total themes for different user needs and preferences

## Troubleshooting

**Q: Commands don't appear in command palette?**
A: Make sure the Forest Ash Theme extension is installed and enabled.

**Q: Custom accent color not applying?**
A: Try reloading VS Code after setting a custom color (use "Reload" button in notification).

**Q: WCAG variants look very different?**
A: This is intentional - high contrast variants prioritize accessibility compliance over aesthetics. Use original themes for standard use.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
