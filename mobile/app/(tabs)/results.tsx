import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchCarousels } from '@/api/carousels';
import { AmbientBackground } from '@/components/AmbientBackground';
import { AppHeader } from '@/components/AppHeader';
import {
  FLOATING_TAB_BAR_GAP,
  FLOATING_TAB_BAR_HEIGHT,
} from '@/components/FloatingTabBar';
import { ResultCard } from '@/components/ResultCard';
import { SearchingLoader } from '@/components/SearchingLoader';
import { CityHighlightsRow } from '@/components/SponsoredStoriesRow';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useLocationStore } from '@/stores/locationStore';
import { useRecommendationStore } from '@/stores/recommendationStore';
import { useWizardStore } from '@/stores/wizardStore';
import { spacing } from '@/theme/colors';
import { useDayTheme } from '@/theme/useDayTheme';
import { buildStories, type StoryItem } from '@/utils/stories';

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, period } = useDayTheme();
  const city = useLocationStore((s) => s.city);
  const region = useLocationStore((s) => s.region);
  const loading = useRecommendationStore((s) => s.loading);
  const error = useRecommendationStore((s) => s.error);
  const data = useRecommendationStore((s) => s.data);
  const clear = useRecommendationStore((s) => s.clear);
  const mood = useWizardStore((s) => s.mood);
  const feeling = useWizardStore((s) => s.feeling);
  const activities = useWizardStore((s) => s.activities);
  const resetWizard = useWizardStore((s) => s.reset);
  const { onScroll, scrollEventThrottle } = useTabBarScroll();
  const [stories, setStories] = useState<StoryItem[]>([]);

  const tabClearance =
    FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_GAP + Math.max(insets.bottom, 8);

  const loadStories = useCallback(async () => {
    try {
      const sponsored = await fetchCarousels(city, region);
      setStories(
        buildStories({
          sponsored,
          city,
          region,
          mood,
          feeling,
          activityIds: activities,
        }),
      );
    } catch {
      setStories(
        buildStories({
          sponsored: [],
          city,
          region,
          mood,
          feeling,
          activityIds: activities,
        }),
      );
    }
  }, [city, region, mood, feeling, activities]);

  useFocusEffect(
    useCallback(() => {
      void loadStories();
    }, [loadStories]),
  );

  const restart = () => {
    resetWizard();
    clear();
    router.replace('/(tabs)/explore');
  };

  return (
    <AmbientBackground colors={colors}>
      <AppHeader colors={colors} period={period} title="Resultados" showCreate={false} />

      {loading && (
        <View style={{ flex: 1, paddingBottom: tabClearance }}>
          <SearchingLoader colors={colors} />
        </View>
      )}

      {!loading && error && (
        <View style={[styles.center, { paddingBottom: tabClearance }]}>
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>{error}</Text>
          <Text style={[styles.errorBody, { color: colors.textMuted }]}>
            Tente novamente em alguns instantes.
          </Text>
          <Pressable
            onPress={() => router.replace('/(tabs)/explore')}
            style={[styles.retryButton, { backgroundColor: colors.buttonInk }]}
          >
            <Text style={[styles.retryLabel, { color: colors.buttonInkText }]}>
              Voltar
            </Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && data && (
        <ScrollView
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          contentContainerStyle={[styles.list, { paddingBottom: tabClearance + spacing.xl }]}
        >
          {stories.length > 0 ? (
            <View style={{ marginHorizontal: -spacing.md }}>
              <CityHighlightsRow
                colors={colors}
                items={stories}
                title="Combina com você"
                subtitle="Destaques alinhados ao humor"
              />
            </View>
          ) : null}

          <Text style={[styles.title, { color: colors.textPrimary }]}>{data.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{data.subtitle}</Text>
          <View style={{ height: spacing.lg }} />
          {data.places.map((place, index) => (
            <ResultCard key={`${place.name}-${index}`} colors={colors} place={place} rank={index + 1} />
          ))}
          <Pressable
            onPress={restart}
            style={[
              styles.retryButton,
              {
                backgroundColor: colors.buttonSecondary,
                marginTop: spacing.sm,
                alignSelf: 'stretch',
              },
            ]}
          >
            <Text style={[styles.retryLabel, { color: colors.buttonSecondaryText }]}>
              Recomeçar
            </Text>
          </Pressable>
        </ScrollView>
      )}

      {!loading && !error && !data && (
        <View style={[styles.center, { paddingBottom: tabClearance }]}>
          <Text style={{ color: colors.textPrimary }}>Nada por aqui ainda.</Text>
          <Pressable
            onPress={() => router.replace('/(tabs)/explore')}
            style={[
              styles.retryButton,
              { backgroundColor: colors.buttonInk, marginTop: 16 },
            ]}
          >
            <Text style={[styles.retryLabel, { color: colors.buttonInkText }]}>
              Voltar
            </Text>
          </Pressable>
        </View>
      )}
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorBody: {
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryLabel: { fontWeight: '700', fontSize: 15 },
  list: {
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
