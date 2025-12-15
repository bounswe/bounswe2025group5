// services/apiClient.ts
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
  skipJson?: boolean;
};

const isAbsoluteUrl = (v: string) => /^https?:\/\//i.test(v);
const isFormData = (b: any): b is FormData =>
  typeof FormData !== 'undefined' && b instanceof FormData;

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}
export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}
export async function storeSession(res: LoginResponse) {
  const entries: [string, string][] = [
    [ACCESS_TOKEN_KEY, res.token],
    [REFRESH_TOKEN_KEY, res.refreshToken],
    [USERNAME_KEY, res.username],
  ];
  if (res.userId != null) entries.push([USER_ID_KEY, String(res.userId)]);
  if (res.isAdmin !== undefined) entries.push([IS_ADMIN_KEY, JSON.stringify(res.isAdmin)]);
  if (res.isModerator !== undefined) entries.push([IS_MODERATOR_KEY, JSON.stringify(res.isModerator)]);
  await AsyncStorage.multiSet(entries);
}
export async function clearSession() {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USERNAME_KEY,
    USER_ID_KEY, IS_ADMIN_KEY, IS_MODERATOR_KEY,
  ]);
}

async function buildHeadersWithAuth(headers: HeadersInitLike, auth: boolean) {
  const merged = new Headers(headers ?? {});
  if (auth) {
    const token = await getAccessToken();
    if (token) merged.set('Authorization', `Bearer ${token}`);
    else merged.delete('Authorization');
  }
  return merged;
}

let refreshPromise: Promise<boolean> | null = null;

export async function refreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        await clearSession();
        return false;
      }
      const r = await fetch(apiUrl('/api/refresh-token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!r.ok) {
        await clearSession();
        return false;
      }
      const data: LoginResponse = await r.json();
      await storeSession(data);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/** Core wrapper. JSON by default; handles FormData without forcing Content-Type. */
export async function apiRequest(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { auth = true, useApiUrl = true, skipJson = false, ...init } = options;
  const url = useApiUrl && !isAbsoluteUrl(path) ? apiUrl(path) : path;

  const req: RequestInit = { ...init };
  const bodyIsFD = isFormData(req.body);

  // JSON-encode plain objects (not FormData / Blob / ArrayBuffer)
  if (req.body && !bodyIsFD && !skipJson && typeof req.body === 'object'
      && !(req.body instanceof ArrayBuffer) && !(req.body instanceof Blob)) {
    req.body = JSON.stringify(req.body);
    const h = new Headers(req.headers ?? {});
    if (!h.has('Content-Type')) h.set('Content-Type', 'application/json');
    if (!h.has('Accept')) h.set('Accept', 'application/json');
    req.headers = h;
  }

  let headers = await buildHeadersWithAuth(req.headers, auth);

  if (bodyIsFD) {
    headers.delete('Content-Type');
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  } else {
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  }

  req.headers = headers;

  let res = await fetch(url, req);
  if (auth && (res.status === 401 || res.status === 403)) {
    const ok = await refreshTokens();
    if (ok) {
      headers = await buildHeadersWithAuth(req.headers, auth);
      if (bodyIsFD) headers.delete('Content-Type');
      req.headers = headers;
      res = await fetch(url, req);
    }
  }
  return res;
}

/** Small helpers (same file, no new modules) */
export async function get<T = any>(path: string, opts: Omit<ApiRequestOptions, 'method'> = {}) {
  const r = await apiRequest(path, { ...opts, method: 'GET' });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}
export async function post<T = any>(path: string, body?: any, opts: Omit<ApiRequestOptions, 'method'|'body'> = {}) {
  const r = await apiRequest(path, { ...opts, method: 'POST', body });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}
export async function put<T = any>(path: string, body?: any, opts: Omit<ApiRequestOptions, 'method'|'body'> = {}) {
  const r = await apiRequest(path, { ...opts, method: 'PUT', body });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}
/** For multipart uploads */
export async function postForm<T = any>(path: string, form: FormData, opts: Omit<ApiRequestOptions, 'method'|'body'> = {}) {
  const r = await apiRequest(path, { ...opts, method: 'POST', body: form, skipJson: true });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}

export async function login(emailOrUsername: string, password: string): Promise<LoginResponse> {
  const r = await fetch(apiUrl('/api/sessions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ emailOrUsername, password }),
  });
  if (!r.ok) throw new Error(await r.text() || 'Login failed');
  const data: LoginResponse = await r.json();
  await storeSession(data);
  return data;
}

export async function register(username: string, email: string, password: string) {
  const r = await fetch(apiUrl('/api/users'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  if (!r.ok) throw new Error(await r.text() || 'Registration failed');
  return r.json();
}

/** Follow API methods */

/**
 * Get follow statistics for a user (follower count, following count)
 */
export async function getFollowStats(username: string): Promise<{ followerCount: number; followingCount: number }> {
  const encoded = encodeURIComponent(username);
  return get(`/api/users/${encoded}/follow-stats`);
}

/**
 * Get list of followers for a user (paginated)
 */
export async function getFollowersList(username: string, page: number = 0, limit: number = 20) {
  const encoded = encodeURIComponent(username);
  return get(`/api/users/${encoded}/followers?page=${page}&limit=${limit}`);
}

/**
 * Get list of users that a user is following (paginated)
 */
export async function getFollowingsList(username: string, page: number = 0, limit: number = 20) {
  const encoded = encodeURIComponent(username);
  return get(`/api/users/${encoded}/followings?page=${page}&limit=${limit}`);
}

/**
 * Check if the authenticated user is following a target user
 */
export async function isFollowingUser(targetUsername: string): Promise<boolean> {
  try {
    const encoded = encodeURIComponent(targetUsername);
    const response = await get(`/api/users/*/is-following/${encoded}`, { auth: true });
    return response === true || response?.isFollowing === true;
  } catch (err) {
    console.warn('Failed to check follow status:', err);
    return false;
  }
}

/**
 * Follow a user (authenticated)
 */
export async function followUser(targetUsername: string): Promise<void> {
  const encoded = encodeURIComponent(targetUsername);
  await post(`/api/users/*/follow/${encoded}`, null, { auth: true });
}

/**
 * Unfollow a user (authenticated)
 */
export async function unfollowUser(targetUsername: string): Promise<void> {
  const encoded = encodeURIComponent(targetUsername);
  const res = await apiRequest(`/api/users/*/unfollow/${encoded}`, {
    method: 'DELETE',
    auth: true,
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
}

/** Get stored username from AsyncStorage */
export async function getStoredUsername(): Promise<string | null> {
  return AsyncStorage.getItem(USERNAME_KEY);
}

/** Report API */
export type ReportType = 'Spam' | 'Hate Speech' | 'Violence' | 'Other';
export type ReportContentType = 'Post' | 'Comment';

export interface SubmitReportPayload {
  reporterName: string;
  description: string;
  type: ReportType;
  contentType: ReportContentType;
  objectId: number;
}

export async function submitReport(payload: SubmitReportPayload): Promise<void> {
  const r = await apiRequest('/api/reports', {
    method: 'POST',
    body: payload as any,
  });
  if (!r.ok) {
    throw new Error(await r.text());
  }
}

// Feedback API
export type SubmitFeedbackPayload = {
  feedbackerUsername: string;
  contentType: string;
  content: string;
};

export async function submitFeedback(payload: SubmitFeedbackPayload): Promise<void> {
  const r = await apiRequest('/api/feedback', {
    method: 'POST',
    body: payload as any,
  });
  if (!r.ok) {
    throw new Error(await r.text());
  }
}
