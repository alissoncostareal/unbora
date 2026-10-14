import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
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
import { fetchPersonalizedPlaces, type PlaceItem } from '@/api/places';
import { AmbientBackground } from '@/components/AmbientBackground';
import { AppHeader } from '@/components/AppHeader';
import { GlassSurface } from '@/components/GlassSurface';
import {
  FLOATING_TAB_BAR_GAP,
  FLOATING_TAB_BAR_HEIGHT,
} from '@/components/FloatingTabBar';
import { CoverPlaceholder } from '@/components/CoverPlaceholder';
import { RatePlaceModal, type RateTarget } from '@/components/RatePlaceModal';
import { CityHighlightsRow } from '@/components/SponsoredStoriesRow';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useLocationStore } from '@/stores/locationStore';
import { ratingIdForPlace, useRatingsStore } from '@/stores/ratingsStore';
import { useWizardStore } from '@/stores/wizardStore';
import { radius, spacing, type ThemeColors } from '@/theme/colors';
import { useDayTheme } from '@/theme/useDayTheme';
import { buildStories, type StoryItem } from '@/utils/stories';

const moodOptions = [
  { label: 'Relaxar', note: 'Calmo e sem pressa', icon: 'leaf-outline' as const, kicker: '01' },
  { label: 'Animado', note: 'Música e boas conversas', icon: 'flash-outline' as const, kicker: '02' },
  { label: 'Sair da rotina', note: 'Lugares surpreendentes', icon: 'compass-outline' as const, kicker: '03' },
  { label: 'Encontro', note: 'Clima intimista a dois', icon: 'heart-outline' as const, kicker: '04' },
  { label: 'Curioso', note: 'Novidades e cultura', icon: 'search-outline' as const, kicker: '05' },
  { label: 'Em paz', note: 'Pátios, livros e café', icon: 'water-outline' as const, kicker: '06' },
];

