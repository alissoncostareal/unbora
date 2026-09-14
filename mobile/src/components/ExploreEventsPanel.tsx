import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { fetchMerchantEvents, type EventItem } from '@/api/events';
import { CoverPlaceholder } from '@/components/CoverPlaceholder';
import { RemoteCoverImage } from '@/components/RemoteCoverImage';
import { EVENT_CATEGORIES } from '@/constants/eventCategories';
import { radius, spacing, type ThemeColors } from '@/theme/colors';

export function ExploreEventsPanel({
  colors,
  city,
  region,
  bottomPad,
}: {
  colors: ThemeColors;
  city: string;
  region: string;
  bottomPad: number;
}) {
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchMerchantEvents({
        city,
        region,
        category: category ?? undefined,
      });
      setItems(
        (data ?? []).map((event) => ({
          ...event,
          category: event.category || event.type || 'Outros',
          type: event.category || event.type || 'Evento',
          whenLabel:
            event.whenLabel ||
            (() => {
              try {
                return new Intl.DateTimeFormat('pt-BR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(event.startsAt));
              } catch {
                return '';
              }
            })(),
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar eventos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [city, region, category]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const hay = `${item.title} ${item.description} ${item.venue} ${item.category}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={{ paddingBottom: bottomPad + spacing.lg }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          tintColor={colors.textPrimary}
        />
      }
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.searchWrap, { backgroundColor: colors.surfaceStrong }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`Buscar eventos em ${city}`}
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.textPrimary }]}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Pressable
          onPress={() => setCategory(null)}
          style={[
            styles.chip,
            {
              backgroundColor: !category ? colors.buttonInk : colors.surface,
              borderColor: !category ? colors.buttonInk : colors.border,
            },
          ]}
        >
          <Text
            style={{
              color: !category ? colors.buttonInkText : colors.textPrimary,
              fontWeight: '600',
              fontSize: 13,
            }}
          >
            Todas
          </Text>
        </Pressable>
        {EVENT_CATEGORIES.map((item) => {
          const selected = category === item;
          return (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.buttonInk : colors.surface,
                  borderColor: selected ? colors.buttonInk : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: selected ? colors.buttonInkText : colors.textPrimary,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.textPrimary} />
      ) : error ? (
        <Text style={[styles.empty, { color: colors.danger }]}>{error}</Text>
      ) : filtered.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          Nenhum evento aprovado nesta categoria ainda.
        </Text>
      ) : (
        <View style={styles.list}>
          {filtered.map((item) => (
            <View
              key={item.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.cover}>
                {item.imageUrl ? (
                  <RemoteCoverImage
                    colors={colors}
                    uri={item.imageUrl}
                    label={item.category || item.title}
                  />
                ) : (
                  <CoverPlaceholder colors={colors} label={item.category || item.title} />
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {[item.category, item.whenLabel].filter(Boolean).join(' · ')}
                </Text>
                <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={2}>
                  {[item.venue, item.city].filter(Boolean).join(' · ')}
                </Text>
                {item.description ? (
                  <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={3}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  searchWrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    height: 44,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  chips: {
    paddingHorizontal: spacing.md,
    gap: 8,
    paddingBottom: spacing.md,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  list: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  cover: {
    height: 160,
    width: '100%',
  },
  cardBody: {
    padding: spacing.md,
    gap: 4,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  desc: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: spacing.lg,
    fontSize: 14,
    fontWeight: '500',
  },
});
