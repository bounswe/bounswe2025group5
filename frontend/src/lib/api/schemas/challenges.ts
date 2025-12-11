import { z } from 'zod';

export const ChallengeListItemSchema = z.object({
  challengeId: z.number().int(),
  name: z.string(),
  amount: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string(),
  type: z.string(),
  currentAmount: z.number().nullable().optional(),
  userInChallenge: z.boolean(),
});

export type ChallengeListItem = z.infer<typeof ChallengeListItemSchema>;

export const WasteItemSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  weightInGrams: z.number().nullable().optional(),
  type: z.object({
    id: z.number().int(),
    name: z.string(),
  })
});

export type WasteItem = z.infer<typeof WasteItemSchema>;