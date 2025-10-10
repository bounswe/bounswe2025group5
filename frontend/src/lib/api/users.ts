import { ApiClient } from './client';
import { UserCountResponseSchema, type UserCountResponse } from './schemas/users';

export const UsersApi = {
  getUserCount: async (): Promise<UserCountResponse> => {
    const data = await ApiClient.get<UserCountResponse>('/api/users/count');
    UserCountResponseSchema.parse(data);
    return data;
  },
};

