const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

// Store for custom accent colors
let accentColorStore = {};

function activate(context) {
	console.log('Forest Ash Theme extension activated');

	// Command: Open accent color picker
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
