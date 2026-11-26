import type { FontChoice } from "./wheel-types";

/** The one custom-upload slot's registered @font-face family name. */
export const CUSTOM_FONT_FAMILY = "BrandCustomFont";

export const FONT_STACKS: Record<Exclude<FontChoice, "custom">, string> = {
  manrope: "'Manrope', ui-sans-serif, system-ui, sans-serif",
  "system-sans": "-apple-system, 'Segoe UI', ui-sans-serif, system-ui, sans-serif",
  "system-serif": "Georgia, 'Times New Roman', ui-serif, serif",
  "system-mono": "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
};

export const FONT_PRESETS: Array<{ id: Exclude<FontChoice, "custom">; label: string }> = [
  { id: "manrope", label: "Manrope" },
  { id: "system-sans", label: "System sans" },
  { id: "system-serif", label: "Serif" },
  { id: "system-mono", label: "Mono" },
];

/** Resolves any font choice straight to a usable CSS font-family stack. */
export const fontChoiceToFamily = (choice: FontChoice): string =>
  choice === "custom" ? `'${CUSTOM_FONT_FAMILY}', ui-sans-serif, sans-serif` : FONT_STACKS[choice];
