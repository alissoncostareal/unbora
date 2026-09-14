import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';

import type { ThemeColors } from '@/theme/colors';
import { radius } from '@/theme/colors';

export function GlassSurface({
  colors,
  children,
  highlighted = false,
  style,
  contentStyle,
}: {
  colors: ThemeColors;
  children: ReactNode;
  highlighted?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const borderColor = highlighted
    ? colors.primary
    : colors.scheme === 'dark'
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(0, 0, 0, 0.05)';
  const backgroundColor = highlighted ? colors.primaryMuted : colors.surface;
  const borderWidth = highlighted
    ? 1.5
    : colors.scheme === 'dark'
    ? 0
    : StyleSheet.hairlineWidth;

  if (colors.useGlass) {
    return (
      <View
        style={[
          styles.wrapper,
          { borderColor, borderWidth },
          style,
        ]}
      >
        <BlurView intensity={28} tint={colors.scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View
          style={[
            styles.content,
            {
              backgroundColor: highlighted
                ? 'rgba(255, 107, 53, 0.08)'
                : colors.scheme === 'dark'
                ? 'rgba(28, 28, 30, 0.65)'
                : 'rgba(255, 255, 255, 0.65)',
            },
            contentStyle,
          ]}
        >
          {children}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrapper,
        styles.lightCard,
        colors.scheme === 'dark' && styles.lightCardDark,
        {
          backgroundColor,
          borderColor,
          borderWidth,
        },
        style,
      ]}
    >
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  lightCard: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  lightCardDark: {
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    padding: 18,
  },
});
