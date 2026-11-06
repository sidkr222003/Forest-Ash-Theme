# Forest Ash Theme - How Each Feature Works

This document explains how each major Forest Ash feature works under the hood, plus the related command or setting.

## Theme Studio

Theme Studio loads built-in and saved custom theme JSON into a nonce-protected
sidebar webview. Color controls update a local preview immediately; saving
passes the validated theme through the existing custom-theme registration path.
Presets, color-blind simulations, and reduced-glare mode transform colors before
the same validation and save flow. WCAG metrics are calculated for editor text,
comments, keywords, selections, and diagnostics.

While editing, Studio writes only a theme-scoped entry to
`workbench.colorCustomizations`, `editor.tokenColorCustomizations`, and
`editor.semanticTokenColorCustomizations`. Writes are coalesced during color
dragging. The first write snapshots the user's existing customization objects;
Discard restores that snapshot, while Remove All Overrides provides a panic
reset. Up to 200 document states are retained for undo/redo and the current
working document is autosaved in extension global state.

Controls:
- Command: Forest Ash: Open Theme Studio
- Commands: Discard Theme Studio Changes, Remove Theme Studio Overrides
- Commands: Import Palette, Export Custom Themes in Batch, Accessibility Report
- Settings: forestAsh.reducedGlare.enabled, forestAsh.workspaceThemes.enabled

## Backup, Restore, and Workspace Themes

Backups are versioned JSON documents containing custom themes, favorites,
recent-theme history, workspace mappings, and Forest Ash settings. Restore
validates the complete payload before writing and rolls back global metadata if
an import fails. Workspace mappings use workspace or folder URIs and are
applied through `workbench.colorTheme` when the workspace activates.

## Focus Mode / Zen Palette

How it works:
- The extension uses the document symbol provider to find the smallest function or class block around the cursor.
- Everything outside that block is dimmed using editor decorations with reduced opacity.
- A few editor colors are softened (CodeLens, inactive selection, line numbers, whitespace) via workbench color customizations.

Controls:
- Command: Forest Ash: Toggle Focus Mode
- Settings: forestAsh.focusMode.enabled, forestAsh.focusMode.dimOpacity

## Circadian Auto-Switching

How it works:
- The extension reads day/night theme names and start times from settings.
- It computes the current time in the configured timezone and determines day vs night.
- If the active theme is not the correct one, it updates workbench.colorTheme.
- A timer re-checks on a fixed interval.

Controls:
- Command: Forest Ash: Apply Circadian Theme Now
- Settings: forestAsh.circadian.*

## Language-Specific Accent Overrides

How it works:
- You map language IDs to accent hex colors in settings.
- The extension writes language-scoped editor.tokenColorCustomizations textMate rules.
- These rules override common token scopes like keywords, functions, types, strings, and numbers for that language only.

Controls:
- Setting: forestAsh.languageAccents

## Italic / No-Italic Mode

How it works:
- The extension scans the active Forest Ash theme for any token scopes that already use italic styles.
- It writes a single override rule to force italics on or off for those scopes.

Controls:
- Command: Forest Ash: Toggle Italic Mode
- Setting: forestAsh.italicMode.enabled

## High Contrast Boost

How it works:
- The extension reads the active Forest Ash theme colors.
- It increases contrast for non-background colors by nudging them brighter or darker until they pass a contrast target.
- It applies the same adjustment to token colors with a named override rule.

Controls:
- Command: Forest Ash: High Contrast Boost
- Setting: forestAsh.highContrast.enabled

## Theme Preview Webview

How it works:
- The extension loads each built-in Forest Ash theme JSON.
- It extracts base background, foreground, and representative syntax colors.
- It renders a webview grid with a sample code block for each theme and a one-click apply button.

Controls:
- Command: Forest Ash: Preview Themes

## Palette Inspector

How it works:
- The extension reads the active Forest Ash theme JSON.
- It lists every color token as a clickable swatch in a webview.
- Clicking a row copies the hex value to the clipboard.

Controls:
- Command: Forest Ash: Show Active Palette

## Export Palette as CSS Variables

How it works:
- The extension reads the active Forest Ash theme JSON.
- It converts every color token into a CSS variable name like --fa-editor-background.
- It writes a .css file with a :root block to your chosen path.

Controls:
- Command: Forest Ash: Export Palette as CSS

## Custom Theme Sharing (Import / Export)

How it works:
- Export: The extension copies a generated custom theme JSON file to a user selected path.
- Import: The extension reads a JSON file, validates required fields, and stores it as a new custom theme file.
- It updates package.json so the imported theme appears in the native theme picker after reload.
- Community sharing: The repository includes a share folder for PR-based submissions.

Controls:
- Commands: Forest Ash: Export Custom Theme, Forest Ash: Import Custom Theme

## Theme of the Week

The weekly pick is rendered in a dedicated editor-area WebviewPanel, not in the
Theme Preview sidebar. It takes focus when opened, uses the full available
workspace area for the polished spotlight card, and can be dismissed without
changing the active editor. Applying a theme, copying a swatch, and generating a
custom theme are handled by the extension host.

How it works:
- Once per week, the extension picks a random built-in theme and shows a short mood description.
- It stores the last shown theme and timestamp in global state to avoid repeat prompts.
- The webview includes a one-click apply button.

Controls:
- Command: Forest Ash: Theme of the Week
- Setting: forestAsh.themeOfWeek.enabled

## Web Compatibility

How it works:
- The web entry point registers the same commands, but advanced features show a desktop-only message.
- This keeps the extension compatible with vscode.dev while avoiding Node.js APIs.

Controls:
- No settings needed. Desktop-only commands will show a friendly notice on web.
