const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const languageAutoTheme = require('./languageAutoTheme');
const personaPresets = require('./personaPresets');

// Store for custom states
let accentColorStore = {};
let currentLanguage = null;
let languageStatusBar = null;
let moodStatusBar = null;

function activate(context) {
	console.log('Forest Ash Theme extension activated');

	// Initialize status bars
	languageStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	languageStatusBar.text = '$(file-code) Language Theme: Off';
	languageStatusBar.tooltip = 'Language-based accent coloring is disabled';
	
	moodStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
	moodStatusBar.text = '$(smiley) Mood: Off';
	moodStatusBar.tooltip = 'Mood-based theming is disabled';

	context.subscriptions.push(languageStatusBar, moodStatusBar);

	// Issue #11: Command: Open accent color picker
	let pickAccentColorCommand = vscode.commands.registerCommand(
		'forest-ash-theme.pickAccentColor',
		async function() {
			const colors = [
				'#A8D8EA',
				'#AA96DA',
				'#FCBAD3',
				'#FFFFD2',
				'#C1F0FC',
				'#FFB3BA',
				'#BAFFC9',
				'#FFE5B4',
				'#E0BBE4',
				'#B8E6F5'
			];

			const color = await vscode.window.showQuickPick(
				colors.map(c => ({
					label: c,
					description: `Accent color: ${c}`,
					picked: false,
					color: c
				})),
				{ placeHolder: 'Select a preset accent color or enter custom hex' }
			);

			if (color) {
				await setAccentColor(color.color);
			}
		}
	);

	// Command: Enter custom hex color
	let customAccentColorCommand = vscode.commands.registerCommand(
		'forest-ash-theme.customAccentColor',
		async function() {
			const input = await vscode.window.showInputBox({
				prompt: 'Enter custom accent color (hex, RGB, or HSL)',
				placeHolder: '#A8D8EA or rgb(168, 216, 234) or hsl(180, 70%, 79%)',
				validateInput: (value) => {
					if (!isValidColor(value)) {
						return 'Invalid color format. Use hex, RGB, or HSL.';
					}
					return null;
				}
			});

			if (input) {
				await setAccentColor(input);
			}
		}
	);

	// Command: Revert to default accent color
	let revertAccentColorCommand = vscode.commands.registerCommand(
		'forest-ash-theme.revertAccentColor',
		async function() {
			const config = vscode.workspace.getConfiguration('forestAshTheme');
			await config.update('customAccentColor', null, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage('Accent color reverted to default');
		}
	);

	// Command: Toggle WCAG High Contrast
	let toggleHighContrastCommand = vscode.commands.registerCommand(
		'forest-ash-theme.toggleHighContrast',
		async function() {
			const config = vscode.workspace.getConfiguration('forestAshTheme');
			const current = config.get('wcagHighContrast', false);
			await config.update('wcagHighContrast', !current, vscode.ConfigurationTarget.Global);
			const status = !current ? 'enabled' : 'disabled';
			vscode.window.showInformationMessage(`WCAG High Contrast ${status}. Please reload VS Code.`);
		}
	);

	// Command: Export accent color
	let exportAccentColorCommand = vscode.commands.registerCommand(
		'forest-ash-theme.exportAccentColor',
		async function() {
			const config = vscode.workspace.getConfiguration('forestAshTheme');
			const color = config.get('customAccentColor', '#A8D8EA');
			const clipboardColor = await vscode.env.clipboard.writeText(color);
			vscode.window.showInformationMessage(`Accent color copied to clipboard: ${color}`);
		}
	);

	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('forestAshTheme.customAccentColor') ||
				event.affectsConfiguration('forestAshTheme.wcagHighContrast')) {
				vscode.window.showInformationMessage(
					'Theme settings updated. Reload VS Code to apply changes.',
					'Reload'
				).then(selection => {
					if (selection === 'Reload') {
						vscode.commands.executeCommand('workbench.action.reloadWindow');
					}
				});
			}
		})
	);

	context.subscriptions.push(pickAccentColorCommand);
	context.subscriptions.push(customAccentColorCommand);
	context.subscriptions.push(revertAccentColorCommand);
	context.subscriptions.push(toggleHighContrastCommand);
	context.subscriptions.push(exportAccentColorCommand);

	// Issue #1: Mood-based theme switching
	let moodSwitchCommand = vscode.commands.registerCommand(
		'forest-ash-theme.switchMood',
		async function() {
			const moods = ['Happy', 'Focused', 'Tired', 'Creative'];
			const mood = await vscode.window.showQuickPick(moods, {
				placeHolder: 'Select a mood'
			});

			if (mood) {
				const config = vscode.workspace.getConfiguration('forestAshTheme');
				await config.update('currentMood', mood.toLowerCase(), vscode.ConfigurationTarget.Global);
				updateMoodStatusBar(mood);
				vscode.window.showInformationMessage(
					`Mood set to ${mood}. This feature is currently in preview.`,
					'Learn More'
				).then(selection => {
					if (selection === 'Learn More') {
						vscode.env.openExternal(vscode.Uri.parse('https://github.com/sidkr222003/Forest-Ash-Theme#mood-based-theming'));
					}
				});
			}
		}
	);

	// Issue #1: Toggle mood-based theming
	let toggleMoodCommand = vscode.commands.registerCommand(
		'forest-ash-theme.toggleMoodTheming',
		async function() {
			const config = vscode.workspace.getConfiguration('forestAshTheme');
			const current = config.get('enableMoodTheming', false);
			await config.update('enableMoodTheming', !current, vscode.ConfigurationTarget.Global);
			const status = !current ? 'enabled' : 'disabled';
			updateMoodStatusBar(status === 'enabled' ? config.get('currentMood', 'focused') : 'off');
			vscode.window.showInformationMessage(`Mood-based theming ${status}`);
		}
	);

	// Issue #9: Language auto-theming
	let toggleLanguageThemeCommand = vscode.commands.registerCommand(
		'forest-ash-theme.toggleLanguageAutoTheme',
		async function() {
			const config = vscode.workspace.getConfiguration('forestAshTheme');
			const current = config.get('enableLanguageAutoTheme', false);
			await config.update('enableLanguageAutoTheme', !current, vscode.ConfigurationTarget.Global);
			const status = !current ? 'enabled' : 'disabled';
			updateLanguageStatusBar(status === 'enabled' ? currentLanguage : 'off');
			vscode.window.showInformationMessage(
				`Language-based auto-theming ${status}. File language colors will ${status === 'enabled' ? '' : 'not '}apply.`
			);
		}
	);

	// Issue #9: Customize language accent intensity
	let customizeLanguageIntensityCommand = vscode.commands.registerCommand(
		'forest-ash-theme.customizeLanguageIntensity',
		async function() {
			const intensity = await vscode.window.showInputBox({
				prompt: 'Enter language accent intensity (0.0 - 1.0)',
				value: '0.3',
				validateInput: (value) => {
					const num = parseFloat(value);
					if (isNaN(num) || num < 0 || num > 1) {
						return 'Please enter a number between 0 and 1';
					}
					return null;
				}
			});

			if (intensity) {
				const config = vscode.workspace.getConfiguration('forestAshTheme');
				await config.update('languageAccentIntensity', parseFloat(intensity), vscode.ConfigurationTarget.Global);
				vscode.window.showInformationMessage(`Language accent intensity set to ${intensity}`);
			}
		}
	);

	// Issue #10: Apply developer persona preset
	let applyPersonaCommand = vscode.commands.registerCommand(
		'forest-ash-theme.applyPersonaPreset',
		async function() {
			const personas = ['Hacker', 'Designer', 'Data Scientist', 'Minimalist', 'Artistic'];
			const persona = await vscode.window.showQuickPick(personas, {
				placeHolder: 'Select your developer persona'
			});

			if (persona) {
				const config = vscode.workspace.getConfiguration('forestAshTheme');
				const personaKey = persona.toLowerCase().replace(/\s+/g, '');
				await config.update('developerPersona', personaKey, vscode.ConfigurationTarget.Global);
				vscode.window.showInformationMessage(
					`Developer persona set to ${persona}. Reload VS Code to see recommended themes.`,
					'Reload'
				).then(selection => {
					if (selection === 'Reload') {
						vscode.commands.executeCommand('workbench.action.reloadWindow');
					}
				});
			}
		}
	);

	// Issue #10: Show persona recommendations
	let showPersonaRecommendationsCommand = vscode.commands.registerCommand(
		'forest-ash-theme.showPersonaRecommendations',
		async function() {
			const personas = personaPresets.getAvailablePersonas();
			const selected = await vscode.window.showQuickPick(
				personas.map(p => {
					const info = personaPresets.getPersonaInfo(p);
					return {
						label: info.name,
						description: info.description,
						persona: p
					};
				}),
				{ placeHolder: 'Select a persona to learn more' }
			);

			if (selected) {
				const info = personaPresets.getPersonaInfo(selected.persona);
				vscode.window.showInformationMessage(
					`${info.name}: ${info.description}\n\nRecommended themes: ${info.recommendedThemes.join(', ')}`
				);
			}
		}
	);

	// Listen for active editor changes (for language auto-theming)
	let editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (editor) {
			const language = languageAutoTheme.detectLanguage(editor.document.fileName);
			currentLanguage = language;
			const config = vscode.workspace.getConfiguration('forestAshTheme');
			if (config.get('enableLanguageAutoTheme', false)) {
				updateLanguageStatusBar(language);
			}
		}
	});

	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('forestAshTheme.customAccentColor') ||
				event.affectsConfiguration('forestAshTheme.wcagHighContrast') ||
				event.affectsConfiguration('forestAshTheme.currentMood') ||
				event.affectsConfiguration('forestAshTheme.enableMoodTheming') ||
				event.affectsConfiguration('forestAshTheme.enableLanguageAutoTheme') ||
				event.affectsConfiguration('forestAshTheme.developerPersona')) {
				vscode.window.showInformationMessage(
					'Theme settings updated. Reload VS Code to apply changes.',
					'Reload'
				).then(selection => {
					if (selection === 'Reload') {
						vscode.commands.executeCommand('workbench.action.reloadWindow');
					}
				});
			}
		})
	);

	context.subscriptions.push(moodSwitchCommand);
	context.subscriptions.push(toggleMoodCommand);
	context.subscriptions.push(toggleLanguageThemeCommand);
	context.subscriptions.push(customizeLanguageIntensityCommand);
	context.subscriptions.push(applyPersonaCommand);
	context.subscriptions.push(showPersonaRecommendationsCommand);
	context.subscriptions.push(editorChangeDisposable);
}

