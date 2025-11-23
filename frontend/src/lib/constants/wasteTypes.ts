export const WASTE_TYPE_OPTIONS = [
  'Plastic',
  'Paper',
  'Glass',
  'Metal',
  'Organic',
  'E-Waste',
  'Textile',
] as const;

export const DEFAULT_WASTE_TYPE = WASTE_TYPE_OPTIONS[0];

export type WasteTypeOption = (typeof WASTE_TYPE_OPTIONS)[number];

