import { z } from 'zod';

export const LoginResponseSchema = z.object({
  token: z.string().min(1),
  refreshToken: z.string().min(1),
  userId: z.number().int().nonnegative(),
  username: z.string().min(1),
  isAdmin: z.boolean(),
  isModerator: z.boolean(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;


