// API configuration
//const API_BASE_URL = 'http://localhost:8080';
const API_BASE_URL = 'http://159.89.24.3:8080';


// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Generic fetch wrapper with authentication
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('Token added to headers', token);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// User API methods
export const userApi = {
  getUserCount: () => fetchApi<{ userCount: number }>('/api/users/count'),
};

// Auth API methods
export const authApi = {
  login: (emailOrUsername: string, password: string) =>
    fetchApi<{ 
      token: string; 
      refreshToken: string; 
      userId: number; 
      username: string; 
      isAdmin: boolean; 
      isModerator: boolean 
    }>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password }),
    }),
  
  register: (username: string, email: string, password: string) =>
    fetchApi<{ message: string; username: string; email: string }>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    }),
};

// Store auth token
export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Remove auth token
export const clearAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

