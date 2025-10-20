import { ApiClient } from './client';
import { UserCountResponseSchema, type UserCountResponse } from './schemas/users';
import { ChallengeListItemSchema, type ChallengeListItem } from './schemas/challenges';
import { ProfileResponseSchema, type ProfileResponse } from './schemas/profile';
import { WasteGoalItemSchema, type WasteGoalItem } from './schemas/goals';

export const UsersApi = {
  getUserCount: async (): Promise<UserCountResponse> => {
    const data = await ApiClient.get<UserCountResponse>('/api/users/count');
    UserCountResponseSchema.parse(data);
    return data;
  },
  getProfile: async (username: string): Promise<ProfileResponse> => {
    const qs = new URLSearchParams({ username }).toString();
    const data = await ApiClient.get<ProfileResponse>(`/api/users/${encodeURIComponent(username)}/profile?${qs}`);
    ProfileResponseSchema.parse(data);
    return data;
  },
  updateProfile: async (username: string, biography: string): Promise<ProfileResponse> => {
    const data = await ApiClient.put<ProfileResponse>(`/api/users/${encodeURIComponent(username)}/profile`, {
      username,
      biography,
    });
    ProfileResponseSchema.parse(data);
    return data;
  },
  uploadProfilePhoto: async (username: string, file: File): Promise<ProfileResponse> => {
    const form = new FormData();
    form.append('file', file);
    const data = await ApiClient.post<ProfileResponse>(`/api/users/${encodeURIComponent(username)}/profile/picture`, form as unknown as BodyInit);
    ProfileResponseSchema.parse(data);
    return data;
  },
  deleteAccount: async (username: string, password: string): Promise<{ deleted?: boolean }> => {
    const qs = new URLSearchParams({ password }).toString();
    return ApiClient.delete<{ deleted?: boolean }>(`/api/users/${encodeURIComponent(username)}?${qs}`);
  },
  listChallenges: async (username: string): Promise<ChallengeListItem[]> => {
    const data = await ApiClient.get<ChallengeListItem[]>(`/api/challenges/${encodeURIComponent(username)}`);
    data.forEach(item => ChallengeListItemSchema.parse(item));
    return data;
  },
  listGoals: async (username: string, size = 20, lastGoalId?: number): Promise<WasteGoalItem[]> => {
    const qs = new URLSearchParams({ size: String(size) });
    if (lastGoalId != null) qs.set('lastGoalId', String(lastGoalId));
    const data = await ApiClient.get<WasteGoalItem[]>(`/api/users/${encodeURIComponent(username)}/waste-goals?${qs.toString()}`);
    data.forEach(item => WasteGoalItemSchema.parse(item));
    return data;
  },
};

