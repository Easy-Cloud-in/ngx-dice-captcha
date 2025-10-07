import * as THREE from 'three';

/**
 * RGB color representation
 */
export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * HSL color representation
 */
export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/**
 * Material 3 theme colors
 */
export interface ThemeColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
}

/**
 * WCAG contrast levels
 */
export enum WCAGLevel {
  AA = 'AA',
  AAA = 'AAA',
}

/**
 * WCAG contrast ratios
 */
export const WCAG_RATIOS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3.0,
  AAA_NORMAL: 7.0,
  AAA_LARGE: 4.5,
};

/**
 * Converts a hex color string to RGB object.
 * Supports both 3-digit and 6-digit hex formats.
 *
 * @param hex - Hex color string (with or without #)
 * @returns RGB object with values 0-255
 *
 * @throws Error if hex string is invalid
 *
 * @example
 * ```typescript
 * const rgb = hexToRgb('#FF5733');
 * // { r: 255, g: 87, b: 51 }
 *
 * const rgb2 = hexToRgb('F00');
 * // { r: 255, g: 0, b: 0 }
 * ```
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (hex.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const num = parseInt(hex, 16);

  if (isNaN(num)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Converts RGB values to hex color string.
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hex color string with # prefix
 *
 * @example
 * ```typescript
 * const hex = rgbToHex(255, 87, 51);
 * // "#FF5733"
 * ```
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));

  const rHex = clamp(r).toString(16).padStart(2, '0');
  const gHex = clamp(g).toString(16).padStart(2, '0');
  const bHex = clamp(b).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}

/**
 * Converts RGB to HSL color space.
 *
 * @param rgb - RGB color object
 * @returns HSL color object
 *
 * @example
 * ```typescript
 * const hsl = rgbToHsl({ r: 255, g: 87, b: 51 });
 * // { h: 11, s: 100, l: 60 }
 * ```
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converts HSL to RGB color space.
 *
 * @param hsl - HSL color object
 * @returns RGB color object
 *
 * @example
 * ```typescript
 * const rgb = hslToRgb({ h: 11, s: 100, l: 60 });
 * // { r: 255, g: 87, b: 51 }
 * ```
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Calculates the relative luminance of a color according to WCAG 2.0.
 *
 * @param rgb - RGB color object
 * @returns Relative luminance value (0-1)
 *
 * @example
 * ```typescript
 * const lum = getRelativeLuminance({ r: 255, g: 255, b: 255 });
 * // 1.0 (white)
 * ```
 */
