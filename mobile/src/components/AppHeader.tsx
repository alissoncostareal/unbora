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
  subtitle: _subtitle,
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

  const topPad = insets.top + (Platform.OS === 'android' ? 6 : 8);
  const displayCity = city.trim() || 'Fortaleza';
  const displayRegion = region?.trim() || 'Brasil';
  const initial = getInitials(user?.name ?? 'U');

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: topPad,
          backgroundColor: isFloating ? 'transparent' : colors.surface,
          borderBottomColor: isFloating ? 'transparent' : colors.border,
        },
        isFloating && styles.floatingWrap,
      ]}
    >
      {/* Brand & City Edition Selector */}
      <View style={styles.leftCol}>
        <Text
          style={[
            styles.brand,
            { color: isFloating ? '#FFFFFF' : colors.textPrimary },
            isFloating && styles.brandShadow,
          ]}
        >
          {title}
        </Text>

        <Pressable
          onPress={() => router.push('/')}
          accessibilityRole="button"
          accessibilityLabel={`Trocar cidade, cidade atual ${displayCity}`}
          style={({ pressed }) => [
            styles.cityPill,
            {
              backgroundColor: isFloating ? 'rgba(255,255,255,0.2)' : '#FAF2EE',
              borderColor: isFloating ? 'rgba(255,255,255,0.4)' : colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          hitSlop={6}
        >
          <View style={[styles.cityDot, { backgroundColor: colors.primaryDark }]} />
          <View style={styles.cityTextCol}>
            <Text
              style={[
                styles.cityName,
                { color: isFloating ? '#FFFFFF' : colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {displayCity}
            </Text>
            <Text
              style={[
                styles.regionName,
                { color: isFloating ? 'rgba(255,255,255,0.85)' : colors.textMuted },
              ]}
              numberOfLines={1}
            >
              {displayRegion}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={12}
            color={isFloating ? '#FFFFFF' : colors.textMuted}
          />
        </Pressable>
      </View>

      {/* User Monogram or Profile */}
      {!hideAvatar ? (
        <Pressable
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Meu Perfil"
          style={({ pressed }) => [
            styles.avatarBadge,
            {
              backgroundColor: colors.primaryDark,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={styles.avatarInitial}>{initial}</Text>
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
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  brand: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: -0.6,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 0,
    maxWidth: 190,
  },
  cityDot: {
    width: 6,
    height: 6,
    borderRadius: 0,
  },
  cityTextCol: {
    maxWidth: 130,
  },
  cityName: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
    lineHeight: 13,
  },
  regionName: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    lineHeight: 11,
  },
  avatarBadge: {
    width: 28,
    height: 28,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  brandShadow: {
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
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
