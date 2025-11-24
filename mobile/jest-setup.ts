import 'react-native-gesture-handler/jestSetup';

// Silence `useNativeDriver` warning (path differs across RN versions)
try {
  jest.mock('react-native/Libraries/Animated/src/NativeAnimatedHelper');
} catch {
  try {
    jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
  } catch {
    // ignore if module not found in this environment
  }
}

// Filter out noisy RN warnings during tests to keep output clean
const originalWarn = console.warn;
const originalError = console.error;
const silenceAllLogs = true; // set to false if you need to debug locally
const suppressedPatterns = [
  /useNativeDriver/i,
  /Require cycle:/i,
  /VirtualizedLists should never be nested/i,
  /not wrapped in act/i,
  /An update to .*not wrapped in act/i,
  /Warning:.*not wrapped in act/i,
];

const shouldSuppress = (args: any[]) => {
  const message = args
    .map((a) => {
      if (typeof a === 'string') return a;
      if (a instanceof Error && a.message) return a.message;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(' ');
  return suppressedPatterns.some((re) => re.test(message));
};

console.warn = (...args: any[]) => {
  if (silenceAllLogs) return;
  if (shouldSuppress(args)) return;
  originalWarn(...args);
};

console.error = (...args: any[]) => {
  if (silenceAllLogs) return;
  if (shouldSuppress(args)) return;
  originalError(...args);
};
