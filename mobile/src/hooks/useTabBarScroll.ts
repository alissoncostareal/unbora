import { useCallback, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { useTabBarStore } from '@/stores/tabBarStore';

const DEFAULT_THRESHOLD = 6;

/**
 * Mantém a barra de navegação editorial sempre acessível e estável.
 */
export function useTabBarScroll(_threshold = DEFAULT_THRESHOLD) {
  const setVisible = useTabBarStore((s) => s.setVisible);

  const onScroll = useCallback(
    () => {
      setVisible(true);
    },
    [setVisible],
  );

  return { onScroll, scrollEventThrottle: 16 as const };
}