export function getRelativeLuminance(rgb: RGB): number {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates the WCAG 2.0 contrast ratio between two colors.
 *
 * @param color1 - First color (hex string)
 * @param color2 - Second color (hex string)
 * @returns Contrast ratio (1-21)
 *
 * @example
 * ```typescript
 * const contrast = calculateContrast('#000000', '#FFFFFF');
 * // 21 (maximum contrast)
 *
 * const contrast2 = calculateContrast('#FF5733', '#FFFFFF');
 * // ~3.5
 * ```
 */
export function calculateContrast(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if contrast between two colors meets WCAG standards.
 *
 * @param foreground - Foreground color (hex string)
 * @param background - Background color (hex string)
 * @param level - WCAG level ('AA' or 'AAA')
 * @param largeText - Whether text is considered large (18pt+ or 14pt+ bold)
 * @returns True if contrast meets the standard
 *
 * @example
 * ```typescript
 * const isAccessible = isAccessibleContrast('#000000', '#FFFFFF', WCAGLevel.AA);
 * // true
 *
 * const isAAA = isAccessibleContrast('#777777', '#FFFFFF', WCAGLevel.AAA);
 * // false
 * ```
 */
export function isAccessibleContrast(
  foreground: string,
  background: string,
  level: WCAGLevel = WCAGLevel.AA,
  largeText: boolean = false
): boolean {
  const contrast = calculateContrast(foreground, background);

  let requiredRatio: number;

  if (level === WCAGLevel.AAA) {
    requiredRatio = largeText ? WCAG_RATIOS.AAA_LARGE : WCAG_RATIOS.AAA_NORMAL;
  } else {
    requiredRatio = largeText ? WCAG_RATIOS.AA_LARGE : WCAG_RATIOS.AA_NORMAL;
  }

  return contrast >= requiredRatio;
}

/**
 * Generates a Material 3 compliant color palette from a primary color.
 * Creates a full theme with proper contrast and accessibility.
 *
 * @param primaryColor - Primary color as hex string
 * @returns Complete Material 3 theme colors
 *
 * @example
 * ```typescript
 * const theme = generateMaterial3Palette('#6200EE');
 * // Returns full Material 3 color scheme
 * ```
 */
export function generateMaterial3Palette(primaryColor: string): ThemeColors {
  const primaryRgb = hexToRgb(primaryColor);
  const primaryHsl = rgbToHsl(primaryRgb);

  // Generate secondary color (60° hue shift)
  const secondaryHsl: HSL = {
    h: (primaryHsl.h + 60) % 360,
    s: Math.max(40, primaryHsl.s - 10),
    l: primaryHsl.l,
  };

  // Generate tertiary color (180° hue shift)
  const tertiaryHsl: HSL = {
    h: (primaryHsl.h + 180) % 360,
    s: Math.max(40, primaryHsl.s - 10),
    l: primaryHsl.l,
  };

  const primary = primaryColor;
  const secondary = rgbToHex(
    ...(Object.values(hslToRgb(secondaryHsl)) as [number, number, number])
  );
  const tertiary = rgbToHex(...(Object.values(hslToRgb(tertiaryHsl)) as [number, number, number]));

  // Calculate "on" colors (text on colored backgrounds)
  const onPrimary = primaryHsl.l > 50 ? '#000000' : '#FFFFFF';
  const onSecondary = secondaryHsl.l > 50 ? '#000000' : '#FFFFFF';
  const onTertiary = tertiaryHsl.l > 50 ? '#000000' : '#FFFFFF';

  // Generate container colors (lighter versions)
  const primaryContainerHsl: HSL = { ...primaryHsl, l: Math.min(90, primaryHsl.l + 30) };
  const secondaryContainerHsl: HSL = { ...secondaryHsl, l: Math.min(90, secondaryHsl.l + 30) };
  const tertiaryContainerHsl: HSL = { ...tertiaryHsl, l: Math.min(90, tertiaryHsl.l + 30) };

  const primaryContainer = rgbToHex(
    ...(Object.values(hslToRgb(primaryContainerHsl)) as [number, number, number])
  );
  const secondaryContainer = rgbToHex(
    ...(Object.values(hslToRgb(secondaryContainerHsl)) as [number, number, number])
  );
  const tertiaryContainer = rgbToHex(
    ...(Object.values(hslToRgb(tertiaryContainerHsl)) as [number, number, number])
  );

  return {
    primary,
    onPrimary,
    primaryContainer,
    onPrimaryContainer: primaryContainerHsl.l > 50 ? '#000000' : '#FFFFFF',
    secondary,
    onSecondary,
    secondaryContainer,
    onSecondaryContainer: secondaryContainerHsl.l > 50 ? '#000000' : '#FFFFFF',
    tertiary,
    onTertiary,
    tertiaryContainer,
    onTertiaryContainer: tertiaryContainerHsl.l > 50 ? '#000000' : '#FFFFFF',
    error: '#B3261E',
    onError: '#FFFFFF',
    background: '#FFFBFE',
    onBackground: '#1C1B1F',
    surface: '#FFFBFE',
    onSurface: '#1C1B1F',
  };
}

/**
 * Converts a hex color to a Three.js Color object.
 *
 * @param hex - Hex color string
 * @returns Three.js Color object
 *
 * @example
 * ```typescript
 * const threeColor = hexToThreeColor('#FF5733');
 * mesh.material.color = threeColor;
 * ```
 */
export function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

/**
 * Converts a Three.js Color to hex string.
 *
 * @param color - Three.js Color object
 * @returns Hex color string
 *
 * @example
 * ```typescript
 * const hex = threeColorToHex(mesh.material.color);
 * // "#FF5733"
 * ```
 */
export function threeColorToHex(color: THREE.Color): string {
  return '#' + color.getHexString().toUpperCase();
}

/**
 * Creates a color array for dice materials based on theme.
 *
 * @param theme - Material 3 theme colors
 * @param count - Number of colors needed
 * @returns Array of Three.js Color objects
 *
 * @example
 * ```typescript
 * const theme = generateMaterial3Palette('#6200EE');
 * const colors = applyTheme(theme, 6);
 * // Returns 6 colors from the theme
 * ```
 */
export function applyTheme(theme: ThemeColors, count: number = 6): THREE.Color[] {
  const colorHexes = [
    theme.primary,
    theme.secondary,
    theme.tertiary,
    theme.primaryContainer,
    theme.secondaryContainer,
    theme.tertiaryContainer,
  ];

  const colors: THREE.Color[] = [];
  for (let i = 0; i < count; i++) {
    const hex = colorHexes[i % colorHexes.length];
    colors.push(hexToThreeColor(hex));
  }

  return colors;
}

/**
 * Lightens a color by a specified amount.
 *
 * @param hex - Hex color string
 * @param amount - Amount to lighten (0-100)
 * @returns Lightened color as hex string
 *
 * @example
 * ```typescript
 * const lighter = lightenColor('#FF5733', 20);
 * // Lighter version of the color
 * ```
 */
export function lightenColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);

  hsl.l = Math.min(100, hsl.l + amount);

  const newRgb = hslToRgb(hsl);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Darkens a color by a specified amount.
 *
 * @param hex - Hex color string
 * @param amount - Amount to darken (0-100)
 * @returns Darkened color as hex string
 *
 * @example
 * ```typescript
 * const darker = darkenColor('#FF5733', 20);
 * // Darker version of the color
 * ```
 */
export function darkenColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);

  hsl.l = Math.max(0, hsl.l - amount);

  const newRgb = hslToRgb(hsl);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Adjusts the saturation of a color.
 *
 * @param hex - Hex color string
 * @param amount - Amount to adjust (-100 to 100)
 * @returns Color with adjusted saturation as hex string
 *
 * @example
 * ```typescript
 * const moreSaturated = adjustSaturation('#FF5733', 20);
 * const lessSaturated = adjustSaturation('#FF5733', -20);
 * ```
 */
