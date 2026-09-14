import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '@/theme/colors';
import { spacing } from '@/theme/colors';

/**
 * Loading centralizado estilo apps premium (Instagram / iOS):
 * spinner nativo + uma linha de texto.
 */
export function SearchingLoader({
  colors,
  title = 'Buscando lugares',
  subtitle = 'Isso pode levar alguns segundos',
}: {
  colors: ThemeColors;
  title?: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel={title}>
      <ActivityIndicator size="large" color={colors.textPrimary} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: 14,
  },
  title: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: -6,
  },
});