function updateLanguageStatusBar(language) {
	if (!languageStatusBar) return;
	
	if (language) {
		const color = languageAutoTheme.getLanguageColor(language);
		const colorName = language.charAt(0).toUpperCase() + language.slice(1);
		languageStatusBar.text = `$(file-code) ${colorName}`;
		languageStatusBar.tooltip = `Language accent color: ${color}`;
	} else {
		languageStatusBar.text = '$(file-code) Language Theme: Off';
		languageStatusBar.tooltip = 'Language-based accent coloring is disabled';
	}
}

function updateMoodStatusBar(mood) {
	if (!moodStatusBar) return;
	
	if (mood && mood !== 'off') {
		moodStatusBar.text = `$(smiley) Mood: ${mood}`;
		moodStatusBar.tooltip = `Current mood: ${mood}`;
	} else {
		moodStatusBar.text = '$(smiley) Mood: Off';
		moodStatusBar.tooltip = 'Mood-based theming is disabled';
	}
}

async function setAccentColor(color) {
	const config = vscode.workspace.getConfiguration('forestAshTheme');
	await config.update('customAccentColor', color, vscode.ConfigurationTarget.Global);
	vscode.window.showInformationMessage(
		`Accent color set to ${color}. Reload VS Code to apply changes.`,
		'Reload'
	).then(selection => {
		if (selection === 'Reload') {
			vscode.commands.executeCommand('workbench.action.reloadWindow');
		}
	});
}

function isValidColor(color) {
	// Hex color
	if (/^#[0-9A-F]{6}$/i.test(color)) return true;
	// RGB color
	if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(color)) return true;
	// HSL color
	if (/^hsl\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*\)$/i.test(color)) return true;
	return false;
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};
