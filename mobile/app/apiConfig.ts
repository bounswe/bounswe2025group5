import { Platform } from 'react-native';
import Constants from 'expo-constants';

type GlobalWithLocation = typeof globalThis & { location?: { hostname?: string } };

const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const envHost = process.env.EXPO_PUBLIC_API_HOST;
const envPort = process.env.EXPO_PUBLIC_API_PORT ?? '8080';

const browserHost =
  Platform.OS === 'web' && typeof globalThis !== 'undefined'
    ? (globalThis as GlobalWithLocation).location?.hostname
    : undefined;

const getExpoHost = () => {
  const hostUri =
    Constants.expoGoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    (Constants.manifest as any)?.debuggerHost;

  if (!hostUri || typeof hostUri !== 'string') return undefined;
  return hostUri.split(':')[0];
};

const expoDetectedHost = Platform.OS === 'web' ? undefined : getExpoHost();

const fallbackHost = Platform.select({
  android: '10.0.2.2',
  default: 'localhost',
});

export const API_HOST =
  envHost ??
  (Platform.OS === 'web' ? browserHost : undefined) ??
  expoDetectedHost ??
  fallbackHost ??
  'localhost';

export const API_PORT = envPort;
export const API_BASE_URL = envBaseUrl ?? `http://${API_HOST}:${API_PORT}`;

export const apiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

