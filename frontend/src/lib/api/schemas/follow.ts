import { z } from 'zod';

export const FollowActionResponseSchema = z.object({
  follower: z.string().min(1),
  following: z.string().min(1),
  followerCount: z.number().int().nonnegative(),
});

export type FollowActionResponse = z.infer<typeof FollowActionResponseSchema>;

export const FollowUserItemSchema = z.object({
  username: z.string().min(1),
  photoUrl: z.string().nullable().optional(),
});

export type FollowUserItem = z.infer<typeof FollowUserItemSchema>;

export const FollowStatsSchema = z.object({
  followersCount: z.number().int().nonnegative(),
  followingCount: z.number().int().nonnegative(),
});

export type FollowStats = z.infer<typeof FollowStatsSchema>;
