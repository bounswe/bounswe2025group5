import { ApiClient } from './client';
import {
  PostItemSchema,
  type PostItem,
  CreateOrEditPostResponseSchema,
  type CreateOrEditPostResponse,
  DeletePostResponseSchema,
  type DeletePostResponse,
  SavePostResponseSchema,
  type SavePostResponse,
} from './schemas/posts';

export const PostsApi = {
  getById: async (postId: number, username?: string) => {
    const query = new URLSearchParams();
    if (username) query.set('username', username);
    const data = await ApiClient.get<PostItem>(`/api/posts/${postId}?${query.toString()}`);
    return PostItemSchema.parse(data);
  },

  list: async (params: { size: number; username?: string; lastPostId?: number }) => {
    const query = new URLSearchParams();
    query.set('size', String(params.size));
    if (params.username) query.set('username', params.username);
    if (params.lastPostId != null) query.set('lastPostId', String(params.lastPostId));
    const data = await ApiClient.get<PostItem[]>(`/api/posts?${query.toString()}`);
    data.forEach(item => PostItemSchema.parse(item));
    return data;
  },

  listMostLiked: async (params: { size: number; username?: string }) => {
    const query = new URLSearchParams();
    query.set('size', String(params.size));
    if (params.username) query.set('username', params.username);
    const data = await ApiClient.get<PostItem[]>(`/api/posts/mostLiked?${query.toString()}`);
    data.forEach(item => PostItemSchema.parse(item));
    return data;
  },

  create: async (payload: { content: string; username: string; photoFile?: File }) => {
    const form = new FormData();
    form.set('content', payload.content);
    form.set('username', payload.username);
    if (payload.photoFile) form.set('photoFile', payload.photoFile);
    const res = await ApiClient.post<CreateOrEditPostResponse>(`/api/posts`, form);
    return CreateOrEditPostResponseSchema.parse(res);
  },

  edit: async (postId: number, payload: { content?: string; username: string; photoFile?: File }) => {
    const form = new FormData();
    if (payload.content != null) form.set('content', payload.content);
    form.set('username', payload.username);
    if (payload.photoFile) form.set('photoFile', payload.photoFile);
    const res = await ApiClient.put<CreateOrEditPostResponse>(`/api/posts/${postId}`, form);
    return CreateOrEditPostResponseSchema.parse(res);
  },

  remove: async (postId: number) => {
    const res = await ApiClient.delete<DeletePostResponse>(`/api/posts/${postId}`);
    return DeletePostResponseSchema.parse(res);
  },

  save: async (postId: number, payload: { username: string }) => {
    const res = await ApiClient.post<SavePostResponse>(`/api/posts/${postId}/save`, payload);
    return SavePostResponseSchema.parse(res);
  },

  deleteSaved: async (postId: number, username: string) => {
    return ApiClient.delete<{ success?: boolean }>(`/api/posts/${postId}/saves/${encodeURIComponent(username)}`);
  },
};


