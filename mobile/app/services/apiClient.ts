import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiUrl } from '../apiConfig';

export const ACCESS_TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const USERNAME_KEY = 'username';
export const USER_ID_KEY = 'userId';
export const IS_ADMIN_KEY = 'isAdmin';
export const IS_MODERATOR_KEY = 'isModerator';

type HeadersInitLike = HeadersInit | undefined;

export type LoginResponse = {
  token: string;
  refreshToken: string;
  userId?: number;
  username: string;
  isAdmin?: boolean;
  isModerator?: boolean;
};

export type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  useApiUrl?: boolean;
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function storeSession(response: LoginResponse) {
  const entries: [string, string][] = [
    [ACCESS_TOKEN_KEY, response.token],
    [REFRESH_TOKEN_KEY, response.refreshToken],
    [USERNAME_KEY, response.username],
  ];

  if (response.userId !== undefined && response.userId !== null) {
    entries.push([USER_ID_KEY, String(response.userId)]);
  }
  if (response.isAdmin !== undefined) {
    entries.push([IS_ADMIN_KEY, JSON.stringify(response.isAdmin)]);
  }
  if (response.isModerator !== undefined) {
    entries.push([IS_MODERATOR_KEY, JSON.stringify(response.isModerator)]);
  }

  await AsyncStorage.multiSet(entries);
}

export async function clearSession() {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USERNAME_KEY,
    USER_ID_KEY,
    IS_ADMIN_KEY,
    IS_MODERATOR_KEY,
  ]);
}

async function buildHeadersWithAuth(
  headers: HeadersInitLike,
  auth: boolean
): Promise<Headers> {
  const merged = new Headers(headers ?? {});
  if (auth) {
    const token = await getAccessToken();
    if (token) {
      merged.set('Authorization', `Bearer ${token}`);
    } else {
      merged.delete('Authorization');
    }
  }
  return merged;
}

export async function refreshTokens(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await clearSession();
    return false;
  }

  try {
    const response = await fetch(apiUrl('/api/refresh-token'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      await clearSession();
      return false;
    }

    const data: LoginResponse = await response.json();
    await storeSession(data);
    return true;
  } catch (error) {
    console.warn('Failed to refresh tokens', error);
    return false;
  }
}

export async function apiRequest(
  path: string,
  options: ApiRequestOptions = {}
): Promise<Response> {
  const { auth = true, useApiUrl = true, ...init } = options;
  const resolveUrl = () =>
    useApiUrl && !isAbsoluteUrl(path) ? apiUrl(path) : path;

  const requestInit: RequestInit = { ...init };
  requestInit.headers = await buildHeadersWithAuth(init.headers, auth);

  let response = await fetch(resolveUrl(), requestInit);

  if (auth && (response.status === 401 || response.status === 403)) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      requestInit.headers = await buildHeadersWithAuth(init.headers, auth);
      response = await fetch(resolveUrl(), requestInit);
    }
  }

  return response;
}

export async function login(
  emailOrUsername: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(apiUrl('/api/sessions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername, password }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Login failed');
  }

  const data: LoginResponse = await response.json();
  await storeSession(data);
  return data;
}

export async function register(
  username: string,
  email: string,
  password: string
) {
  const response = await fetch(apiUrl('/api/users'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Registration failed');
  }

  return response.json();
}
