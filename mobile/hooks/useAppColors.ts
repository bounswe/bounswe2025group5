/**
 * Custom hook for accessing app colors based on current theme
 * 
 * Usage:
 * const colors = useAppColors();
 * style={{ backgroundColor: colors.cardBackground }}
 * 
 * This hook automatically detects light/dark mode and returns appropriate colors
 */

import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export const useAppColors = () => {
  const colorScheme = useColorScheme();
  return Colors[colorScheme ?? 'light'];
};

// Type for better TypeScript support
export type AppColors = typeof Colors.light;