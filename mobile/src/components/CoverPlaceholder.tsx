import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { ThemeColors } from '@/theme/colors';

/**
 * Capa tipográfica quando não há foto confiável.
 * Sem emoji — só atmosfera de marca + rótulo do tipo/evento.
 */
export function CoverPlaceholder({
  colors,
  label,
  style,
}: {
  colors: ThemeColors;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const isDark = colors.scheme === 'dark';

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: isDark ? '#15262C' : '#DCE8EA' },
        style,
      ]}
    >
      <View
        style={[
          styles.wash,
          {
            backgroundColor: isDark ? 'rgba(251, 113, 133, 0.1)' : 'rgba(232, 93, 76, 0.1)',
          },
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.orbA,
          { backgroundColor: isDark ? 'rgba(251, 113, 133, 0.22)' : 'rgba(232, 93, 76, 0.2)' },
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.orbB,
          { backgroundColor: isDark ? 'rgba(45, 212, 191, 0.14)' : 'rgba(15, 118, 110, 0.14)' },
        ]}
      />
      <View style={styles.content}>
        <Text
          style={[
            styles.brand,
            { color: isDark ? 'rgba(255,255,255,0.4)' : colors.accent },
          ]}
        >
          unbora
        </Text>
        {label ? (
          <Text
            style={[
              styles.label,
              { color: isDark ? 'rgba(255,255,255,0.78)' : colors.textPrimary },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    height: 180,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  wash: {
    ...StyleSheet.absoluteFill,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbA: {
    width: 170,
    height: 170,
    top: -56,
    right: -40,
  },
  orbB: {
    width: 120,
    height: 120,
    bottom: -48,
    left: -28,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 4,
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
