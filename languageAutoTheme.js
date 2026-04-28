/**
 * Language-based auto-theming system
 * Applies subtle accent color shifts based on programming language
 */

const fs = require('fs');
const path = require('path');

/**
 * Language color mapping
 */
const LANGUAGE_COLORS = {
	'typescript': '#2E86DE',      // Blue
	'javascript': '#2E86DE',      // Blue
	'python': '#00A86B',          // Green
	'rust': '#FF6B35',            // Orange
	'go': '#00D9FF',              // Cyan
	'java': '#EF476F',            // Red
	'cpp': '#9D4EDD',             // Purple
	'c': '#9D4EDD',               // Purple
	'css': '#FF1493',             // Pink
	'scss': '#FF1493',            // Pink
	'sass': '#FF1493',            // Pink
	'html': '#FF7F50',            // Orange-red
	'json': '#708090',            // Gray-blue
	'yaml': '#708090',            // Gray-blue
	'sql': '#20B2AA',             // Teal
	'swift': '#FA7343',           // Orange
	'kotlin': '#7F52FF',          // Purple
	'php': '#777BB4',             // Purple
	'ruby': '#CC342D',            // Red
	'go': '#00ADD8',              // Cyan
	'bash': '#4EAA25',            // Green
	'shell': '#4EAA25',           // Green
	'lua': '#000080',             // Blue-black
	'r': '#276DC3'                // Blue
};

/**
 * Language to file extension mapping
 */
const LANGUAGE_EXTENSIONS = {
	'ts': 'typescript',
	'tsx': 'typescript',
	'js': 'javascript',
	'jsx': 'javascript',
	'py': 'python',
	'rs': 'rust',
	'go': 'go',
	'java': 'java',
	'cpp': 'cpp',
	'cc': 'cpp',
	'cxx': 'cpp',
	'c': 'c',
	'h': 'c',
	'css': 'css',
	'scss': 'scss',
	'sass': 'sass',
	'html': 'html',
	'htm': 'html',
	'json': 'json',
	'yaml': 'yaml',
	'yml': 'yaml',
	'sql': 'sql',
	'swift': 'swift',
	'kt': 'kotlin',
	'php': 'php',
	'rb': 'ruby',
	'sh': 'bash',
	'bash': 'bash',
	'lua': 'lua',
	'r': 'r'
};

/**
 * Detect programming language from file extension
 */
function detectLanguage(filePath) {
	if (!filePath) return null;
	
	const ext = path.extname(filePath).slice(1).toLowerCase();
	return LANGUAGE_EXTENSIONS[ext] || null;
}

/**
 * Get color for a language
 */
function getLanguageColor(language) {
	return LANGUAGE_COLORS[language?.toLowerCase()] || null;
}

/**
 * Apply language-based accent to theme colors
 */
function applyLanguageAccent(colors, languageColor, intensity = 0.3) {
	if (!languageColor) return colors;

	const adjusted = { ...colors };
	const baseColor = languageColor;

	// Apply accent to selection and highlighting
	const accentKeys = [
		'editor.selectionBackground',
		'editor.selectionHighlightBackground',
		'editor.inactiveSelectionBackground',
		'editor.findMatchBackground',
		'editor.findMatchHighlightBackground',
		'editor.lineHighlightBackground',
		'list.activeSelectionBackground',
		'list.focusBackground',
		'tab.activeBorder'
	];

	accentKeys.forEach(key => {
		if (adjusted[key]) {
			adjusted[key] = blendColors(adjusted[key], baseColor, intensity);
		}
	});

	return adjusted;
}

/**
 * Blend two colors with given intensity
 */
function blendColors(baseColor, accentColor, intensity) {
	if (!baseColor.startsWith('#') || !accentColor.startsWith('#')) {
		return baseColor;
	}

	const base = hexToRgb(baseColor);
	const accent = hexToRgb(accentColor);

	if (!base || !accent) return baseColor;

	return rgbToHex(
		Math.round(base.r + (accent.r - base.r) * intensity),
		Math.round(base.g + (accent.g - base.g) * intensity),
		Math.round(base.b + (accent.b - base.b) * intensity)
	);
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r, g, b) {
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/**
 * Get all supported languages
 */
function getSupportedLanguages() {
	return Object.keys(LANGUAGE_COLORS).sort();
}

module.exports = {
	LANGUAGE_COLORS,
	LANGUAGE_EXTENSIONS,
	detectLanguage,
	getLanguageColor,
	applyLanguageAccent,
	blendColors,
	getSupportedLanguages
};
