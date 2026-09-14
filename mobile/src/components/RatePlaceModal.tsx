import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { StarRatingInput, starLabel } from '@/components/StarRatingInput';
import { sendRecommendationFeedback } from '@/api/recommendations';
import {
  useRatingsStore,
  type RatedItem,
  type RatedKind,
} from '@/stores/ratingsStore';
import { spacing, type ThemeColors } from '@/theme/colors';

export type RateTarget = {
  id: string;
  kind: RatedKind;
  name: string;
  subtitle?: string;
  type?: string;
  imageUrl?: string;
  placeId?: string;
  googleMapsUri?: string;
};

export function RatePlaceModal({
  colors,
  visible,
  target,
  onClose,
}: {
  colors: ThemeColors;
  visible: boolean;
  target: RateTarget | null;
  onClose: () => void;
}) {
  const existing = useRatingsStore((s) =>
    target ? s.getById(target.id) : undefined,
  );
  const upsert = useRatingsStore((s) => s.upsert);
  const remove = useRatingsStore((s) => s.remove);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!visible || !target) return;
    setStars(existing?.stars ?? 0);
    setComment(existing?.comment ?? '');
  }, [visible, target, existing?.stars, existing?.comment]);

  if (!target) return null;

  const canSave = stars >= 1 && stars <= 5;
  const isUpdate = Boolean(existing);

  const handleSave = () => {
    if (!canSave) return;
    const payload: Omit<RatedItem, 'ratedAt'> = {
      id: target.id,
      kind: target.kind,
      name: target.name,
      subtitle: target.subtitle,
      type: target.type,
      imageUrl: target.imageUrl,
      placeId: target.placeId,
      googleMapsUri: target.googleMapsUri,
      stars,
      comment: comment.trim() || undefined,
    };
    upsert(payload);
    void sendRecommendationFeedback({
      placeName: target.name,
      action: 'RATE',
      categoryTag: target.type,
      comment: comment.trim() || undefined,
      stars,
      placeId: target.placeId,
    });
    onClose();
  };

  const handleRemove = () => {
    remove(target.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.kicker, { color: colors.textMuted }]}>
              {target.kind === 'event' ? 'Avaliar evento' : 'Avaliar lugar'}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
            {target.name}
          </Text>
          {target.subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
              {target.subtitle}
            </Text>
          ) : null}

          <View style={styles.starsBlock}>
            <StarRatingInput colors={colors} value={stars} onChange={setStars} />
            <Text style={[styles.starHint, { color: colors.textMuted }]}>
              {stars > 0 ? starLabel(stars) : 'Toque nas estrelas (1 a 5)'}
            </Text>
          </View>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Comentário opcional"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={280}
            style={[
              styles.comment,
              {
                color: colors.textPrimary,
                borderColor: colors.border,
                backgroundColor: colors.surfaceStrong,
              },
            ]}
          />

          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.primary,
              {
                backgroundColor: canSave ? colors.buttonInk : colors.surfaceStrong,
                opacity: pressed && canSave ? 0.9 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.primaryLabel,
                { color: canSave ? colors.buttonInkText : colors.textMuted },
              ]}
            >
              {isUpdate ? 'Atualizar avaliação' : 'Enviar avaliação'}
            </Text>
          </Pressable>

          {isUpdate ? (
            <Pressable onPress={handleRemove} style={styles.remove}>
              <Text style={[styles.removeLabel, { color: colors.textMuted }]}>
                Remover avaliação
              </Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  starsBlock: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    gap: 10,
  },
  starHint: {
    fontSize: 14,
    fontWeight: '500',
  },
  comment: {
    minHeight: 88,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  primary: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  remove: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  removeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
