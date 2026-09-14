import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/components/AmbientBackground';
import { AppHeader } from '@/components/AppHeader';
import {
  FLOATING_TAB_BAR_GAP,
  FLOATING_TAB_BAR_HEIGHT,
} from '@/components/FloatingTabBar';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useLocationStore } from '@/stores/locationStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { radius, spacing } from '@/theme/colors';
import { useDayTheme } from '@/theme/useDayTheme';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, period } = useDayTheme();
  const city = useLocationStore((s) => s.city);
  const region = useLocationStore((s) => s.region);
  const items = useNotificationStore((s) => s.items);
  const loading = useNotificationStore((s) => s.loading);
  const error = useNotificationStore((s) => s.error);
  const readIds = useNotificationStore((s) => s.readIds);
  const refresh = useNotificationStore((s) => s.refresh);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const { onScroll, scrollEventThrottle } = useTabBarScroll();

  const tabClearance =
    FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_GAP + Math.max(insets.bottom, 8);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <AmbientBackground colors={colors}>
      <AppHeader
        colors={colors}
        period={period}
        title="Notificações"
      />
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabClearance + spacing.xl },
        ]}
      >
        <View
          style={[
            styles.locationCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.locationLabel, { color: colors.textMuted }]}>Sua área</Text>
          <Text style={[styles.locationValue, { color: colors.textPrimary }]}>
            {city} · {region}
          </Text>
        </View>

        {items.length > 0 ? (
          <Pressable onPress={markAllAsRead} style={styles.markAll}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>
              Marcar todas como lidas
            </Text>
          </Pressable>
        ) : null}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        {!loading && error ? (
          <View
            style={[
              styles.emptyCard,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
              Não foi possível carregar
            </Text>
            <Text style={{ color: colors.textMuted, marginTop: 6 }}>{error}</Text>
            <Pressable
              onPress={refresh}
              style={[styles.retryButton, { backgroundColor: colors.buttonInk }]}
            >
              <Text style={[styles.retryLabel, { color: colors.buttonInkText }]}>
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Ionicons name="notifications-off-outline" size={28} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Nenhuma notificação por aqui
            </Text>
            <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
              Quando houver avisos para {city}, eles aparecerão aqui.
            </Text>
          </View>
        ) : null}

        {!loading && !error
          ? items.map((item) => {
              const unread = !readIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => markAsRead(item.id)}
                  style={[
                    styles.notificationCard,
                    {
                      backgroundColor: unread ? colors.surfaceStrong : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.notificationTop}>
                    <Text style={[styles.notificationTitle, { color: colors.textPrimary }]}>
                      {item.title}
                    </Text>
                    {unread ? (
                      <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                    ) : null}
                  </View>
                  <Text style={{ color: colors.textMuted, lineHeight: 20 }}>{item.body}</Text>
                  <Text style={[styles.notificationMeta, { color: colors.textMuted }]}>
                    {formatDate(item.createdAt)} · {item.city}
                  </Text>
                </Pressable>
              );
            })
          : null}
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  locationCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  locationValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
  },
  markAll: {
    alignSelf: 'flex-end',
  },
  center: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: 18,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryLabel: {
    fontWeight: '700',
  },
  notificationCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 8,
  },
  notificationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationMeta: {
    fontSize: 12,
    marginTop: 4,
  },
});
