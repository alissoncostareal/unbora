import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { CarouselItem } from '@/api/carousels';
import { StoryViewer } from '@/components/StoryViewer';
import { radius, spacing, type ThemeColors } from '@/theme/colors';
import type { StoryItem } from '@/utils/stories';

/**
 * Destaques da cidade — inventário patrocinado/orgânico.
 * Formato Fever (pôster horizontal), não anéis Instagram.
 * O viewer full-screen continua para imersão ao tocar.
 */
export function CityHighlightsRow({
  colors,
  items,
  title = 'Coleções da cidade',
  subtitle = 'Roteiros e cadernos selecionados',
}: {
  colors: ThemeColors;
  items: StoryItem[] | CarouselItem[];
  title?: string;
  subtitle?: string;
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.order - b.order),
    [items],
  );

  if (sorted.length === 0) return null;

  const openHighlight = (index: number) => {
    setActiveIndex(index);
    setViewerOpen(true);
  };

  const markSeen = (id: string) => {
    setSeenIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };

  return (
    <>
      <View style={styles.wrap}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + 12}
        >
          {sorted.map((item, index) => {
            const seen = seenIds.has(item.id);
            const isSponsored =
              (item as StoryItem).source === 'sponsored' ||
              (!('source' in item) &&
                !['unbora', 'comunidade', 'dica'].some((w) =>
                  item.tag.toLowerCase().includes(w),
                ));

            return (
              <Pressable
                key={`${item.id}-${index}`}
                onPress={() => openHighlight(index)}
                android_ripple={{ color: 'rgba(255,255,255,0.18)', foreground: true }}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.92 : seen ? 0.88 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.cover}
                    fadeDuration={0}
                  />
                ) : (
                  <View style={[styles.cover, { backgroundColor: colors.surfaceStrong }]} />
                )}
                <View style={styles.scrim} />
                <View style={styles.cardBody}>
                  {isSponsored ? (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: colors.accent },
                      ]}
                    >
                      <Text style={styles.badgeText}>Parceiro</Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: 'rgba(255,255,255,0.22)' },
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {item.tag || 'Unbora'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.city ? (
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {item.city}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <StoryViewer
        colors={colors}
        items={sorted as StoryItem[]}
        initialIndex={activeIndex}
        visible={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onStorySeen={markSeen}
      />
    </>
  );
}

/** @deprecated use CityHighlightsRow — mantido para imports antigos */
export const SponsoredStoriesRow = CityHighlightsRow;

const CARD_WIDTH = 250;
const CARD_HEIGHT = 145;

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    marginBottom: 12,
    gap: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  row: {
    paddingHorizontal: spacing.md,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cover: {
    ...StyleSheet.absoluteFill,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#F3EFE8',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28, 25, 23, 0.52)',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
    gap: 3,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0,
    marginBottom: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  cardMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
});
