/**
 * Utility functions for color management
 * 
 * These functions help with dynamic color selection based on app logic
 */

import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';

/**
 * Get progress bar color based on waste percentage
 * Used in WasteGoal and Challenge progress tracking
 * 
 * @param percentage - Progress percentage (0-100+)
 * @param colorScheme - Current color scheme ('light' | 'dark')
 * @returns Color string for the progress level
 */
export const getProgressColor = (percentage: number, colorScheme: 'light' | 'dark' = 'light') => {
  const colors = Colors[colorScheme];
  
  if (percentage < 14.3) {
    return colors.progressExcellent;
  } else if (percentage < 28.6) {
    return colors.progressGood;
  } else if (percentage < 42.9) {
    return colors.progressFair;
  } else if (percentage < 57.1) {
    return colors.progressCaution;
  } else if (percentage < 71.4) {
    return colors.progressConcern;
  } else if (percentage < 85.7) {
    return colors.progressBad;
  } else {
    return colors.progressCritical;
  }
};

/**
 * Hook version of getProgressColor for easy use in components
 */
export const useProgressColor = (percentage: number) => {
  const colorScheme = useColorScheme();
  return getProgressColor(percentage, colorScheme ?? 'light');
};

/**
 * Get switch colors for React Native Switch component
 * Returns proper colors for the current theme
 */
export const useSwitchColors = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return {
    thumbColor: colors.switchThumb,
    trackColor: {
      false: colors.switchTrackInactive,
      true: colors.switchTrackActive,
    },
  };
};