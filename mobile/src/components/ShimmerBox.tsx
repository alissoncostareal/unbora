import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

import type { ThemeColors } from '@/theme/colors';
import { radius } from '@/theme/colors';

export function ShimmerBox({
  colors,
  width,
  height,
  style,
}: {
  colors: ThemeColors;
  width: number | `${number}%`;
  height: number;
  style?: ViewStyle;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View
      style={[
        styles.base,
        {
          width,
          height,
          backgroundColor: colors.surfaceStrong,
          borderRadius: radius.sm,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.highlight,
          {
            transform: [{ translateX }],
            backgroundColor: colors.useGlass
              ? 'rgba(255,255,255,0.12)'
              : 'rgba(255,255,255,0.65)',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  highlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
  },
});
