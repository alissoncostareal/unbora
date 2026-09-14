import { BlurView } from 'expo-blur';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  InstagramTabIcon,
  TAB_ICON_NAMES,
} from '@/components/InstagramTabIcon';
import { useTabBarStore } from '@/stores/tabBarStore';
import { useDayTheme } from '@/theme/useDayTheme';

/** Altura visual da pill (sem safe area) — use para paddingBottom nas telas */
export const FLOATING_TAB_BAR_HEIGHT = 56;
export const FLOATING_TAB_BAR_GAP = 12;

type FloatingTabBarProps = {
  state: {
    index: number;
    routes: { key: string; name: string; params?: object }[];
  };
  descriptors: Record<
    string,
    {
      options: {
        tabBarAccessibilityLabel?: string;
        href?: string | null;
      };
    }
  >;
  navigation: {
    emit: (event: {
      type: string;
      target: string;
      canPreventDefault?: boolean;
    }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

/**
 * Menu inferior do guia — cápsula leve, cores Unbora (não Instagram).
 */
export function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useDayTheme();
  const visible = useTabBarStore((s) => s.visible);
  const show = useTabBarStore((s) => s.show);
  const bottom = Math.max(insets.bottom, 8) + FLOATING_TAB_BAR_GAP;
  const isDark = colors.scheme === 'dark';
  const tab = {
    active: colors.textPrimary,
    inactive: colors.textMuted,
    pill: isDark ? 'rgba(18, 28, 40, 0.82)' : 'rgba(255, 255, 255, 0.88)',
    pillBorder: colors.border,
    blurTint: (isDark ? 'dark' : 'light') as 'dark' | 'light',
  };
  const hideOffset = FLOATING_TAB_BAR_HEIGHT + bottom + 24;
  const translateY = useRef(new Animated.Value(0)).current;

  const activeRouteName = state.routes[state.index]?.name;

  useEffect(() => {
    show();
  }, [activeRouteName, show]);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : hideOffset,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, hideOffset, translateY]);
  const visibleRoutes = state.routes.filter((route) => {
    const options = descriptors[route.key]?.options;
    if (options?.href === null) return false;
    return Boolean(TAB_ICON_NAMES[route.name]);
  });

  const tabs = visibleRoutes.map((route) => {
    const { options } = descriptors[route.key];
    const focused =
      activeRouteName === route.name ||
      (activeRouteName === 'results' && route.name === 'explore');
    const isCurrentRoute = activeRouteName === route.name;
    const iconName = TAB_ICON_NAMES[route.name] ?? 'home';

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isCurrentRoute && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({ type: 'tabLongPress', target: route.key });
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.item, { opacity: pressed ? 0.65 : 1 }]}
      >
        <InstagramTabIcon
          name={iconName}
          focused={focused}
          color={focused ? tab.active : tab.inactive}
          size={26}
        />
      </Pressable>
    );
  });

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[styles.wrap, { bottom, transform: [{ translateY }] }]}
    >
      <View style={[styles.shadow, isDark && styles.shadowDark]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? (isDark ? 40 : 64) : isDark ? 60 : 80}
          tint={tab.blurTint}
          style={[styles.pill, { borderColor: tab.pillBorder }]}
        >
          <View style={[styles.pillInner, { backgroundColor: tab.pill }]}>{tabs}</View>
        </BlurView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 18,
    right: 18,
    zIndex: 100,
  },
  shadow: {
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  shadowDark: {
    shadowOpacity: 0.4,
  },
  pill: {
    height: FLOATING_TAB_BAR_HEIGHT,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
