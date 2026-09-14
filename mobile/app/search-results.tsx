import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AmbientBackground } from '@/components/AmbientBackground';
import { GlassSurface } from '@/components/GlassSurface';
import { ResultCard } from '@/components/ResultCard';
import { SearchingLoader } from '@/components/SearchingLoader';
import { useLocationStore } from '@/stores/locationStore';
import { useRecommendationStore } from '@/stores/recommendationStore';
import { spacing } from '@/theme/colors';
import { useDayTheme } from '@/theme/useDayTheme';

export default function SearchResultsScreen() {
  const { colors } = useDayTheme();
  const { q } = useLocalSearchParams<{ q: string }>();

  const loading = useRecommendationStore((s) => s.loading);
  const error = useRecommendationStore((s) => s.error);
  const data = useRecommendationStore((s) => s.data);
  const search = useRecommendationStore((s) => s.search);
  const clear = useRecommendationStore((s) => s.clear);
  const city = useLocationStore((s) => s.city);
  const latitude = useLocationStore((s) => s.latitude);
  const longitude = useLocationStore((s) => s.longitude);

  useEffect(() => {
    if (q) {
      void search(q, city, latitude ?? undefined, longitude ?? undefined);
    }
    return () => {
      clear();
    };
  }, [q, city, latitude, longitude, search]);

  const handleBack = () => {
    clear();
    router.replace('/');
  };

  return (
    <AmbientBackground colors={colors}>
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          Resultados para "{q}"
        </Text>
      </View>

      {loading && <SearchingLoader colors={colors} />}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>{error}</Text>
          <Text style={[styles.errorBody, { color: colors.textMuted }]}>
            Tente novamente em alguns instantes.
          </Text>
          <Pressable
            onPress={handleBack}
            style={[styles.retryButton, { backgroundColor: colors.buttonPrimary }]}
          >
            <Text style={[styles.retryLabel, { color: colors.buttonPrimaryText }]}>Voltar</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && data && (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{data.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{data.subtitle}</Text>
          <View style={{ height: spacing.lg }} />
          {data.places.length === 0 ? (
            <View style={styles.center}>
              <Text style={{ color: colors.textPrimary }}>Nenhum local encontrado para a busca.</Text>
            </View>
          ) : (
            data.places.map((place, index) => (
              <ResultCard key={`${place.name}-${index}`} colors={colors} place={place} rank={index + 1} />
            ))
          )}
          <Pressable onPress={handleBack} style={{ marginTop: spacing.md }}>
            <GlassSurface colors={colors} contentStyle={styles.restartContent}>
              <Text style={[styles.restartText, { color: colors.textPrimary }]}>Voltar ao Início</Text>
            </GlassSurface>
          </Pressable>
        </ScrollView>
      )}

      {!loading && !error && !data && (
        <View style={styles.center}>
          <Text style={{ color: colors.textPrimary }}>Nenhum dado encontrado.</Text>
          <Pressable
            onPress={handleBack}
            style={[styles.retryButton, { backgroundColor: colors.buttonPrimary, marginTop: 16 }]}
          >
            <Text style={[styles.retryLabel, { color: colors.buttonPrimaryText }]}>Voltar</Text>
          </Pressable>
        </View>
      )}
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
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
    paddingHorizontal: 32,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryLabel: { fontWeight: '600', fontSize: 14 },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
  },
  restartContent: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restartText: { fontWeight: '700' },
});
