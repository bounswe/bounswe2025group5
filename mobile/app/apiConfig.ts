import { Platform } from 'react-native';
import Constants from 'expo-constants';

type GlobalWithLocation = typeof globalThis & { location?: { hostname?: string } };

const PROD_BASE_URL = 'https://waste-less.alibartukonca.org';

// Force production backend
const FORCE_PRODUCTION = true;

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

const coerceHost = () =>
  envHost ??
  (Platform.OS === 'web' ? browserHost : undefined) ??
  expoDetectedHost ??
  fallbackHost ??
  'localhost';

const isLocalHost = (host?: string) =>
  !host ||
  host === 'localhost' ||
  host === '127.0.0.1' ||
  host.startsWith('192.168.') ||
  host.startsWith('10.') ||
  host.endsWith('.local');

const buildDevBaseUrl = (host: string) => `http://${host}:${envPort}`;

const resolveBaseUrl = () => {
  // Force production backend if enabled
  if (FORCE_PRODUCTION) {
    return PROD_BASE_URL;
  }

  if (envBaseUrl) return envBaseUrl;

  if (Platform.OS === 'web' && browserHost && !isLocalHost(browserHost)) {
    return `https://${browserHost}`;
  }

  if (typeof __DEV__ === 'boolean' && !__DEV__) {
    return PROD_BASE_URL;
  }

  const host = coerceHost();

  if (!isLocalHost(host) && Platform.OS === 'web') {
    return `https://${host}`;
  }

  return buildDevBaseUrl(host);
};

export const API_HOST = FORCE_PRODUCTION ? 'waste-less.alibartukonca.org' : coerceHost();
export const API_PORT = FORCE_PRODUCTION ? '443' : envPort;
export const API_BASE_URL = resolveBaseUrl();

export const apiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
