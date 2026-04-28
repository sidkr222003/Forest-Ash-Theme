/**
 * Developer persona presets
 * Distinct syntax highlighting for different developer archetypes
 */

const fs = require('fs');
const path = require('path');

/**
 * Developer persona definitions with recommended themes and syntax preferences
 */
const PERSONAS = {
	hacker: {
		name: 'Hacker',
		description: 'High contrast, neon accents - optimized for Nebula Manga, Kitsune Ink',
		recommendedThemes: ['Forest Ash Nebula Manga', 'Forest Ash Kitsune Ink'],
		syntaxAdjustments: {
			keywords: { fontStyle: 'bold', saturationDelta: 40 },
			strings: { fontStyle: 'normal', saturationDelta: 20 },
			comments: { fontStyle: 'italic', brightness: -20 },
			functions: { fontStyle: 'bold', saturationDelta: 30 },
			variables: { fontStyle: 'normal', saturationDelta: 10 },
			operators: { fontStyle: 'bold', brightness: 20 }
		},
		colorProfileDelta: {
			contrast: 1.3,
			saturation: 1.4,
			brightness: 0.1
		}
	},
	designer: {
		name: 'Designer',
		description: 'Refined palette, balanced aesthetics - optimized for Yoru Paper, Sakura Charcoal',
		recommendedThemes: ['Forest Ash Yoru Paper', 'Forest Ash Sakura Charcoal'],
		syntaxAdjustments: {
			keywords: { fontStyle: 'normal', saturationDelta: 0 },
			strings: { fontStyle: 'italic', saturationDelta: 10 },
			comments: { fontStyle: 'italic', brightness: -10 },
			functions: { fontStyle: 'normal', saturationDelta: 5 },
			variables: { fontStyle: 'normal', saturationDelta: 0 },
			operators: { fontStyle: 'normal', brightness: 0 }
		},
		colorProfileDelta: {
			contrast: 1.0,
			saturation: 0.9,
			brightness: 0
		}
	},
	datascientist: {
		name: 'Data Scientist',
		description: 'Color-blind friendly, semantic colors - optimized for Aizome Dusk',
		recommendedThemes: ['Forest Ash Aizome Dusk', 'Forest Ash Sumi Moon'],
		syntaxAdjustments: {
			keywords: { fontStyle: 'bold', saturationDelta: -10 },
			strings: { fontStyle: 'normal', saturationDelta: -5 },
			comments: { fontStyle: 'italic', brightness: -15 },
			functions: { fontStyle: 'bold', saturationDelta: -5 },
			variables: { fontStyle: 'normal', saturationDelta: -10 },
			operators: { fontStyle: 'normal', brightness: 0 }
		},
		colorProfileDelta: {
			contrast: 1.2,
			saturation: 0.7,
			brightness: 0.05
		}
	},
	minimalist: {
		name: 'Minimalist',
		description: 'Grayscale with single accent - optimized for Sumi Moon, Shoji Night',
		recommendedThemes: ['Forest Ash Sumi Moon', 'Forest Ash Shoji Night'],
		syntaxAdjustments: {
			keywords: { fontStyle: 'bold', saturationDelta: -80 },
			strings: { fontStyle: 'normal', saturationDelta: -90 },
			comments: { fontStyle: 'italic', brightness: -25 },
			functions: { fontStyle: 'normal', saturationDelta: -85 },
			variables: { fontStyle: 'normal', saturationDelta: -95 },
			operators: { fontStyle: 'normal', brightness: 0 }
		},
		colorProfileDelta: {
			contrast: 1.1,
			saturation: 0.2,
			brightness: -0.05
		}
	},
	artistic: {
		name: 'Artistic',
		description: 'Vibrant, expressive colors - optimized for Ronin Lantern, Bamboo Midnight',
		recommendedThemes: ['Forest Ash Ronin Lantern', 'Forest Ash Bamboo Midnight'],
		syntaxAdjustments: {
			keywords: { fontStyle: 'bold italic', saturationDelta: 50 },
			strings: { fontStyle: 'italic', saturationDelta: 45 },
			comments: { fontStyle: 'italic', brightness: -5 },
			functions: { fontStyle: 'bold', saturationDelta: 40 },
			variables: { fontStyle: 'normal', saturationDelta: 30 },
			operators: { fontStyle: 'bold', brightness: 15 }
		},
		colorProfileDelta: {
			contrast: 1.15,
			saturation: 1.5,
			brightness: 0.15
		}
	}
};

/**
 * Apply persona syntax adjustments to theme
 */
