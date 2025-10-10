import { ApiClient } from './client';

export const UsersApi = {
  getUserCount: () => ApiClient.get<{ userCount: number }>('/api/users/count'),
  getSavedPosts: (username: string) =>
    ApiClient.get<Array<{
      postId: number;
      content: string;
      createdAt: string;
      username: string;
      photoUrl?: string | null;
    }>>(`/api/users/${encodeURIComponent(username)}/saved-posts`),
  getUserPosts: (username: string) =>
    ApiClient.get<Array<{
      postId: number;
      content: string;
      createdAt: string;
      username: string;
      photoUrl?: string | null;
    }>>(`/api/users/${encodeURIComponent(username)}/posts`),
};

