// Base API client with automatic token refresh and helpers
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
//const API_BASE_URL = "http://localhost:8080";

export const ACCESS_TOKEN_KEY = 'authToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
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
  try { localStorage.setItem('username', data.username); } catch {}
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

  const responseData = await response.json();
  return responseData;
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
