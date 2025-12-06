// Base API client with automatic token refresh and helpers
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export const ACCESS_TOKEN_KEY = 'authToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const USERNAME_KEY = 'username';
export const MODERATOR_FLAG_KEY = 'isModerator';

type AuthMetadata = {
  username?: string;
  isModerator?: boolean;
};

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const setAuthMetadata = (metadata: AuthMetadata): void => {
  try {
    if (metadata.username !== undefined) {
      localStorage.setItem(USERNAME_KEY, metadata.username);
    }

    if (metadata.isModerator !== undefined) {
      localStorage.setItem(MODERATOR_FLAG_KEY, metadata.isModerator ? 'true' : 'false');
    }
  } catch {
    // Ignore storage failures (e.g., private mode)
  }
};

const readBooleanFlag = (key: string): boolean => {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
};

export const isModeratorUser = (): boolean => readBooleanFlag(MODERATOR_FLAG_KEY);

export const clearTokens = (): void => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(MODERATOR_FLAG_KEY);
  } catch {
    // Ignore storage failures
  }
};

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
  setAuthMetadata({ username: data.username,  isModerator: data.isModerator });
  return true;
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const authBypass = [
    '/api/sessions',
    '/api/refresh-token',
  ];
  const attachAuth = token && !authBypass.some(p => endpoint.startsWith(p));
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (attachAuth) headers['Authorization'] = `Bearer ${token}`;

  const doFetch = (hdrs: Record<string, string>) =>
    fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers: hdrs });

  let response = await doFetch(headers);

  if (response.status === 401) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${getAccessToken()}`,
      } as Record<string, string>;
      response = await doFetch(retryHeaders);
    }
  }

  if (!response.ok) {
    // Try to parse error message from response body
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If parsing fails, use the default error message
    }

    if (response.status === 401) {
      const method = (options.method || 'GET').toString().toUpperCase();
      const isDeleteAccount = method === 'DELETE' && endpoint.startsWith('/api/users/');
      const isLogin = endpoint === '/api/sessions';
      
      if (isDeleteAccount) {
        throw new Error('Incorrect password');
      }

      // Don't redirect on login failures - just throw the error
      if (isLogin) {
        throw new Error(errorMessage);
      }
      clearTokens();
      if (!window.location.pathname.startsWith('/auth')) {
        console.log('Redirecting to login due to unauthorized API response');
        window.location.href = '/auth/login';
      }
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const ApiClient = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, { method: 'POST', body: normalizeBody(body) }),
  put: <T>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, { method: 'PUT', body: normalizeBody(body) }),
  patch: <T>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, { method: 'PATCH', body: normalizeBody(body) }),
  delete: <T>(endpoint: string, body?: unknown) => apiFetch<T>(endpoint, { method: 'DELETE', body: normalizeBody(body) }),
};

export type LoginResponse = {
  token: string;
  refreshToken: string;
  userId: number;
  username: string;
  isAdmin: boolean;
  isModerator: boolean;
};

function normalizeBody(body?: unknown): BodyInit | undefined {
  if (body == null) return undefined;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return body;
  return JSON.stringify(body);
}
