import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlassSurface } from '@/components/GlassSurface';
import { RatePlaceModal, type RateTarget } from '@/components/RatePlaceModal';
import { RatingStars } from '@/components/RatingStars';
import { RemoteCoverImage } from '@/components/RemoteCoverImage';
import { sendRecommendationFeedback, toAppImageUrl } from '@/api/recommendations';
import { ratingIdForPlace, useRatingsStore } from '@/stores/ratingsStore';
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
  const ratingId = ratingIdForPlace(place);
  const myRating = useRatingsStore((s) => s.getById(ratingId));
  const [rateOpen, setRateOpen] = useState(false);

  const coverUrl = toAppImageUrl(place.imageUrl?.trim()) || '';

  const rateTarget: RateTarget = {
    id: ratingId,
    kind: 'place',
    name: place.name,
    subtitle: address,
    type: place.type,
    imageUrl: place.imageUrl,
    placeId: place.placeId,
    googleMapsUri: place.googleMapsUri,
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
      placeId: place.placeId,
    });
  };

  return (
    <>
      <GlassSurface colors={colors} style={styles.card} contentStyle={{ padding: 0 }}>
        <View>
          <View style={styles.cover}>
            <RemoteCoverImage
              colors={colors}
              uri={coverUrl}
              label={place.type || place.name}
            />
          </View>

          {place.imageIllustrative ? (
            <View
              style={[
                styles.illustrativeBadge,
                place.highlighted && rank != null ? { top: 44 } : null,
              ]}
            >
              <Text style={styles.topText}>Imagem ilustrativa</Text>
            </View>
          ) : null}

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
                {
                  backgroundColor: place.openNow
                    ? 'rgba(16, 185, 129, 0.85)'
                    : 'rgba(239, 68, 68, 0.85)',
                },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: '#FFF' }]} />
              <Text style={styles.statusText}>
                {place.openNow ? 'Aberto agora' : 'Fechado'}
              </Text>
            </View>
          )}
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

          {myRating ? (
            <View style={styles.myRatingRow}>
              <Ionicons name="star" size={14} color={colors.gold} />
              <Text style={[styles.myRatingText, { color: colors.textPrimary }]}>
                Sua avaliação: {myRating.stars}/5
              </Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={() => setRateOpen(true)}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: colors.buttonSecondary,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={myRating ? 'Editar avaliação' : 'Avaliar lugar'}
            >
              <Ionicons name="star-outline" size={15} color={colors.buttonSecondaryText} />
              <Text style={[styles.actionLabel, { color: colors.buttonSecondaryText }]}>
                {myRating ? 'Editar nota' : 'Avaliar'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleOpenMaps}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: colors.buttonSecondary,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Ionicons name="map-outline" size={15} color={colors.buttonSecondaryText} />
              <Text style={[styles.actionLabel, { color: colors.buttonSecondaryText }]}>
                Maps
              </Text>
            </Pressable>
          </View>
        </View>
      </GlassSurface>

      <RatePlaceModal
        colors={colors}
        visible={rateOpen}
        target={rateTarget}
        onClose={() => setRateOpen(false)}
      />
    </>
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
    backgroundColor: '#DCE8EA',
    overflow: 'hidden',
  },
  illustrativeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(20, 33, 43, 0.72)',
    zIndex: 2,
  },
  topBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    zIndex: 2,
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
    zIndex: 2,
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
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    borderRadius: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
