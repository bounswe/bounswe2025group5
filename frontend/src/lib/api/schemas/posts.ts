import { z } from 'zod';

export const PostItemSchema = z.object({
  postId: z.number().int(),
  content: z.string(),
  createdAt: z.string(),
  creatorUsername: z.string(),
  photoUrl: z.string().nullable().optional(),
  likes: z.number().int().optional(),
  comments: z.number().int().optional(),
}).passthrough();

export type PostItem = z.infer<typeof PostItemSchema>;

export const CreateOrEditPostResponseSchema = PostItemSchema;
export type CreateOrEditPostResponse = z.infer<typeof CreateOrEditPostResponseSchema>;

export const DeletePostResponseSchema = z.object({ postId: z.number().int() }).passthrough();
export type DeletePostResponse = z.infer<typeof DeletePostResponseSchema>;

export const SavePostResponseSchema = z.object({ postId: z.number().int() }).passthrough();
export type SavePostResponse = z.infer<typeof SavePostResponseSchema>;


