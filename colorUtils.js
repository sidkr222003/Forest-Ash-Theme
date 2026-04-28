/**
 * Color utility functions for Forest Ash Theme
 */

/**
 * Convert hex color to RGB
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
 * Parse color string (hex, rgb, or hsl) to RGB object
 */
function parseColor(colorStr) {
	// Hex
	if (colorStr.startsWith('#')) {
		return hexToRgb(colorStr);
	}
	// RGB
	if (colorStr.startsWith('rgb')) {
		const match = colorStr.match(/\d+/g);
		if (match && match.length >= 3) {
			return { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) };
		}
	}
	// HSL
	if (colorStr.startsWith('hsl')) {
		return hslToRgb(colorStr);
	}
	return null;
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(hslStr) {
	const match = hslStr.match(/\d+(\.\d+)?/g);
	if (!match || match.length < 3) return null;

	let h = parseInt(match[0]) / 360;
	let s = parseInt(match[1]) / 100;
	let l = parseInt(match[2]) / 100;

	let r, g, b;

	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p, q, t) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1/6) return p + (q - p) * 6 * t;
			if (t < 1/2) return q;
			if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}

	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255)
	};
}

/**
 * Calculate contrast ratio (WCAG)
 */
function getContrastRatio(rgb1, rgb2) {
	const l1 = getLuminance(rgb1);
	const l2 = getLuminance(rgb2);
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance (WCAG)
 */
function getLuminance(rgb) {
	let [r, g, b] = [rgb.r, rgb.g, rgb.b].map(x => {
		x = x / 255;
		return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
	});
	return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

/**
 * Check if contrast ratio meets WCAG standards
 */
function meetsWCAGStandard(contrast, level = 'AA') {
	if (level === 'AAA') return contrast >= 7;
	if (level === 'AA') return contrast >= 4.5;
	return contrast >= 3;
}

/**
 * Generate high contrast variant of a color for color blindness
 */
function generateColorBlindSafeColor(rgb, blindnessType = 'deuteranopia') {
	// Simplified color blind safe palette generation
	// In production, would use more sophisticated algorithms
	switch (blindnessType) {
		case 'protanopia': // Red-blind
			return { r: rgb.g, g: rgb.b, b: rgb.r };
		case 'deuteranopia': // Green-blind
			return { r: rgb.r, g: rgb.b, b: rgb.g };
		case 'tritanopia': // Blue-yellow blind
			return { r: rgb.b, g: rgb.g, b: rgb.r };
		default:
			return rgb;
	}
}

/**
 * Lighten color for high contrast variant
 */
function lightenColor(rgb, amount = 30) {
	return {
		r: Math.min(255, rgb.r + amount),
		g: Math.min(255, rgb.g + amount),
		b: Math.min(255, rgb.b + amount)
	};
}

/**
 * Darken color for high contrast variant
 */
function darkenColor(rgb, amount = 30) {
	return {
		r: Math.max(0, rgb.r - amount),
		g: Math.max(0, rgb.g - amount),
		b: Math.max(0, rgb.b - amount)
	};
}

module.exports = {
	hexToRgb,
	rgbToHex,
	parseColor,
	hslToRgb,
	getContrastRatio,
	getLuminance,
	meetsWCAGStandard,
	generateColorBlindSafeColor,
	lightenColor,
	darkenColor
};
