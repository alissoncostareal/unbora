import { useCallback, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { useTabBarStore } from '@/stores/tabBarStore';

const DEFAULT_THRESHOLD = 6;

/**
 * Esconde o menu flutuante ao rolar para baixo e mostra ao subir (estilo Instagram).
 */
export function useTabBarScroll(threshold = DEFAULT_THRESHOLD) {
  const lastY = useRef(0);
  const setVisible = useTabBarStore((s) => s.setVisible);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = Math.max(0, event.nativeEvent.contentOffset.y);
      const delta = y - lastY.current;

      if (y <= 12) {
        setVisible(true);
      } else if (delta > threshold) {
        setVisible(false);
      } else if (delta < -threshold) {
        setVisible(true);
      }

      lastY.current = y;
    },
    [setVisible, threshold],
  );

  return { onScroll, scrollEventThrottle: 16 as const };
}
