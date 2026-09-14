import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlassSurface } from '@/components/GlassSurface';
import { CoverPlaceholder } from '@/components/CoverPlaceholder';
import { RatingStars } from '@/components/RatingStars';
import { sendRecommendationFeedback } from '@/api/recommendations';
import { useFavoritesStore } from '@/stores/favoritesStore';
import type { ThemeColors } from '@/theme/colors';
import { radius, spacing } from '@/theme/colors';
import type { Place } from '@/types';

export function ResultCard({
  colors,
  place,
  rank,
}: {
  colors: ThemeColors;
  place: Place;
  rank?: number;
}) {
  const address = place.address?.trim() || 'Localização';
  const isDark = colors.scheme === 'dark';
  const liked = useFavoritesStore((s) => s.isFavorite(place));
  const toggle = useFavoritesStore((s) => s.toggle);
  const [imgError, setImgError] = useState(false);

  const handleToggleFavorite = () => {
    toggle(place);
    const willBeLiked = !liked;
    void sendRecommendationFeedback({
      placeName: place.name,
      action: willBeLiked ? 'LIKE' : 'DISLIKE',
      categoryTag: place.type,
    });
  };

  const handleOpenMaps = () => {
    if (place.googleMapsUri && place.googleMapsUri.startsWith('http')) {
      Linking.openURL(place.googleMapsUri).catch(() => {
        const query = `${place.name} ${address}`;
        const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
        void Linking.openURL(fallbackUrl);
      });
    } else {
      const query = `${place.name} ${address}`;
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      Linking.openURL(url).catch((err) => console.warn('Erro ao abrir o Google Maps:', err));
    }

    void sendRecommendationFeedback({
      placeName: place.name,
      action: 'MAPS_CLICK',
      categoryTag: place.type,
    });
  };

  // Lugares: mantém Google Places / URLs reais (não aplica filtro de stock de eventos)
  const coverUrl = place.imageUrl?.trim() || '';
  const showCoverImage = Boolean(coverUrl) && !imgError;

  return (
    <GlassSurface
      colors={colors}
      style={styles.card}
      contentStyle={{ padding: 0 }}
    >
      <View>
        {showCoverImage ? (
          <Image
            source={{ uri: coverUrl }}
            style={styles.cover}
            onError={() => setImgError(true)}
            resizeMode="cover"
          />
        ) : (
          <CoverPlaceholder colors={colors} label={place.type || place.name} style={styles.cover} />
        )}

        {place.highlighted && rank != null ? (
          <View
            style={[
              styles.topBadge,
              { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.55)' },
            ]}
          >
            <Text style={styles.topText}>TOP {rank}</Text>
          </View>
        ) : null}

        {place.openNow !== undefined && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: place.openNow ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)' },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: '#FFF' }]} />
            <Text style={styles.statusText}>
              {place.openNow ? 'Aberto agora' : 'Fechado'}
            </Text>
          </View>
        )}

        <Pressable
          onPress={handleToggleFavorite}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          style={({ pressed }) => [
            styles.likeButton,
            {
              backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.92)',
              opacity: pressed ? 0.75 : 1,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? colors.like : colors.textPrimary}
          />
        </Pressable>
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.when, { color: colors.textMuted }]}>{place.type}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {place.name}
        </Text>

        <View style={styles.typeRow}>
          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={2}>
            {address}
          </Text>
          <RatingStars colors={colors} rating={place.rating} />
        </View>

        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={3}>
          {place.description}
        </Text>

        <Pressable
          onPress={handleOpenMaps}
          style={({ pressed }) => [
            styles.mapsButton,
            {
              backgroundColor: colors.buttonSecondary,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Ionicons name="map-outline" size={15} color={colors.buttonSecondaryText} />
          <Text style={[styles.mapsButtonLabel, { color: colors.buttonSecondaryText }]}>
            Ver no Google Maps
          </Text>
        </Pressable>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 14,
  },
  cover: {
    width: '100%',
    height: 180,
    backgroundColor: '#EFEFEF',
  },
  topBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  topText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  likeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 8,
  },
  meta: { flex: 1, fontSize: 13, lineHeight: 18 },
  description: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  mapsButton: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    borderRadius: 8,
  },
  mapsButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
