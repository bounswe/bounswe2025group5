import 'react-native-gesture-handler/jestSetup';

// Silence `useNativeDriver` warning
jest.mock('react-native/Libraries/Animated/src/NativeAnimatedHelper');

// Filter out noisy RN warnings during tests to keep output clean
const originalWarn = console.warn;
const originalError = console.error;
const suppressedPatterns = [
  /useNativeDriver/i,
  /Require cycle:/i,
  /VirtualizedLists should never be nested/i,
  /not wrapped in act\\(/i,
  /An update to .*not wrapped in act/i,
];

console.warn = (...args: any[]) => {
  const message = args.join(' ');
  if (suppressedPatterns.some((re) => re.test(message))) return;
  originalWarn(...args);
};

console.error = (...args: any[]) => {
  const message = args.join(' ');
  if (suppressedPatterns.some((re) => re.test(message))) return;
  originalError(...args);
};
