import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';
import { lightColors, darkColors } from '@/constants/theme';

export function useColors() {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useColorScheme();

  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  return { colors: isDark ? darkColors : lightColors, isDark };
}
