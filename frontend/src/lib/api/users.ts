import { ApiClient } from './client';
import { UserCountResponseSchema, type UserCountResponse, SavedPostItemSchema, type SavedPostItem } from './schemas/users';
import { PostItemSchema, type PostItem } from './schemas/posts';
import { ChallengeListItemSchema, type ChallengeListItem } from './schemas/challenges';
import { ProfileResponseSchema, type ProfileResponse } from './schemas/profile';
import {
  WasteGoalItemSchema,
  type WasteGoalItem,
  CreateWasteGoalResponseSchema,
  type CreateWasteGoalResponse,
  DeleteWasteGoalResponseSchema,
  type DeleteWasteGoalResponse,
  WasteItemSchema,
  type WasteItem,
} from './schemas/goals';

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
    return ApiClient.delete<{ deleted?: boolean }>(`/api/users/${encodeURIComponent(username)}`, {
      password,
    });
  },
  listChallenges: async (username: string): Promise<ChallengeListItem[]> => {
    const data = await ApiClient.get<ChallengeListItem[]>(`/api/challenges/${encodeURIComponent(username)}`);
    data.forEach(item => ChallengeListItemSchema.parse(item));
    return data;
  },
  getSavedPosts: async (username: string): Promise<SavedPostItem[]> => {
    const data = await ApiClient.get<SavedPostItem[]>(`/api/users/${encodeURIComponent(username)}/saved-posts`);
    data.forEach(item => SavedPostItemSchema.parse(item));
    return data;
  },
  getPosts: async (username: string): Promise<PostItem[]> => {
    const data = await ApiClient.get<PostItem[]>(`/api/users/${encodeURIComponent(username)}/posts`);
    data.forEach(item => PostItemSchema.parse(item));
    return data;
  },
  listGoals: async (username: string, size = 20, lastGoalId?: number): Promise<WasteGoalItem[]> => {
    const qs = new URLSearchParams({ size: String(size) });
    if (lastGoalId != null) qs.set('lastGoalId', String(lastGoalId));
    const data = await ApiClient.get<WasteGoalItem[]>(`/api/users/${encodeURIComponent(username)}/waste-goals?${qs.toString()}`);
    data.forEach(item => WasteGoalItemSchema.parse(item));
    return data;
  },
  createWasteGoal: async (username: string, payload: { duration: number; restrictionAmountGrams: number; type: string }): Promise<CreateWasteGoalResponse> => {
    const res = await ApiClient.post<CreateWasteGoalResponse>(`/api/users/${encodeURIComponent(username)}/waste-goals`, payload);
    return CreateWasteGoalResponseSchema.parse(res);
  },
  editWasteGoal: async (goalId: number, payload: { duration: number; restrictionAmountGrams: number; type: string }): Promise<CreateWasteGoalResponse> => {
    const res = await ApiClient.put<CreateWasteGoalResponse>(`/api/users/waste-goals/${goalId}`, payload);
    return CreateWasteGoalResponseSchema.parse(res);
  },
  deleteWasteGoal: async (goalId: number): Promise<DeleteWasteGoalResponse> => {
    const res = await ApiClient.delete<DeleteWasteGoalResponse>(`/api/users/waste-goals/${goalId}`);
    return DeleteWasteGoalResponseSchema.parse(res);
  },
  listWasteItemsForGoal: async (goalId: number): Promise<WasteItem[]> => {
    const data = await ApiClient.get<WasteItem[]>(`/api/users/waste-goals/${goalId}/items`);
    data.forEach(item => WasteItemSchema.parse(item));
    return data;
  },
};

