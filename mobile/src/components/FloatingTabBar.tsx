import { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EditorialTabIcon,
  TAB_LABELS,
  type TabIconName,
} from '@/components/EditorialTabIcon';
import { useTabBarStore } from '@/stores/tabBarStore';
import { useDayTheme } from '@/theme/useDayTheme';

/** Altura visual da barra (sem safe area) */
export const FLOATING_TAB_BAR_HEIGHT = 56;
export const FLOATING_TAB_BAR_GAP = 0;

const ROUTE_TAB_MAP: Record<string, TabIconName> = {
  home: 'home',
  index: 'home',
  explore: 'explore',
  ratings: 'ratings',
  profile: 'profile',
};

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
 * Barra inferior editorial do Unbora — ancorada na base, elegante, amigável e limpa.
 * Afastada da estética de redes sociais / Instagram.
 */
export function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useDayTheme();
  const visible = useTabBarStore((s) => s.visible);
  const show = useTabBarStore((s) => s.show);

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 10);
  const totalBarHeight = FLOATING_TAB_BAR_HEIGHT + bottomInset;
  const translateY = useRef(new Animated.Value(0)).current;

  const activeRouteName = state.routes[state.index]?.name;

  useEffect(() => {
    show();
  }, [activeRouteName, show]);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : totalBarHeight + 20,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, totalBarHeight, translateY]);

  const visibleRoutes = state.routes.filter((route) => {
    const options = descriptors[route.key]?.options as any;
    if (options?.href === null || route.name === 'create') return false;
    return Boolean(ROUTE_TAB_MAP[route.name]);
  });

  const isDark = colors.scheme === 'dark';
  const barBg = isDark ? '#1C1917' : '#FFFFFF';
  const activeColor = colors.primaryDark;
  const inactiveColor = colors.textMuted;

  const tabs = visibleRoutes.map((route) => {
    const { options } = descriptors[route.key];
    const focused =
      activeRouteName === route.name ||
      (activeRouteName === 'results' && route.name === 'explore');
    const isCurrentRoute = activeRouteName === route.name;
    const tabName = ROUTE_TAB_MAP[route.name] ?? 'home';
    const label = TAB_LABELS[tabName] ?? route.name;

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
        accessibilityLabel={options.tabBarAccessibilityLabel || label}
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.tabItem, { opacity: pressed ? 0.7 : 1 }]}
      >
        <View style={styles.iconContainer}>
          {focused ? (
            <View style={[styles.activeIndicator, { backgroundColor: activeColor }]} />
          ) : (
            <View style={styles.indicatorSpacer} />
          )}
          <EditorialTabIcon
            name={tabName}
            focused={focused}
            color={focused ? activeColor : inactiveColor}
            size={20}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            {
              color: focused ? activeColor : inactiveColor,
              fontWeight: focused ? '700' : '500',
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  });

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.barContainer,
        {
          backgroundColor: barBg,
          borderTopColor: colors.border,
          paddingBottom: bottomInset,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.tabRow}>{tabs}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  tabRow: {
    flexDirection: 'row',
    height: FLOATING_TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  activeIndicator: {
    width: 18,
    height: 2.5,
    borderRadius: 0,
    marginBottom: 3,
  },
  indicatorSpacer: {
    height: 5.5,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
    marginTop: 2,
  },
});
