import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getInitials, useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { spacing, type ThemeColors } from '@/theme/colors';
import type { UnboraDayPeriod } from '@/types';

export function AppHeader({
  colors,
  period: _period,
  subtitle,
  title = 'Unbora',
  isFloating,
  hideAvatar,
}: {
  colors: ThemeColors;
  period: UnboraDayPeriod;
  subtitle?: string;
  title?: string;
  isFloating?: boolean;
  hideAvatar?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const city = useLocationStore((s) => s.city);
  const region = useLocationStore((s) => s.region);

  const locationText = subtitle ?? `${city}${region && region !== city ? ` · ${region}` : ''}`;
  const topPad =
    insets.top + (Platform.OS === 'android' ? spacing.xs : spacing.sm);

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: topPad },
        isFloating && styles.floatingWrap,
      ]}
    >
      <View style={styles.brandBlock}>
        <Text
          style={[
            styles.brand,
            { color: isFloating ? '#FFFFFF' : colors.textPrimary },
            isFloating && styles.brandShadow,
            Platform.OS === 'android' && styles.brandAndroid,
          ]}
        >
          {title}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-sharp"
            size={12}
            color={isFloating ? 'rgba(255,255,255,0.85)' : colors.primary}
          />
          <Text
            style={[
              styles.locationText,
              { color: isFloating ? 'rgba(255,255,255,0.85)' : colors.textMuted },
              isFloating && styles.brandShadow,
            ]}
            numberOfLines={1}
          >
            {locationText}
          </Text>
        </View>
      </View>

      {!hideAvatar ? (
        <Pressable
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [
            styles.avatar,
            {
              backgroundColor: isFloating ? '#FFFFFF' : colors.surfaceStrong,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.avatarText, { color: colors.textPrimary }]}>
            {getInitials(user?.name ?? '?')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: Platform.OS === 'android' ? 6 : 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  brand: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  brandAndroid: {
    fontSize: 22,
    letterSpacing: -0.5,
  },
  brandBlock: {
    flexShrink: 1,
    gap: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  brandShadow: {
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 0,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '700', fontSize: 11 },
  floatingWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
});
