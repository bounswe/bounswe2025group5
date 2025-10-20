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