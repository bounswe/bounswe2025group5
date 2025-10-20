import { ApiClient } from './client';
import { z } from 'zod';
import { LeaderboardEntrySchema, type LeaderboardItem } from './schemas/leaderboard';

export const ChallengeSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().optional(),
}).passthrough();

export const AttendChallengeResponseSchema = z.object({ success: z.boolean().optional() }).passthrough();
export const LeaveChallengeResponseSchema = z.object({ success: z.boolean().optional() }).passthrough();
export const EndChallengeResponseSchema = z.object({ success: z.boolean().optional() }).passthrough();
export const LogChallengeResponseSchema = z.object({
    username: z.string().min(1),
    challengeId: z.number().int(),
    newTotalAmount: z.number().nullable().optional()
}).passthrough();

export const ChallengesApi = {
  create: async (payload: Record<string, unknown>) => {
    const res = await ApiClient.post<unknown>(`/api/challenges`, payload);
    return ChallengeSchema.parse(res);
  },
  end: async (id: number) => {
    const res = await ApiClient.patch<unknown>(`/api/challenges/${id}`);
    return EndChallengeResponseSchema.parse(res);
  },
  attend: async (id: number, payload: Record<string, unknown>) => {
    const res = await ApiClient.post<unknown>(`/api/challenges/${id}/attendees`, payload);
    return AttendChallengeResponseSchema.parse(res);
  },
  leave: async (challengeId: number, username: string) => {
    const res = await ApiClient.delete<unknown>(`/api/challenges/${challengeId}/attendees/${encodeURIComponent(username)}`);
    return LeaveChallengeResponseSchema.parse(res);
  },
  logChallengeProgress: async (id: number, payload: Record<string, unknown>) => {
    const res = await ApiClient.post<unknown>(`/api/challenges/${id}/log`, payload);
    return LogChallengeResponseSchema.parse(res);
  },
  getLeaderboard: async (id: number): Promise<LeaderboardItem[]> => {
    const data = await ApiClient.get<LeaderboardItem[]>(`/api/challenges/${id}/leaderboard`);
    data.forEach(item => LeaderboardEntrySchema.parse(item));
    return data;
  }
};


