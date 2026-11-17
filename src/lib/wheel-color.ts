/**
 * The brand palette is stored as CSS custom properties in the "H S% L%"
 * triplet form Tailwind's `hsl(var(--x))` tokens expect. Operators pick
 * colors with a plain `<input type="color">`, which only speaks hex — these
 * convert between the two so a picked color can drop straight into the
 * existing token system with no other code changes.
 */

const clampByte = (value: number): number => Math.min(255, Math.max(0, Math.round(value)));

export const hexToHslTriplet = (hex: string): string | null => {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const int = parseInt(match[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return `0 0% ${Math.round(l * 100)}%`;

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  h *= 60;

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const hslTripletToHex = (triplet: string): string => {
  const match = /^(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/.exec(triplet.trim());
  if (!match) return "#000000";

  const h = Number(match[1]) / 360;
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;

  if (s === 0) {
    const gray = clampByte(l * 255);
    return `#${gray.toString(16).padStart(2, "0").repeat(3)}`;
  }

  const hueToRgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = clampByte(hueToRgb(p, q, h + 1 / 3) * 255);
  const g = clampByte(hueToRgb(p, q, h) * 255);
  const b = clampByte(hueToRgb(p, q, h - 1 / 3) * 255);

  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
};
