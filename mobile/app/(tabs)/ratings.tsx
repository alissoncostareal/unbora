import { Ionicons } from '@expo/vector-icons';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import { AmbientBackground } from '@/components/AmbientBackground';
import { AppHeader } from '@/components/AppHeader';
import { CoverPlaceholder } from '@/components/CoverPlaceholder';
import {
  FLOATING_TAB_BAR_GAP,
  FLOATING_TAB_BAR_HEIGHT,
} from '@/components/FloatingTabBar';
import { GlassSurface } from '@/components/GlassSurface';
import { RatePlaceModal, type RateTarget } from '@/components/RatePlaceModal';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useRatingsStore, type RatedItem } from '@/stores/ratingsStore';
import { spacing } from '@/theme/colors';
import { useDayTheme } from '@/theme/useDayTheme';

type FilterTab = 'all' | 'liked' | 'notes';

function PassportListCard({
  item,
  onEdit,
}: {
  item: RatedItem;
  onEdit: () => void;
}) {
  const { colors } = useDayTheme();
  const [imgError, setImgError] = useState(false);
  const coverUrl = item.imageUrl?.trim() || '';

  const handleOpenMap = () => {
    if (item.googleMapsUri) {
      void Linking.openURL(item.googleMapsUri);
    } else {
      const q = encodeURIComponent(`${item.name} ${item.subtitle ?? ''}`);
      void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
    }
  };

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
          <View style={styles.metaRow}>
            <Text style={[styles.kind, { color: colors.textMuted }]}>
              {item.kind === 'event' ? 'Evento' : 'Lugar'}
              {item.type ? ` · ${item.type}` : ''}
            </Text>
            {item.liked ? (
              <View style={[styles.likedBadge, { borderColor: colors.primary }]}>
                <Ionicons name="checkmark" size={10} color={colors.primary} />
                <Text style={[styles.likedText, { color: colors.primary }]}>Curtiu</Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.subtitle ? (
            <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}

          {item.comment ? (
            <View style={[styles.commentBox, { backgroundColor: colors.surfaceStrong }]}>
              <Text style={[styles.comment, { color: colors.textPrimary }]} numberOfLines={2}>
                “{item.comment}”
              </Text>
            </View>
          ) : null}

          <View style={styles.cardActions}>
            <Pressable
              onPress={onEdit}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: colors.surfaceStrong,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons name="pencil-outline" size={12} color={colors.textPrimary} />
              <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>
                {item.comment ? 'Editar nota' : 'Adicionar nota'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleOpenMap}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: colors.buttonSecondary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons name="navigate-outline" size={12} color={colors.buttonSecondaryText} />
              <Text style={[styles.actionBtnText, { color: colors.buttonSecondaryText }]}>
                Mapa
              </Text>
            </Pressable>
          </View>
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
  const [filter, setFilter] = useState<FilterTab>('all');
  const [editing, setEditing] = useState<RateTarget | null>(null);

  const tabClearance =
    FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_GAP + Math.max(insets.bottom, 8);

  const filteredItems = items.filter((item) => {
    if (filter === 'liked') return item.liked;
    if (filter === 'notes') return Boolean(item.comment?.trim());
    return true;
  });

  return (
    <AmbientBackground colors={colors}>
      <AppHeader
        colors={colors}
        period={period}
        title="Passaporte"
        hideAvatar
      />

      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => setFilter('all')}
          style={[
            styles.filterTab,
            filter === 'all' && [styles.filterTabActive, { borderColor: colors.primary }],
          ]}
        >
          <Text
            style={[
              styles.filterLabel,
              { color: filter === 'all' ? colors.primary : colors.textMuted },
            ]}
          >
            Todos ({items.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter('liked')}
          style={[
            styles.filterTab,
            filter === 'liked' && [styles.filterTabActive, { borderColor: colors.primary }],
          ]}
        >
          <Text
            style={[
              styles.filterLabel,
              { color: filter === 'liked' ? colors.primary : colors.textMuted },
            ]}
          >
            Curtidos ({items.filter((i) => i.liked).length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter('notes')}
          style={[
            styles.filterTab,
            filter === 'notes' && [styles.filterTabActive, { borderColor: colors.primary }],
          ]}
        >
          <Text
            style={[
              styles.filterLabel,
              { color: filter === 'notes' ? colors.primary : colors.textMuted },
            ]}
          >
            Notas ({items.filter((i) => i.comment?.trim()).length})
          </Text>
        </Pressable>
      </View>

      {filteredItems.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: tabClearance }]}>
          <Ionicons name="journal-outline" size={44} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {filter === 'all'
              ? 'Nenhum registro no passaporte'
              : filter === 'liked'
                ? 'Nenhum local marcado como curtiu'
                : 'Nenhuma anotação pessoal ainda'}
          </Text>
          <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
            {filter === 'all'
              ? 'Ao visitar lugares recomendados ou eventos, registre sua presença para enriquecer seu histórico e calibrar a inteligência do Unbora.'
              : 'Seus registros aparecerão aqui à medida que você marcar suas preferências.'}
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
          {filteredItems.map((item) => (
            <PassportListCard
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
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  filterTab: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomWidth: 2,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  card: {
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  thumb: {
    width: 88,
    height: 96,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#1f1e24',
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  kind: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  likedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderRadius: 0,
  },
  likedText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 19,
  },
  sub: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  commentBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    borderRadius: 0,
  },
  comment: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 0,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
