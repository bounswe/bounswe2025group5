// API configuration
//const API_BASE_URL = 'http://localhost:8080';
const API_BASE_URL = 'http://159.89.24.3:8080';

// Storage helpers
const ACCESS_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const getAuthToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const setAuthToken = (token: string): void => {
  // backward-compat helper (stores only access token)
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const clearAuthToken = (): void => {
  // backward-compat helper (clears only access token)
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

// Internal: attempt token refresh
async function tryRefreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const resp = await fetch(`${API_BASE_URL}/api/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!resp.ok) return false;

  const data: {
    token: string;
    refreshToken: string;
    userId: number;
    username: string;
    isAdmin: boolean;
    isModerator: boolean;
  } = await resp.json();

  setTokens(data.token, data.refreshToken);
  return true;
}

// Generic fetch wrapper with authentication + auto refresh
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const doFetch = () =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

  let response = await doFetch();

  if (response.status === 401) {
    // try one refresh
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      const retryHeaders: Record<string, string> = {
        ...headers,
        Authorization: `Bearer ${getAuthToken()}`,
      };
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: retryHeaders,
      });
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// API: Users
export const userApi = {
  getUserCount: () => fetchApi<{ userCount: number }>('/api/users/count'),
};

// API: Auth
export const authApi = {
  login: (emailOrUsername: string, password: string) =>
    fetchApi<{
      token: string;
      refreshToken: string;
      userId: number;
      username: string;
      isAdmin: boolean;
      isModerator: boolean;
    }>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password }),
    }),

  register: (username: string, email: string, password: string) =>
    fetchApi<{ message: string; username: string; email: string }>(
      '/api/users',
      {
        method: 'POST',
        body: JSON.stringify({ email, username, password }),
      }
    ),
};

