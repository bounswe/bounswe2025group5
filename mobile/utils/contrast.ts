// mobile/utils/contrast.ts
// Small WCAG contrast helpers used across the app.
// Exports helper functions to compute contrast ratio and pick an accessible text color.

const MIN_CONTRAST_TEXT = 4.5; // Normal text
const MIN_CONTRAST_LARGE = 3; // Large text / UI

function normalizeHex(hex: string) {
  if (!hex) throw new Error("Invalid hex color: " + hex);
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) throw new Error('Only 3 or 6 digit hex supported: ' + hex);
  return h;
}

export function hexToRgb(hex: string) {
  const h = normalizeHex(hex);
  const bigint = parseInt(h, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function srgbToLinear(c: number) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(hex1: string, hex2: string) {
  const L1 = relativeLuminance(hex1);
  const L2 = relativeLuminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function pickAccessibleTextColor(
  backgroundHex: string,
  options?: { candidates?: string[]; isLargeText?: boolean }
) {
  const { candidates = ['#000000', '#ffffff'], isLargeText = false } = options || {};
  const threshold = isLargeText ? MIN_CONTRAST_LARGE : MIN_CONTRAST_TEXT;

  // Prefer first candidate that meets threshold
  for (const c of candidates) {
    try {
      if (contrastRatio(backgroundHex, c) >= threshold) return c;
    } catch (e) {
      // ignore invalid colors
    }
  }

  // If none meet threshold, return the one with max contrast
  let best = candidates[0];
  let bestScore = -Infinity;
  for (const c of candidates) {
    try {
      const score = contrastRatio(backgroundHex, c);
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    } catch (e) {
      // ignore
    }
  }
  return best;
}

export { MIN_CONTRAST_TEXT, MIN_CONTRAST_LARGE };