function applyPersonaToTheme(originalTheme, persona) {
	const personaConfig = PERSONAS[persona];
	
	if (!personaConfig) {
		throw new Error(`Unknown persona: ${persona}`);
	}

	const themeCopy = JSON.parse(JSON.stringify(originalTheme));
	themeCopy.name = `${originalTheme.name} (${personaConfig.name})`;

	if (themeCopy.tokenColors) {
		themeCopy.tokenColors = applyPersonaToTokens(
			themeCopy.tokenColors,
			personaConfig.syntaxAdjustments
		);
	}

	if (themeCopy.colors) {
		themeCopy.colors = applyColorProfileAdjustments(
			themeCopy.colors,
			personaConfig.colorProfileDelta
		);
	}

	return themeCopy;
}

/**
 * Apply persona adjustments to token colors
 */
function applyPersonaToTokens(tokenColors, adjustments) {
	return tokenColors.map(token => {
		if (!token.scope) return token;

		const scope = token.scope.join ? token.scope.join(' ') : token.scope;
		let adjustment = null;

		if (scope.includes('keyword')) adjustment = adjustments.keywords;
		else if (scope.includes('string')) adjustment = adjustments.strings;
		else if (scope.includes('comment')) adjustment = adjustments.comments;
		else if (scope.includes('function')) adjustment = adjustments.functions;
		else if (scope.includes('variable')) adjustment = adjustments.variables;
		else if (scope.includes('operator')) adjustment = adjustments.operators;

		if (!adjustment || !token.settings) return token;

		const newSettings = { ...token.settings };
		
		if (adjustment.fontStyle) {
			newSettings.fontStyle = adjustment.fontStyle;
		}

		if (adjustment.saturationDelta && token.settings.foreground) {
			newSettings.foreground = adjustSaturation(
				token.settings.foreground,
				adjustment.saturationDelta
			);
		}

		if (adjustment.brightness && token.settings.foreground) {
			newSettings.foreground = adjustBrightness(
				token.settings.foreground,
				adjustment.brightness
			);
		}

		return {
			...token,
			settings: newSettings
		};
	});
}

/**
 * Apply color profile adjustments
 */
function applyColorProfileAdjustments(colors, profile) {
	const adjusted = {};

	for (const [key, value] of Object.entries(colors)) {
		if (!value || !value.startsWith('#')) {
			adjusted[key] = value;
			continue;
		}

		let color = value;

		if (profile.saturation !== 1) {
			color = adjustSaturation(color, (profile.saturation - 1) * 100);
		}

		if (profile.brightness !== 0) {
			color = adjustBrightness(color, profile.brightness * 50);
		}

		adjusted[key] = color;
	}

	return adjusted;
}

/**
 * Adjust color saturation
 */
function adjustSaturation(hex, amount) {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;

	const max = Math.max(rgb.r, rgb.g, rgb.b);
	const min = Math.min(rgb.r, rgb.g, rgb.b);
	const l = (max + min) / 2;

	if (max === min) return hex;

	let s = l > 128 ? (max - min) / (510 - max - min) : (max - min) / (max + min);
	let h = 0;

	if (max === rgb.r) h = ((rgb.g - rgb.b) / (max - min) + (rgb.g < rgb.b ? 6 : 0)) / 6;
	else if (max === rgb.g) h = ((rgb.b - rgb.r) / (max - min) + 2) / 6;
	else h = ((rgb.r - rgb.g) / (max - min) + 4) / 6;

	s += amount / 100;
	s = Math.max(0, Math.min(1, s));

	return hslToHex(h * 360, s * 100, l);
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex, amount) {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;

	return rgbToHex(
		Math.max(0, Math.min(255, rgb.r + amount)),
		Math.max(0, Math.min(255, rgb.g + amount)),
		Math.max(0, Math.min(255, rgb.b + amount))
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
 * Convert HSL to hex
 */
function hslToHex(h, s, l) {
	s /= 100;
	l /= 100;

	const a = s * Math.min(l, 1 - l);
	const f = (n) => {
		const k = (n + h / 30) % 12;
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color).toString(16).padStart(2, '0');
	};

	return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

/**
 * Get persona info
 */
function getPersonaInfo(persona) {
	return PERSONAS[persona] || null;
}

/**
 * Get all personas
 */
function getAvailablePersonas() {
	return Object.keys(PERSONAS);
}

module.exports = {
	PERSONAS,
	applyPersonaToTheme,
	getPersonaInfo,
	getAvailablePersonas
};
