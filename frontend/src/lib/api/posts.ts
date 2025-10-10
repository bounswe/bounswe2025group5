import { ApiClient } from './client';

export type PostItem = {
  postId: number;
  content: string;
  createdAt: string;
  username: string;
  photoUrl?: string | null;
  likes?: number;
  comments?: number;
};

export const PostsApi = {
  list: (params: { size: number; username?: string; lastPostId?: number }) => {
    const query = new URLSearchParams();
    query.set('size', String(params.size));
    if (params.username) query.set('username', params.username);
    if (params.lastPostId != null) query.set('lastPostId', String(params.lastPostId));
    return ApiClient.get<PostItem[]>(`/api/posts?${query.toString()}`);
  },
  listMostLiked: (params: { size: number; username?: string }) => {
    const query = new URLSearchParams();
    query.set('size', String(params.size));
    if (params.username) query.set('username', params.username);
    query.set('mostLiked', 'true');
    return ApiClient.get<PostItem[]>(`/api/posts?${query.toString()}`);
  },
};

