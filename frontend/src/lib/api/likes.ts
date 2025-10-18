import { ApiClient } from './client';
import { z } from 'zod';

export const LikeToggleSchema = z.object({ success: z.boolean().optional() }).passthrough();
export const PostLikeResponseSchema = z.object({ postId: z.number().int(), likes: z.number().int() }).passthrough();

export type PostLikeResponse = z.infer<typeof PostLikeResponseSchema>;

export const LikesApi = {
  add: async (payload: { username: string; postId: number }) => {
    const res = await ApiClient.post<{ success?: boolean }>(`/api/posts/like`, payload);
    return LikeToggleSchema.parse(res);
  },
  remove: async (payload: { username: string; postId: number }) => {
    const res = await ApiClient.delete<{ success?: boolean }>(`/api/posts/like`, payload);
    return LikeToggleSchema.parse(res);
  },
  get: async (postId: number) => {
    const res = await ApiClient.get<PostLikeResponse>(`/api/posts/${postId}/likes`);
    return PostLikeResponseSchema.parse(res);
  },
};


