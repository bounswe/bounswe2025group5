import { ApiClient } from './client';
import { UserCountResponseSchema, type UserCountResponse } from './schemas/users';
import { ProfileResponseSchema, type ProfileResponse } from './schemas/profile';

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
};

