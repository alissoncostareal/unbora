import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/components/AmbientBackground';
import { AppHeader } from '@/components/AppHeader';
import { CoverPlaceholder } from '@/components/CoverPlaceholder';
import {
  FLOATING_TAB_BAR_GAP,
  FLOATING_TAB_BAR_HEIGHT,
} from '@/components/FloatingTabBar';
import { GlassSurface } from '@/components/GlassSurface';
import { RatePlaceModal, type RateTarget } from '@/components/RatePlaceModal';
import { StarRatingInput, starLabel } from '@/components/StarRatingInput';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useRatingsStore, type RatedItem } from '@/stores/ratingsStore';
import { radius, spacing } from '@/theme/colors';
import { useDayTheme } from '@/theme/useDayTheme';
import { useState } from 'react';

function RatingListCard({
  item,
  onEdit,
}: {
  item: RatedItem;
  onEdit: () => void;
}) {
  const { colors } = useDayTheme();
  const [imgError, setImgError] = useState(false);
  const coverUrl = item.imageUrl?.trim() || '';

  return (
    <GlassSurface colors={colors} style={styles.card} contentStyle={{ padding: 0 }}>
      <View style={styles.row}>
        <View style={styles.thumb}>
          <CoverPlaceholder
            colors={colors}
            label={item.type || item.name}
            style={StyleSheet.absoluteFill}
          />
          {coverUrl && !imgError ? (
            <Image
              source={{ uri: coverUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : null}
        </View>
        <View style={styles.body}>
          <Text style={[styles.kind, { color: colors.textMuted }]}>
            {item.kind === 'event' ? 'Evento' : 'Lugar'}
            {item.type ? ` · ${item.type}` : ''}
          </Text>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.subtitle ? (
            <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}
          <View style={styles.starsLine}>
            <StarRatingInput colors={colors} value={item.stars} onChange={() => onEdit()} size={18} />
            <Text style={[styles.label, { color: colors.textMuted }]}>{starLabel(item.stars)}</Text>
          </View>
          {item.comment ? (
            <Text style={[styles.comment, { color: colors.textMuted }]} numberOfLines={2}>
              “{item.comment}”
            </Text>
          ) : null}
          <Pressable
            onPress={onEdit}
            style={({ pressed }) => [
              styles.editBtn,
              {
                backgroundColor: colors.buttonSecondary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="create-outline" size={14} color={colors.buttonSecondaryText} />
            <Text style={[styles.editLabel, { color: colors.buttonSecondaryText }]}>
              Editar
            </Text>
          </Pressable>
        </View>
      </View>
    </GlassSurface>
  );
}

export default function RatingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, period } = useDayTheme();
  const items = useRatingsStore((s) => s.items);
  const { onScroll, scrollEventThrottle } = useTabBarScroll();
  const [editing, setEditing] = useState<RateTarget | null>(null);
  const tabClearance =
    FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_GAP + Math.max(insets.bottom, 8);

  return (
    <AmbientBackground colors={colors}>
      <AppHeader
        colors={colors}
        period={period}
        title="Avaliações"
        hideAvatar
      />

      {items.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: tabClearance }]}>
          <Ionicons name="star-outline" size={40} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Nenhuma avaliação ainda
          </Text>
          <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
            Nos cards de lugares e eventos, toque em Avaliar e dê de 1 a 5 estrelas.
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
            {items.length} {items.length === 1 ? 'avaliação' : 'avaliações'}
          </Text>
          {items.map((item) => (
            <RatingListCard
              key={item.id}
              item={item}
              onEdit={() =>
                setEditing({
                  id: item.id,
                  kind: item.kind,
                  name: item.name,
                  subtitle: item.subtitle,
                  type: item.type,
                  imageUrl: item.imageUrl,
                  placeId: item.placeId,
                  googleMapsUri: item.googleMapsUri,
                })
              }
            />
          ))}
        </ScrollView>
      )}

      <RatePlaceModal
        colors={colors}
        visible={Boolean(editing)}
        target={editing}
        onClose={() => setEditing(null)}
      />
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
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#DCE8EA',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  kind: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  sub: {
    fontSize: 13,
    marginTop: 2,
  },
  starsLine: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  comment: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  editBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
