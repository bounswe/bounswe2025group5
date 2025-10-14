import { z } from 'zod';

export const ProfileResponseSchema = z.object({
  username: z.string().min(1),
  biography: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;


