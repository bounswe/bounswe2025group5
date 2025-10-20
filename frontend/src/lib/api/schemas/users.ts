import { z } from 'zod';

export const UserCountResponseSchema = z.object({
  userCount: z.number().int().nonnegative(),
});

export type UserCountResponse = z.infer<typeof UserCountResponseSchema>;

export const SavedPostItemSchema = z.object({
  postId: z.number().int(),
  content: z.string(),
  likes: z.number().int(),
  comments: z.number().int(),
  creatorUsername: z.string(),
  savedAt: z.string(),
  photoUrl: z.string().nullable().optional(),
  liked: z.boolean().optional(),
  saved: z.boolean().optional(),
}).passthrough();

export type SavedPostItem = z.infer<typeof SavedPostItemSchema>;


