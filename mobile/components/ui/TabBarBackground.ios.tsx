import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BlurTabBarBackground() {
  return (
    <BlurView
      // System chrome material automatically adapts to the system's theme
      // and matches the native tab bar appearance on iOS.
      tint="systemChromeMaterial"
      intensity={100}
      style={StyleSheet.absoluteFill}
    />
  );
}

export function useBottomTabOverflow() {
  const { bottom } = useSafeAreaInsets();
  let tabHeight = bottom;
  try {
    tabHeight = useBottomTabBarHeight();
  } catch {
    // If we're not inside a tab navigator, fall back to safe-area bottom inset
    tabHeight = bottom;
  }
  return Math.max(0, tabHeight - bottom);
}
