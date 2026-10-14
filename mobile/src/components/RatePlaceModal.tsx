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
  const [liked, setLiked] = useState(true);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!visible || !target) return;
    setLiked(existing?.liked !== undefined ? existing.liked : true);
    setComment(existing?.comment ?? '');
  }, [visible, target, existing?.liked, existing?.comment]);

  if (!target) return null;

  const isUpdate = Boolean(existing);

  const handleSave = () => {
    const payload: Omit<RatedItem, 'ratedAt'> = {
      id: target.id,
      kind: target.kind,
      name: target.name,
      subtitle: target.subtitle,
      type: target.type,
      imageUrl: target.imageUrl,
      placeId: target.placeId,
      googleMapsUri: target.googleMapsUri,
      liked,
      stars: liked ? 5 : 3,
      comment: comment.trim() || undefined,
    };
    upsert(payload);
    void sendRecommendationFeedback({
      placeName: target.name,
      action: liked ? 'LIKE' : 'RATE',
      categoryTag: target.type,
      comment: comment.trim() || undefined,
      stars: liked ? 5 : 3,
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
              {target.kind === 'event' ? 'Passaporte de eventos' : 'Passaporte de visitas'}
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

          <View style={styles.decisionBlock}>
            <Text style={[styles.decisionPrompt, { color: colors.textPrimary }]}>
              Curtiu a experiência?
            </Text>
            <View style={styles.decisionButtons}>
              <Pressable
                onPress={() => setLiked(true)}
                style={[
                  styles.choiceBtn,
                  {
                    borderColor: liked ? colors.primary : colors.border,
                    backgroundColor: liked ? colors.surfaceStrong : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={liked ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={18}
                  color={liked ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.choiceLabel,
                    { color: liked ? colors.textPrimary : colors.textMuted },
                  ]}
                >
                  Sim, curti
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setLiked(false)}
                style={[
                  styles.choiceBtn,
                  {
                    borderColor: !liked ? colors.primary : colors.border,
                    backgroundColor: !liked ? colors.surfaceStrong : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={!liked ? 'remove-circle' : 'remove-circle-outline'}
                  size={18}
                  color={!liked ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.choiceLabel,
                    { color: !liked ? colors.textPrimary : colors.textMuted },
                  ]}
                >
                  Apenas registrando
                </Text>
              </Pressable>
            </View>
          </View>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Anotação pessoal sobre a visita (opcional)"
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
            style={({ pressed }) => [
              styles.primary,
              {
                backgroundColor: colors.buttonInk,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={[styles.primaryLabel, { color: colors.buttonInkText }]}>
              {isUpdate ? 'Atualizar passaporte' : 'Salvar no passaporte'}
            </Text>
          </Pressable>

          {isUpdate ? (
            <Pressable onPress={handleRemove} style={styles.remove}>
              <Text style={[styles.removeLabel, { color: colors.textMuted }]}>
                Remover do passaporte
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
    borderRadius: 0,
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  decisionBlock: {
    marginVertical: spacing.md,
  },
  decisionPrompt: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  decisionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  choiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
  },
  choiceLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  comment: {
    borderRadius: 0,
    borderWidth: 1,
    minHeight: 80,
    padding: spacing.md,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  primary: {
    borderRadius: 0,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  remove: {
    marginTop: spacing.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  removeLabel: {
    fontSize: 12,
  },
});
