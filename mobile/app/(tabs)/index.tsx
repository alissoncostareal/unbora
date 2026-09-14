import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { fetchCarousels } from '@/api/carousels';
import { AmbientBackground } from '@/components/AmbientBackground';
import { AppHeader } from '@/components/AppHeader';
import { GlassSurface } from '@/components/GlassSurface';
import {
  FLOATING_TAB_BAR_GAP,
  FLOATING_TAB_BAR_HEIGHT,
} from '@/components/FloatingTabBar';
import { MoodGuideHero } from '@/components/MoodGuideHero';
import { CoverPlaceholder } from '@/components/CoverPlaceholder';
import { RatePlaceModal, type RateTarget } from '@/components/RatePlaceModal';
import { CityHighlightsRow } from '@/components/SponsoredStoriesRow';
import { fetchHomeEventsFast, fetchHomeEventsAiRefresh, type EventItem } from '@/api/events';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useLocationStore } from '@/stores/locationStore';
import { ratingIdForEvent, useRatingsStore } from '@/stores/ratingsStore';
import { useWizardStore } from '@/stores/wizardStore';
import { radius, spacing, type ThemeColors } from '@/theme/colors';
import { useDayTheme } from '@/theme/useDayTheme';
import { buildStories, type StoryItem } from '@/utils/stories';

