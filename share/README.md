# Community Theme Sharing

Drop shared Forest Ash custom theme JSON files in this folder and open a pull request.

Guidelines:
- File name: forest-ash-<theme-name>.json
- Include both "colors" and "tokenColors" sections.
- Add a short description in your PR (mood, palette intent, and dark/light).
- Validate the JSON with `npm test` before submitting.
- Palette sources may be JSON, CSS custom properties, SCSS variables, or
  Tailwind-style color variables; imported colors must be hex or rgb/rgba.
