import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { fetchCarousels } from '@/api/carousels';
import { ResultCard } from '@/components/ResultCard';
import { SearchingLoader } from '@/components/SearchingLoader';
import { CityHighlightsRow } from '@/components/SponsoredStoriesRow';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useLocationStore } from '@/stores/locationStore';
import { useRecommendationStore } from '@/stores/recommendationStore';
import { useWizardStore } from '@/stores/wizardStore';
import { spacing, type ThemeColors } from '@/theme/colors';
import { buildStories, type StoryItem } from '@/utils/stories';

export function RecommendationResults({
  colors,
  bottomPad,
  onRestart,
}: {
  colors: ThemeColors;
  bottomPad: number;
  onRestart: () => void;
}) {
  const city = useLocationStore((s) => s.city);
  const region = useLocationStore((s) => s.region);
  const loading = useRecommendationStore((s) => s.loading);
  const error = useRecommendationStore((s) => s.error);
  const data = useRecommendationStore((s) => s.data);
  const mood = useWizardStore((s) => s.mood);
  const feeling = useWizardStore((s) => s.feeling);
  const activities = useWizardStore((s) => s.activities);
  const { onScroll, scrollEventThrottle } = useTabBarScroll();
  const [stories, setStories] = useState<StoryItem[]>([]);

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
      setStories([]);
    }
  }, [city, region, mood, feeling, activities]);

  useFocusEffect(
    useCallback(() => {
      void loadStories();
    }, [loadStories]),
  );

  if (loading) {
    return (
      <View style={{ flex: 1, paddingBottom: bottomPad }}>
        <SearchingLoader colors={colors} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { paddingBottom: bottomPad }]}>
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>{error}</Text>
        <Text style={[styles.errorBody, { color: colors.textMuted }]}>
          Tente novamente em alguns instantes.
        </Text>
        <Pressable
          onPress={onRestart}
          style={[styles.restartButton, { backgroundColor: colors.buttonInk }]}
        >
          <Text style={[styles.restartLabel, { color: colors.buttonInkText }]}>Recomeçar</Text>
        </Pressable>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.center, { paddingBottom: bottomPad }]}>
        <Text style={{ color: colors.textPrimary }}>Nada por aqui ainda.</Text>
        <Pressable
          onPress={onRestart}
          style={[styles.restartButton, { backgroundColor: colors.buttonInk, marginTop: 16 }]}
        >
          <Text style={[styles.restartLabel, { color: colors.buttonInkText }]}>Recomeçar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      contentContainerStyle={[styles.list, { paddingBottom: bottomPad + spacing.xl }]}
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
        onPress={onRestart}
        style={[styles.restartButton, { backgroundColor: colors.buttonInk, alignSelf: 'stretch' }]}
      >
        <Text style={[styles.restartLabel, { color: colors.buttonInkText }]}>Recomeçar</Text>
      </Pressable>
    </ScrollView>
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
  restartButton: {
    marginTop: 24,
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restartLabel: { fontWeight: '700', fontSize: 16 },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
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
