import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ThemeColors } from './colors';

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';
  return { ...(isDark ? darkColors : lightColors), isDark };
}
