import React from 'react';
import { TextStyle } from 'react-native';
import { ThemedText, type ThemedTextProps } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { pickAccessibleTextColor } from '@/utils/contrast';

export type AccessibleTextProps = ThemedTextProps & {
  /** explicit background color hex (e.g. '#ffffff') to compute contrast against */
  backgroundColor?: string;
  /** or a theme token name from Colors to use as background (e.g. 'cardBackground') */
  backgroundToken?: keyof typeof Colors.light & keyof typeof Colors.dark;
  /** set true when the text is considered large UI text and can use the 3:1 threshold */
  isLargeText?: boolean;
};

export function AccessibleText({
  backgroundColor,
  backgroundToken,
  isLargeText = false,
  style,
  ...rest
}: AccessibleTextProps) {
  const theme = useColorScheme() ?? 'light';

  let bg: string | undefined = backgroundColor;
  if (!bg && backgroundToken) {
    try {
      bg = Colors[theme][backgroundToken] as string;
    } catch (e) {
      bg = undefined;
    }
  }

  // Candidates prefer theme text, then black/white as fallbacks
  const candidates = [Colors[theme].text || '#000000', '#000000', '#ffffff'];
  let computedColor: string | undefined = undefined;
  try {
    if (bg) computedColor = pickAccessibleTextColor(bg, { candidates, isLargeText });
  } catch (e) {
    // ignore and fall back to default ThemedText behavior
  }

  const composedStyle: TextStyle[] = [];
  if (style) composedStyle.push(style as TextStyle);
  if (computedColor) composedStyle.push({ color: computedColor });

  return <ThemedText style={composedStyle} {...rest} />;
}

export default AccessibleText;
