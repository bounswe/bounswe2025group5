import { z } from 'zod';

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

export const WasteGoalItemSchema = z.object({
  goalId: z.number().int(),
  wasteType: z.string(),
  restrictionAmountGrams: z.number(),
  duration: z.number().int(),
  progress: z.number(),
  createdAt: z.string(),
  creatorUsername: z.string(),
});

export const WasteGoalListSchema = z.array(WasteGoalItemSchema);
export type WasteGoalItem = z.infer<typeof WasteGoalItemSchema>;
export type WasteGoalList = z.infer<typeof WasteGoalListSchema>;

export const CreateWasteGoalResponseSchema = z.object({
  username: z.string(),
  goalId: z.number().int(),
}).passthrough();
export type CreateWasteGoalResponse = z.infer<typeof CreateWasteGoalResponseSchema>;

export const DeleteWasteGoalResponseSchema = z.object({ goalId: z.number().int() }).passthrough();
export type DeleteWasteGoalResponse = z.infer<typeof DeleteWasteGoalResponseSchema>;

export const WasteTypeSchema = z.object({
  id: z.number().int(),
  name: z.string(),
}).passthrough();
export type WasteType = z.infer<typeof WasteTypeSchema>;

export const WasteItemSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  weightInGrams: z.number(),
  type: WasteTypeSchema,
}).passthrough();
export type WasteItem = z.infer<typeof WasteItemSchema>;