export function adjustSaturation(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);

  hsl.s = Math.max(0, Math.min(100, hsl.s + amount));

  const newRgb = hslToRgb(hsl);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Mixes two colors together.
 *
 * @param color1 - First color (hex string)
 * @param color2 - Second color (hex string)
 * @param ratio - Mix ratio (0-1, 0 = all color1, 1 = all color2)
 * @returns Mixed color as hex string
 *
 * @example
 * ```typescript
 * const mixed = mixColors('#FF0000', '#0000FF', 0.5);
 * // Purple color (50% red, 50% blue)
 * ```
 */
export function mixColors(color1: string, color2: string, ratio: number = 0.5): string {
  ratio = Math.max(0, Math.min(1, ratio));

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const mixed: RGB = {
    r: Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio),
    g: Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio),
    b: Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio),
  };

  return rgbToHex(mixed.r, mixed.g, mixed.b);
}

/**
 * Generates a color palette with specified number of colors.
 * Creates harmonious colors by rotating hue.
 *
 * @param baseColor - Base color (hex string)
 * @param count - Number of colors to generate
 * @returns Array of hex color strings
 *
 * @example
 * ```typescript
 * const palette = generateColorPalette('#FF5733', 5);
 * // Returns 5 harmonious colors
 * ```
 */
export function generateColorPalette(baseColor: string, count: number): string[] {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb);

  const colors: string[] = [];
  const hueStep = 360 / count;

  for (let i = 0; i < count; i++) {
    const newHsl: HSL = {
      h: (hsl.h + hueStep * i) % 360,
      s: hsl.s,
      l: hsl.l,
    };

    const newRgb = hslToRgb(newHsl);
    colors.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }

  return colors;
}
