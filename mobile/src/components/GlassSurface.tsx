import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';

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
  const borderColor = highlighted ? colors.primary : colors.border;
  const backgroundColor = highlighted ? colors.primaryMuted : colors.surface;
  const borderWidth = highlighted ? 1.5 : 1;

  if (colors.useGlass && Platform.OS !== 'android') {
    return (
      <View
        style={[
          styles.wrapper,
          { borderColor, borderWidth },
          style,
        ]}
      >
        <BlurView intensity={20} tint={colors.scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View
          style={[
            styles.content,
            {
              backgroundColor: highlighted
                ? colors.primaryMuted
                : colors.scheme === 'dark'
                ? 'rgba(28, 25, 23, 0.75)'
                : 'rgba(255, 255, 255, 0.75)',
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
    borderRadius: 0,
    overflow: 'hidden',
  },
  lightCard: {
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  lightCardDark: {
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    padding: 16,
  },
});
