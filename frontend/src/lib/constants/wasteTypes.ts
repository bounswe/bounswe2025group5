export const WASTE_TYPES = [
  { id: 3, name: 'GLASS' },
  { id: 2, name: 'METAL' },
  { id: 5, name: 'ORGANIC' },
  { id: 4, name: 'PAPER' },
  { id: 1, name: 'PLASTIC' },
] as const;

export const WASTE_TYPE_OPTIONS = WASTE_TYPES.map((type) => type.name);

export const DEFAULT_WASTE_TYPE = WASTE_TYPES[0].name;

export type WasteTypeOption = (typeof WASTE_TYPE_OPTIONS)[number];
export type WasteTypeDefinition = (typeof WASTE_TYPES)[number];

