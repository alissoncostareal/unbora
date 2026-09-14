import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

import {
  getThemeColors,
  type ColorScheme,
  type ThemeColors,
  type ThemePreference,
} from '@/theme/colors';
import { useThemeStore } from '@/stores/themeStore';
import type { UnboraDayPeriod } from '@/types';

function resolveScheme(
  preference: ThemePreference,
  system: ColorSchemeName,
): ColorScheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return system === 'dark' ? 'dark' : 'light';
}

/** Tema claro/escuro (Instagram-style), mesma marca. */
export function useDayTheme(): {
  period: UnboraDayPeriod;
  colors: ThemeColors;
  scheme: ColorScheme;
  preference: ThemePreference;
} {
  const preference = useThemeStore((s) => s.preference);
  const [system, setSystem] = useState<ColorSchemeName>(Appearance.getColorScheme() ?? 'light');

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystem(colorScheme ?? 'light');
    });
    return () => sub.remove();
  }, []);

  const scheme = resolveScheme(preference, system);
  const colors = getThemeColors(scheme);

  return {
    period: colors.period,
    colors,
    scheme,
    preference,
  };
}