function EventCover({
  colors,
  imageUrl,
  label,
}: {
  colors: ThemeColors;
  imageUrl?: string;
  label: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <View style={styles.cover}>
      <CoverPlaceholder colors={colors} label={label} style={StyleSheet.absoluteFill} />
      {imageUrl && !failed ? (
        <Image
          source={{ uri: imageUrl }}
          style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, period } = useDayTheme();
  const city = useLocationStore((s) => s.city);
  const region = useLocationStore((s) => s.region);
  const mood = useWizardStore((s) => s.mood);
  const feeling = useWizardStore((s) => s.feeling);
  const wizardActivities = useWizardStore((s) => s.activities);
  const { onScroll, scrollEventThrottle } = useTabBarScroll();
  const [items, setItems] = useState<EventItem[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [heading, setHeading] = useState({ subtitle: 'Sugestões da IA' });
  const [rateTarget, setRateTarget] = useState<RateTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ratings = useRatingsStore((s) => s.items);

  const load = useCallback(async () => {
    try {
      setError(null);

      // 1) Paint rápido: só banco + carrosséis
      const [eventsResult, carouselsResult] = await Promise.allSettled([
        fetchHomeEventsFast(city, region),
        fetchCarousels(city, region),
      ]);

      let feedItems: EventItem[] = [];
      let feedSubtitle = 'Agenda local';

      if (eventsResult.status === 'fulfilled') {
        feedItems = eventsResult.value.items;
        feedSubtitle = eventsResult.value.subtitle;
      }

      const sponsored =
        carouselsResult.status === 'fulfilled' ? carouselsResult.value : [];

      setStories(
        buildStories({
          sponsored,
          city,
          region,
          mood,
          feeling,
          activityIds: wizardActivities,
        }),
      );

      setItems(feedItems);
      setHeading({ subtitle: feedSubtitle });
      setLoading(false);
      setRefreshing(false);

      if (eventsResult.status === 'rejected') {
        setError(
          eventsResult.reason instanceof Error
            ? eventsResult.reason.message
            : 'Não foi possível carregar a agenda.',
        );
      }

      // 2) IA em background — não bloqueia a tela de loading
      void fetchHomeEventsAiRefresh(city, region, feedItems).then((aiFeed) => {
        if (aiFeed.items.length > 0) {
          setItems(aiFeed.items);
          setHeading({ subtitle: aiFeed.subtitle });
          setError(null);
        }
      });
    } catch (err) {
      setItems([]);
      setStories(
        buildStories({
          sponsored: [],
          city,
          region,
          mood,
          feeling,
          activityIds: wizardActivities,
        }),
      );
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os eventos.');
      setLoading(false);
      setRefreshing(false);
    }
  }, [city, region, mood, feeling, wizardActivities]);

  useFocusEffect(
    useCallback(() => {
      // Só tela cheia de loading na primeira visita sem dados
      if (items.length === 0) {
        setLoading(true);
      }
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- items.length só para o gate inicial
    }, [load]),
  );

  const bottomPad =
    FLOATING_TAB_BAR_HEIGHT +
    FLOATING_TAB_BAR_GAP +
    Math.max(insets.bottom, 8) +
    spacing.lg;

  const listHeader = (
    <View>
      <MoodGuideHero
        colors={colors}
        period={period}
        moodValue={mood}
        city={city}
      />
      <CityHighlightsRow
        colors={colors}
        items={stories}
        title="Em destaque"
        subtitle="Parceiros e dicas — toque para ver"
      />
      <View style={styles.sectionHeader}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Agenda em {city}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {heading.subtitle}
        </Text>
      </View>
    </View>
  );

  const listFooter =
    items.length > 0 ? (
      <View style={styles.footerContainer}>
        <GlassSurface
          colors={colors}
          style={styles.footerCard}
          contentStyle={styles.footerCardContent}
        >
          <Text style={[styles.footerTitle, { color: colors.textPrimary }]}>
            É tudo por enquanto!
          </Text>
          <Text style={[styles.footerSubtitle, { color: colors.textMuted }]}>
            Você conferiu todos os eventos e programações em destaque em {city}.
          </Text>
          <View style={styles.footerActions}>
            <Pressable
              style={[
                styles.footerBtnPrimary,
                { backgroundColor: colors.buttonPrimary },
              ]}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Ionicons
                name="compass-outline"
                size={16}
                color={colors.buttonPrimaryText}
              />
              <Text
                style={[
                  styles.footerBtnPrimaryText,
                  { color: colors.buttonPrimaryText },
                ]}
              >
                Buscar por humor
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.footerBtnSecondary,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={() => {
                setRefreshing(true);
                load();
              }}
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color={colors.textPrimary}
              />
              <Text
                style={[
                  styles.footerBtnSecondaryText,
                  { color: colors.textPrimary },
                ]}
              >
                Atualizar
              </Text>
            </Pressable>
          </View>
        </GlassSurface>
      </View>
    ) : null;

  return (
    <AmbientBackground colors={colors}>
      <AppHeader
        colors={colors}
        period={period}
        title="Unbora"
        subtitle={`Guia · ${city}`}
      />

      {loading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Carregando eventos
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          contentContainerStyle={{
            paddingBottom: bottomPad,
            gap: 12,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.textPrimary}
            />
          }
          ListEmptyComponent={
            items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name={error ? 'cloud-offline-outline' : 'calendar-outline'}
                size={36}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {error ? 'Sem conexão com o servidor' : 'Nenhum evento por aqui'}
              </Text>
              <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                {error || `Puxe para atualizar a agenda em ${city}.`}
              </Text>
              <Pressable
                onPress={() => {
                  setLoading(true);
                  load();
                }}
                style={[styles.retry, { backgroundColor: colors.buttonSecondary }]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <Text style={[styles.retryLabel, { color: colors.buttonSecondaryText }]}>
                    Tentar de novo
                  </Text>
                )}
              </Pressable>
            </View>
            ) : null
          }
          renderItem={({ item }) => {
            const ratingId = ratingIdForEvent(item);
            const myRating = ratings.find((r) => r.id === ratingId);
            return (
            <GlassSurface
              colors={colors}
              style={[
                styles.card,
                {
                  marginHorizontal: spacing.md,
                },
              ]}
              contentStyle={{ padding: 0 }}
            >
              <EventCover
                colors={colors}
                imageUrl={item.imageUrl}
                label={item.type || 'Evento'}
              />

              {item.imageIllustrative ? (
                <View style={[styles.badge, styles.illustrativeBadge]}>
                  <Text style={styles.badgeText}>Imagem ilustrativa</Text>
                </View>
              ) : item.source === 'merchant' || item.category ? (
                <View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                  <Text style={styles.badgeText}>{item.category || 'Comunidade'}</Text>
                </View>
              ) : null}

              <View style={styles.cardBody}>
                <Text style={[styles.when, { color: colors.textMuted }]}>
                  {[item.category || item.type, item.whenLabel].filter(Boolean).join(' · ')}
                </Text>
                <Text
                  style={[styles.cardTitle, { color: colors.textPrimary }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={2}>
                  {[item.venue, item.businessName].filter(Boolean).join(' · ')}
                </Text>
                {item.description ? (
                  <Text
                    style={[styles.description, { color: colors.textMuted }]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                ) : null}
                {myRating ? (
                  <View style={styles.myRatingRow}>
                    <Ionicons name="star" size={14} color={colors.gold} />
                    <Text style={[styles.myRatingText, { color: colors.textPrimary }]}>
                      Sua avaliação: {myRating.stars}/5
                    </Text>
                  </View>
                ) : null}
                <Pressable
                  onPress={() =>
                    setRateTarget({
                      id: ratingId,
                      kind: 'event',
                      name: item.title,
                      subtitle: [item.venue, item.businessName].filter(Boolean).join(' · '),
                      type: item.type || 'Evento',
                      imageUrl: item.imageUrl,
                    })
                  }
                  style={({ pressed }) => [
                    styles.rateButton,
                    {
                      backgroundColor: colors.buttonSecondary,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={myRating ? 'Editar avaliação' : 'Avaliar evento'}
                >
                  <Ionicons name="star-outline" size={15} color={colors.buttonSecondaryText} />
                  <Text style={[styles.rateLabel, { color: colors.buttonSecondaryText }]}>
                    {myRating ? 'Editar nota' : 'Avaliar'}
                  </Text>
                </Pressable>
              </View>
            </GlassSurface>
            );
          }}
        />
      )}

      <RatePlaceModal
        colors={colors}
        visible={Boolean(rateTarget)}
        target={rateTarget}
        onClose={() => setRateTarget(null)}
      />
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: 14,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  empty: {
    paddingTop: 32,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  emptyBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  retry: {
    height: 36,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryLabel: { fontWeight: '600', fontSize: 14 },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: 180,
    backgroundColor: '#EFEFEF',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  illustrativeBadge: {
    backgroundColor: 'rgba(20, 33, 43, 0.72)',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: spacing.md,
  },
  when: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  meta: { fontSize: 13 },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  myRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  myRatingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rateButton: {
    marginTop: 12,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    borderRadius: 8,
  },
  rateLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  footerCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  footerCardContent: {
    padding: spacing.lg,
    alignItems: 'center',
    textAlign: 'center',
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  footerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: spacing.md,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    justifyContent: 'center',
  },
  footerBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radius.md,
    flex: 1,
  },
  footerBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footerBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
