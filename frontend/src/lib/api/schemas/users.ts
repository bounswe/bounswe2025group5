import { z } from 'zod';

export const UserCountResponseSchema = z.object({
  userCount: z.number().int().nonnegative(),
});

export type UserCountResponse = z.infer<typeof UserCountResponseSchema>;


