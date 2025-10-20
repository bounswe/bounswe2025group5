import { z } from 'zod';

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



