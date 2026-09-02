/**
 * The single categorical palette every visual in the extension draws from.
 *
 * Contributors, activities, sparklines and row swatches all resolve their
 * colours through here, so one person or one activity reads as the same hue in
 * every chart, and re-theming the product means editing this file only.
 *
 * The ten hues sit at a common saturation and lightness, so any two of them
 * differ in hue rather than in brightness. PALETTE_SPECTRUM then alternates
 * warm and cool rather than sweeping red-to-violet, so consecutive slots land
 * far apart on the wheel — a small team, which only ever takes the first few
 * slots, still gets well separated colours. Colour is never a sufficient
 * carrier of identity on its own even so: every chart drawn from this palette
 * also ships a labelled legend, table or hover readout.
 */
export const PALETTE = {
  red: "#EF4444",
  teal: "#14B8A6",
  orange: "#F97316",
  blue: "#3B82F6",
  yellow: "#EAB308",
  violet: "#8B5CF6",
  green: "#22C55E",
  amber: "#F59E0B",
  indigo: "#6366F1",
  cyan: "#06B6D4",
} as const;

/** Palette order used wherever colours are handed out by numeric slot */
export const PALETTE_SPECTRUM: string[] = [
  PALETTE.red,
  PALETTE.teal,
  PALETTE.orange,
  PALETTE.blue,
  PALETTE.yellow,
  PALETTE.violet,
  PALETTE.green,
  PALETTE.amber,
  PALETTE.indigo,
  PALETTE.cyan,
];

/**
 * Accent for single-series visuals — a sparkline, a bar list, a row marker.
 * These carry no categorical meaning, so they all take the same one colour
 * rather than a slot from the spectrum.
 */
export const ACCENT_COLOR = PALETTE.blue;

/** Secondary accent, for the rare visual that needs to contrast against ACCENT_COLOR */
export const ACCENT_ALT_COLOR = PALETTE.orange;
