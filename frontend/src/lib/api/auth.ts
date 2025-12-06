import { ApiClient, setTokens, setAuthMetadata } from './client';
import type { LoginResponse } from './client';
import { LoginResponseSchema } from './schemas/auth';

export const AuthApi = {
  login: async (emailOrUsername: string, password: string) => {
    const data = await ApiClient.post<LoginResponse>('/api/sessions', { emailOrUsername, password });
    LoginResponseSchema.parse(data);
    return data;
  },

  register: (username: string, email: string, password: string) =>
    ApiClient.post<{ message: string; username: string; email: string }>(
      '/api/users',
      { email, username, password }
    ),
};

export { setTokens, setAuthMetadata };

