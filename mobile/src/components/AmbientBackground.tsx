import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ThemeColors } from '@/theme/colors';

/** Fundo limpo e plano para todo o aplicativo. */
export function AmbientBackground({
  colors,
  children,
}: {
  colors: ThemeColors;
  children: ReactNode;
}) {
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
