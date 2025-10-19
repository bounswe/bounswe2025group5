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

  // Comprehensive request logging for debugging
  console.group(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`);
  console.log('📍 Full URL:', `${API_BASE_URL}${endpoint}`);
  console.log('📋 Headers:', headers);
  console.log('📦 Body:', options.body);
  if (options.body && !isFormData) {
    try {
      console.log('📄 Body (parsed):', JSON.parse(options.body as string));
    } catch (e) {
      console.log('📄 Body (raw string):', options.body);
    }
  }
  console.log('⚙️ Options:', options);
  
  // 🔥 POSTMAN COMPARISON HELPER 🔥
  console.log('🔗 COPY FOR POSTMAN:');
  console.log(`   URL: ${API_BASE_URL}${endpoint}`);
  console.log(`   Method: ${options.method || 'GET'}`);
  console.log('   Headers:');
  Object.entries(headers).forEach(([key, value]) => {
    console.log(`     ${key}: ${value}`);
  });
  if (options.body && !isFormData) {
    console.log('   Body (JSON):');
    console.log(options.body);
  }
  console.groupEnd();

  const doFetch = (hdrs: Record<string, string>) =>
    fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers: hdrs });

  let response = await doFetch(headers);

  // Log initial response
  console.group(`📨 API Response: ${response.status} ${response.statusText}`);
  console.log('🔍 Status:', response.status);
  console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
  console.groupEnd();

  if (response.status === 401) {
    console.log('🔄 Attempting token refresh...');
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      console.log('✅ Token refreshed, retrying request...');
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${getAccessToken()}`,
      } as Record<string, string>;
      response = await doFetch(retryHeaders);
      
      // Log retry response
      console.group(`📨 Retry Response: ${response.status} ${response.statusText}`);
      console.log('🔍 Status:', response.status);
      console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
      console.groupEnd();
    } else {
      console.log('❌ Token refresh failed');
    }
  }

  if (!response.ok) {
    console.error(`❌ API Error: ${response.status} ${response.statusText}`);
    if (response.status === 401) {
      const method = (options.method || 'GET').toString().toUpperCase();
      const isDeleteAccount = method === 'DELETE' && endpoint.startsWith('/api/users/');
      if (isDeleteAccount) {
        throw new Error('Incorrect password');
      }
      console.log('🚪 Redirecting to login due to 401...');
      clearTokens();
      localStorage.removeItem('username');
      window.location.href = '/auth/login';
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const responseData = await response.json();
  console.log('✅ Success Response Data:', responseData);
  
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
