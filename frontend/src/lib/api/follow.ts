import { ApiClient } from './client';
import {
  FollowActionResponseSchema,
  type FollowActionResponse,
  FollowUserItemSchema,
  type FollowUserItem,
  FollowStatsSchema,
  type FollowStats,
  IsFollowingResponseSchema,
  type IsFollowingResponse,
} from './schemas/follow';

export const FollowApi = {
  followUser: async (followerUsername: string, followingUsername: string): Promise<FollowActionResponse> => {
    const data = await ApiClient.post<FollowActionResponse>(
      `/api/users/${encodeURIComponent(followerUsername)}/follow/${encodeURIComponent(followingUsername)}`,
      undefined,
    );
    return FollowActionResponseSchema.parse(data);
  },

  unfollowUser: async (followerUsername: string, followingUsername: string): Promise<FollowActionResponse> => {
    const data = await ApiClient.delete<FollowActionResponse>(
      `/api/users/${encodeURIComponent(followerUsername)}/unfollow/${encodeURIComponent(followingUsername)}`,
    );
    return FollowActionResponseSchema.parse(data);
  },

  getFollowers: async (username: string): Promise<FollowUserItem[]> => {
    const data = await ApiClient.get<FollowUserItem[]>(
      `/api/users/${encodeURIComponent(username)}/followers`,
    );
    data.forEach((item) => FollowUserItemSchema.parse(item));
    return data;
  },

  getFollowings: async (username: string): Promise<FollowUserItem[]> => {
    const data = await ApiClient.get<FollowUserItem[]>(
      `/api/users/${encodeURIComponent(username)}/followings`,
    );
    data.forEach((item) => FollowUserItemSchema.parse(item));
    return data;
  },

  getFollowStats: async (username: string): Promise<FollowStats> => {
    const data = await ApiClient.get<FollowStats>(
      `/api/users/${encodeURIComponent(username)}/follow-stats`,
    );
    return FollowStatsSchema.parse(data);
  },

  isFollowing: async (followerUsername: string, followingUsername: string): Promise<boolean> => {
    const data = await ApiClient.get<IsFollowingResponse>(
      `/api/users/${encodeURIComponent(followerUsername)}/is-following/${encodeURIComponent(followingUsername)}`,
    );
    return IsFollowingResponseSchema.parse(data).follow;
  },
};
