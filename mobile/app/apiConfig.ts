import { Platform } from 'react-native';

type GlobalWithLocation = typeof globalThis & { location?: { hostname?: string } };

const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const envHost = process.env.EXPO_PUBLIC_API_HOST;
const envPort = process.env.EXPO_PUBLIC_API_PORT ?? '8080';

const browserHost =
  Platform.OS === 'web' && typeof globalThis !== 'undefined'
    ? (globalThis as GlobalWithLocation).location?.hostname
    : undefined;

export const API_HOST = envHost ?? browserHost ?? 'localhost';
export const API_PORT = envPort;
export const API_BASE_URL = envBaseUrl ?? `http://${API_HOST}:${API_PORT}`;

export const apiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

