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

export const LogChallengeRequestSchema = z.object({
  username: z.string().min(1),
  quantity: z.number().int(),
  itemId: z.number().nullable().optional()
});

export type LogChallengeRequest = z.infer<typeof LogChallengeRequestSchema>;

export const LogChallengeResponseSchema = z.object({
  username: z.string().min(1),
  challengeId: z.number().int(),
  newTotalAmount: z.number().nullable().optional()
});

export type LogChallengeResponse = z.infer<typeof LogChallengeResponseSchema>;

export const CreateChallengeRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().int().positive(),
  startDate: z.string(),
  endDate: z.string(),
  type: z.string().min(1),
});

export type CreateChallengeRequest = z.infer<typeof CreateChallengeRequestSchema>;

export const CreateChallengeResponseSchema = z.object({
  challengeId: z.number().int(),
  name: z.string(),
  amount: z.number(),
  description: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  type: z.string(),
});

export type CreateChallengeResponse = z.infer<typeof CreateChallengeResponseSchema>;