function PlaceCover({
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
  const selectMood = useWizardStore((s) => s.selectMood);
  const setStep = useWizardStore((s) => s.setStep);
  const { onScroll, scrollEventThrottle } = useTabBarScroll();

  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [heading, setHeading] = useState({ title: `Lugares em evidência em ${city}`, subtitle: 'Curadoria gastronômica e cultural' });
  const [rateTarget, setRateTarget] = useState<RateTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ratings = useRatingsStore((s) => s.items);

  const load = useCallback(async () => {
    try {
      setError(null);

      const [placesResult, carouselsResult] = await Promise.allSettled([
        fetchPersonalizedPlaces(city, region),
        fetchCarousels(city, region),
      ]);

      if (placesResult.status === 'fulfilled') {
        setPlaces(placesResult.value.items);
        setHeading({
          title: placesResult.value.title,
          subtitle: placesResult.value.subtitle,
        });
      } else {
        setError('Não foi possível carregar os lugares recomendados.');
      }

      const sponsored = carouselsResult.status === 'fulfilled' ? carouselsResult.value : [];
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

      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao buscar lugares da cidade.');
      setLoading(false);
      setRefreshing(false);
    }
  }, [city, region, mood, feeling, wizardActivities]);

  useFocusEffect(
    useCallback(() => {
      if (places.length === 0) {
        setLoading(true);
      }
      load();
    }, [load]),
  );

  const bottomPad =
    FLOATING_TAB_BAR_HEIGHT +
    FLOATING_TAB_BAR_GAP +
    Math.max(insets.bottom, 8) +
    spacing.lg;

  const handlePickMood = (chosenMood: string) => {
    selectMood(chosenMood);
    setStep(1);
    router.push('/(tabs)/explore');
  };

  const openMaps = (item: PlaceItem) => {
    const url =
      item.googleMapsUri ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name} ${item.address || city}`)}`;
    void Linking.openURL(url);
  };

  const listHeader = (
    <View style={styles.headerStack}>
      {/* Editorial Hero Banner */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.scheme === 'dark' ? colors.surface : '#faf2ee',
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.heroEyebrow, { color: colors.textMuted }]}>
          EDIÇÃO {city.toUpperCase()} · CADERNO DE DESTINOS
        </Text>
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
          Onde ir, a partir de como você está
        </Text>
        <Text style={[styles.heroText, { color: colors.textMuted }]}>
          O Unbora lê o momento e procura um lugar real em {city}. Você escolhe como quer se sentir. A sugestão vem com o motivo.
        </Text>

        <Pressable
          onPress={() => router.push('/(tabs)/explore')}
          style={({ pressed }) => [
            styles.heroActionBtn,
            {
              backgroundColor: colors.buttonInk,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Começar o guia de lugares"
        >
          <Text style={[styles.heroActionBtnText, { color: colors.buttonInkText }]}>
            Começar o guia →
          </Text>
        </Pressable>
      </View>

      {/* Mood Selector Grid */}
      <View style={styles.moodSection}>
        <View style={styles.sectionHeadingBlock}>
          <Text style={[styles.sectionKicker, { color: colors.textMuted }]}>
            PASSO 01/05 · INTENÇÃO
          </Text>
          <Text style={[styles.sectionHeadline, { color: colors.textPrimary }]}>
            Como você quer se sentir hoje?
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            Escolha e siga. Leva um minuto.
          </Text>
        </View>

        <View style={styles.moodGrid}>
          {moodOptions.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => handlePickMood(item.label)}
              style={({ pressed }) => [
                styles.moodCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar humor ${item.label}`}
            >
              <View style={styles.moodCardTop}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
                <Text style={[styles.moodKicker, { color: colors.textMuted }]}>
                  {item.kicker}
                </Text>
              </View>
              <View style={styles.moodCardBottom}>
                <Text style={[styles.moodLabel, { color: colors.textPrimary }]}>
                  {item.label}
                </Text>
                <Text style={[styles.moodNote, { color: colors.textMuted }]}>
                  {item.note}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Coleções e Cadernos da Cidade */}
      <CityHighlightsRow
        colors={colors}
        items={stories}
        title="Coleções da cidade"
        subtitle="Roteiros temáticos e dicas para o seu dia"
      />

      {/* Places Feed Header */}
      <View style={styles.placesFeedHeader}>
        <Text style={[styles.placesSectionTitle, { color: colors.textPrimary }]}>
          {heading.title}
        </Text>
        <Text style={[styles.placesSectionSubtitle, { color: colors.textMuted }]}>
          {heading.subtitle}
        </Text>
      </View>
    </View>
  );

  const listFooter = (
    <View style={styles.footerStack}>
      {/* Seção Como Funciona */}
      <View style={styles.howItWorksCard}>
        <Text style={styles.howItWorksKicker}>COMO FUNCIONA · TRÊS PASSOS</Text>
        <Text style={styles.howItWorksTitle}>
          {city} tem lugar de sobra. Você não precisa ver todos.
        </Text>
        <Text style={styles.howItWorksLead}>
          Diz como você está, com quem vai e quanto tempo tem. O Unbora indica um lugar real, com endereço e o motivo da escolha.
        </Text>

        <View style={styles.principlesContainer}>
          <View style={styles.principleItem}>
            <Text style={styles.principleIndex}>01</Text>
            <Text style={styles.principleTitle}>Pelo momento</Text>
            <Text style={styles.principleText}>
              A primeira pergunta é como você quer passar a próxima hora: quieto, animado, com alguém ou sozinho. A sugestão começa por aí.
            </Text>
          </View>

          <View style={styles.principleItem}>
            <Text style={styles.principleIndex}>02</Text>
            <Text style={styles.principleTitle}>Um lugar, não uma lista</Text>
            <Text style={styles.principleText}>
              A resposta vem com nome e endereço. Você vê a foto do local antes de decidir se sai.
            </Text>
          </View>

          <View style={styles.principleItem}>
            <Text style={styles.principleIndex}>03</Text>
            <Text style={styles.principleTitle}>Com o motivo</Text>
            <Text style={styles.principleText}>
              Junto da sugestão vem o porquê daquele lugar. Se não fizer sentido, pede outra. A decisão de sair continua sua.
            </Text>
          </View>
        </View>
      </View>

      {/* Seção A Edição em Números */}
      <View
        style={[
          styles.statsCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.statsHeadline, { color: colors.textPrimary }]}>
          A edição em números
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statValue, { color: colors.primary }]}>140+</Text>
            <Text style={[styles.statLabel, { color: colors.textPrimary }]}>Na sua cidade</Text>
            <Text style={[styles.statDetail, { color: colors.textMuted }]}>
              A curadoria nasce em {city}. Lugar de outra região não entra.
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statValue, { color: colors.primary }]}>3 min</Text>
            <Text style={[styles.statLabel, { color: colors.textPrimary }]}>Até escolher</Text>
            <Text style={[styles.statDetail, { color: colors.textMuted }]}>
              Você conta o momento. Voltam opções viáveis com o motivo da escolha.
            </Text>
          </View>
        </View>
      </View>

      {/* Rodapé Editorial */}
      <View style={styles.editorialFooter}>
        <Text style={[styles.footerBrand, { color: colors.textPrimary }]}>
          Unbora <Text style={[styles.footerCity, { color: colors.primary }]}>· Edição {city}</Text>
        </Text>
        <Text style={[styles.footerColophon, { color: colors.textMuted }]}>
          Curadoria independente de lugares, arquitetura cotidiana e cultura gastronômica.
        </Text>
        <Text style={[styles.footerCopy, { color: colors.textMuted }]}>
          © {new Date().getFullYear()} Unbora. Circulação aberta.
        </Text>
      </View>
    </View>
  );

  return (
    <AmbientBackground colors={colors}>
      <AppHeader
        colors={colors}
        period={period}
        title="Unbora"
        subtitle={`Guia · ${city}`}
      />

      {loading && places.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Carregando lugares em {city}
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          contentContainerStyle={{
            paddingBottom: bottomPad,
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
            places.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons
                  name={error ? 'cloud-offline-outline' : 'business-outline'}
                  size={36}
                  color={colors.textMuted}
                />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  {error ? 'Sem conexão com o servidor' : 'Nenhum local cadastrado'}
                </Text>
                <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                  {error || `Puxe para atualizar os locais em ${city}.`}
                </Text>
                <Pressable
                  onPress={() => {
                    setLoading(true);
                    load();
                  }}
                  style={[styles.retry, { backgroundColor: colors.buttonSecondary }]}
                >
                  <Text style={[styles.retryLabel, { color: colors.buttonSecondaryText }]}>
                    Tentar de novo
                  </Text>
                </Pressable>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const ratingId = ratingIdForPlace({
              name: item.name,
              address: item.address,
              placeId: item.placeId,
            });
            const myRating = ratings.find((r) => r.id === ratingId);

            return (
              <View
                style={[
                  styles.card,
                  {
                    marginHorizontal: spacing.md,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.coverWrapper}>
                  <PlaceCover
                    colors={colors}
                    imageUrl={item.imageUrl}
                    label={item.type || 'Lugar'}
                  />

                  {item.editorialMatch ? (
                    <View style={[styles.badge, { backgroundColor: colors.primaryDark }]}>
                      <Text style={styles.badgeText}>{item.editorialMatch}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.metaRow}>
                    <Text style={[styles.typeText, { color: colors.primaryDark }]}>
                      {item.type.toUpperCase()}
                    </Text>
                    {item.priceLevel ? (
                      <Text style={[styles.priceText, { color: colors.textMuted }]}>
                        {item.priceLevel}
                      </Text>
                    ) : null}
                  </View>

                  <Text
                    style={[styles.cardTitle, { color: colors.textPrimary }]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>

                  {item.address ? (
                    <View style={styles.addressRow}>
                      <Ionicons name="location-outline" size={13} color={colors.primaryDark} />
                      <Text style={[styles.addressText, { color: colors.textMuted }]} numberOfLines={2}>
                        {item.address}
                      </Text>
                    </View>
                  ) : null}

                  {item.description ? (
                    <View style={[styles.quoteBox, { backgroundColor: '#FAF2EE', borderLeftColor: colors.primaryDark }]}>
                      <Text style={[styles.quoteKicker, { color: colors.primaryDark }]}>
                        POR QUE VALE A VISITA
                      </Text>
                      <Text style={[styles.quoteText, { color: '#443E39' }]} numberOfLines={3}>
                        {item.description}
                      </Text>
                    </View>
                  ) : null}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 ? (
                    <View style={styles.tagsRow}>
                      {item.tags.slice(0, 3).map((tag) => (
                        <View
                          key={tag}
                          style={[
                            styles.tagBadge,
                            {
                              backgroundColor: '#F3EFE8',
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.tagText, { color: '#55433E' }]}>
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {myRating ? (
                    <View style={styles.myRatingRow}>
                      <Ionicons name="star" size={14} color={colors.gold} />
                      <Text style={[styles.myRatingText, { color: colors.textPrimary }]}>
                        Sua avaliação: {myRating.stars}/5
                      </Text>
                    </View>
                  ) : null}

                  {/* Actions Row */}
                  <View style={styles.actionsRow}>
                    <Pressable
                      onPress={() => openMaps(item)}
                      style={({ pressed }) => [
                        styles.actionBtnSecondary,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.surface,
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Abrir no Google Maps"
                    >
                      <Ionicons name="map-outline" size={14} color={colors.textPrimary} />
                      <Text style={[styles.actionBtnSecondaryText, { color: colors.textPrimary }]}>
                        Ver no mapa
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        setRateTarget({
                          id: ratingId,
                          kind: 'place',
                          name: item.name,
                          subtitle: item.address || item.type,
                          type: item.type,
                          imageUrl: item.imageUrl,
                          placeId: item.placeId,
                          googleMapsUri: item.googleMapsUri,
                        })
                      }
                      style={({ pressed }) => [
                        styles.actionBtnPrimary,
                        {
                          backgroundColor: colors.buttonInk,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={myRating ? 'Editar avaliação' : 'Avaliar local'}
                    >
                      <Ionicons
                        name="star-outline"
                        size={14}
                        color={colors.buttonInkText}
                      />
                      <Text style={[styles.actionBtnPrimaryText, { color: colors.buttonInkText }]}>
                        {myRating ? 'Editar nota' : 'Avaliar'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
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
  headerStack: {
    paddingBottom: spacing.sm,
  },
  heroCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 0,
    borderWidth: 1,
  },
  heroEyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
    fontWeight: '600',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 8,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  heroActionBtn: {
    height: 44,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  heroActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  moodSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionHeadingBlock: {
    marginBottom: 14,
  },
  sectionKicker: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionHeadline: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodCard: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: 0,
    padding: 12,
    minHeight: 88,
    justifyContent: 'space-between',
  },
  moodCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moodKicker: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  moodCardBottom: {
    marginTop: 8,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  moodNote: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  placesFeedHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  placesSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  placesSectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  cardSeparator: {
    height: 12,
  },
  card: {
    borderRadius: 0,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  coverWrapper: {
    position: 'relative',
    width: '100%',
    height: 195,
  },
  cover: {
    width: '100%',
    height: 195,
    backgroundColor: '#F3EFE8',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
    zIndex: 2,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  priceText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
    lineHeight: 25,
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 10,
  },
  addressText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  quoteBox: {
    borderLeftWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderRadius: 0,
  },
  quoteKicker: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  quoteText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 0,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  myRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  myRatingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  actionBtnSecondary: {
    flex: 1,
    height: 40,
    borderRadius: 0,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnPrimary: {
    flex: 1,
    height: 40,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerStack: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
  },
  howItWorksCard: {
    backgroundColor: '#1c1917',
    padding: spacing.lg,
    borderRadius: 0,
  },
  howItWorksKicker: {
    color: '#ffdad2',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  howItWorksTitle: {
    color: '#fff8f5',
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 8,
  },
  howItWorksLead: {
    color: '#d1c6b8',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  principlesContainer: {
    gap: 16,
  },
  principleItem: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 12,
  },
  principleIndex: {
    color: '#9a4632',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  principleTitle: {
    color: '#fff8f5',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  principleText: {
    color: '#bfb3a4',
    fontSize: 12,
    lineHeight: 18,
  },
  statsCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: spacing.lg,
  },
  statsHeadline: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4,
  },
  statDetail: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  editorialFooter: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  footerBrand: {
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: -0.2,
  },
  footerCity: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  footerColophon: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 17,
  },
  footerCopy: {
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: 14,
    minHeight: 300,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
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
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryLabel: { fontWeight: '600', fontSize: 14 },
});
