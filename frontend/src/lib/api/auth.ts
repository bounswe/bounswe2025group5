import { ApiClient, setTokens } from './client';
import type { LoginResponse } from './client';

export const AuthApi = {
  login: (emailOrUsername: string, password: string) =>
    ApiClient.post<LoginResponse>('/api/sessions', { emailOrUsername, password }),

  register: (username: string, email: string, password: string) =>
    ApiClient.post<{ message: string; username: string; email: string }>(
      '/api/users',
      { email, username, password }
    ),
};

export { setTokens };

