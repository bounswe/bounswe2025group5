import { ApiClient } from './client';
import { z } from 'zod';

export const CommentSchema = z.object({
  commentId: z.number().int().optional(),
  content: z.string(),
  username: z.string().optional(),
  creatorUsername: z.string().optional(),
  createdAt: z.string().optional(),
}).passthrough();

export const GetCommentsResponseSchema = z.object({
  postId: z.number().int().optional(),
  comments: z.array(CommentSchema),
});

export type Comment = z.infer<typeof CommentSchema>;
export type GetCommentsResponse = z.infer<typeof GetCommentsResponseSchema>;

export const CommentsApi = {
  add: async (postId: number, payload: { content: string; username: string }) => {
    const res = await ApiClient.post<Comment>(`/api/posts/${postId}/comments`, payload);
    return CommentSchema.parse(res);
  },
  list: async (postId: number) => {
    const res = await ApiClient.get<GetCommentsResponse>(`/api/posts/${postId}/comments`);
    return GetCommentsResponseSchema.parse(res);
  },
  update: async (commentId: number, payload: { content: string; username: string }) => {
    const res = await ApiClient.put<Comment>(`/api/posts/comment/${commentId}`, payload);
    return CommentSchema.parse(res);
  },
  remove: async (commentId: number) => {
    return ApiClient.delete<{ success?: boolean }>(`/api/posts/comment/${commentId}`);
  },
};


