import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/components/AmbientBackground';
import { AppHeader } from '@/components/AppHeader';
import {
  FLOATING_TAB_BAR_GAP,
  FLOATING_TAB_BAR_HEIGHT,
} from '@/components/FloatingTabBar';
import { ResultCard } from '@/components/ResultCard';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { spacing } from '@/theme/colors';
import { useDayTheme } from '@/theme/useDayTheme';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { colors, period } = useDayTheme();
  const items = useFavoritesStore((s) => s.items);
  const { onScroll, scrollEventThrottle } = useTabBarScroll();
  const tabClearance =
    FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_GAP + Math.max(insets.bottom, 8);

  return (
    <AmbientBackground colors={colors}>
      <AppHeader colors={colors} period={period} title="Favoritos" hideAvatar showCreate={false} />

      {items.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: tabClearance }]}>
          <Ionicons name="heart-outline" size={40} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Nenhum favorito ainda
          </Text>
          <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
            Toque no coração nos lugares para salvar aqui.
          </Text>
        </View>
      ) : (
        <ScrollView
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: tabClearance + spacing.xl },
          ]}
        >
          <Text style={[styles.count, { color: colors.textMuted }]}>
            {items.length} {items.length === 1 ? 'lugar salvo' : 'lugares salvos'}
          </Text>
          {items.map((place) => (
            <ResultCard key={place.id} colors={colors} place={place} />
          ))}
        </ScrollView>
      )}
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  count: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
});
