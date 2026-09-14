import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createEvent } from '@/api/events';
import {
  FLOATING_TAB_BAR_GAP,
  FLOATING_TAB_BAR_HEIGHT,
} from '@/components/FloatingTabBar';
import {
  defaultImageForCategory,
  EVENT_CATEGORIES,
  type EventCategory,
} from '@/constants/eventCategories';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { radius, spacing } from '@/theme/colors';
import { useDayTheme } from '@/theme/useDayTheme';

function toIsoFromLocalInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Accept YYYY-MM-DDTHH:mm or YYYY-MM-DD HH:mm
  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)
    ? `${normalized}:00`
    : normalized;
  const parsed = new Date(withSeconds);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export default function CreateTabScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useDayTheme();
  const user = useAuthStore((s) => s.user);
  const city = useLocationStore((s) => s.city);
  const region = useLocationStore((s) => s.region);

  const [category, setCategory] = useState<EventCategory>('Shows');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [imageUrl, setImageUrl] = useState(defaultImageForCategory('Shows'));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const bottomPad =
    FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_GAP + Math.max(insets.bottom, 8) + spacing.xl;

  const fieldStyle = useMemo(
    () => [
      styles.input,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        color: colors.textPrimary,
      },
    ],
    [colors],
  );

  if (!user || user.isGuest) {
    return (
      <View
        style={[
          styles.root,
          {
            backgroundColor: colors.bg,
            paddingTop: insets.top + spacing.lg,
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>Criar evento</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Entre na sua conta para enviar um evento à comunidade. Após a aprovação no admin, ele
          aparece na Início e no Explorar.
        </Text>
        <Pressable
          onPress={() => router.push('/login')}
          style={[styles.submit, { backgroundColor: colors.buttonInk }]}
        >
          <Text style={[styles.submitLabel, { color: colors.buttonInkText }]}>Entrar</Text>
        </Pressable>
      </View>
    );
  }

  const onPickCategory = (next: EventCategory) => {
    setCategory(next);
    setImageUrl((current) => {
      const wasDefault = EVENT_CATEGORIES.some((c) => defaultImageForCategory(c) === current);
      return wasDefault ? defaultImageForCategory(next) : current;
    });
  };

  const onSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (!title.trim() || !description.trim() || !startsAt.trim()) {
      setError('Preencha título, descrição e data/hora.');
      return;
    }
    const iso = toIsoFromLocalInput(startsAt);
    if (!iso) {
      setError('Use a data no formato AAAA-MM-DDTHH:mm (ex.: 2026-09-20T20:00).');
      return;
    }

    setLoading(true);
    try {
      await createEvent({
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || defaultImageForCategory(category),
        city,
        region,
        venue: venue.trim() || undefined,
        startsAt: iso,
        merchantId: user.id,
        category,
      });
      setSuccess('Evento enviado! Assim que o admin aprovar, ele aparece no app.');
      setTitle('');
      setDescription('');
      setVenue('');
      setStartsAt('');
      setCategory('Shows');
      setImageUrl(defaultImageForCategory('Shows'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: insets.top + spacing.md,
            paddingBottom: bottomPad,
            paddingHorizontal: spacing.lg,
          }}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>Criar evento</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {user.name} · {city}. Enviado para aprovação.
          </Text>

          <Text style={[styles.label, { color: colors.textMuted }]}>Categoria</Text>
          <View style={styles.chips}>
            {EVENT_CATEGORIES.map((item) => {
              const selected = item === category;
              return (
                <Pressable
                  key={item}
                  onPress={() => onPickCategory(item)}
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
          </View>

          <Text style={[styles.label, { color: colors.textMuted }]}>Título</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Nome do evento"
            placeholderTextColor={colors.textMuted}
            style={fieldStyle}
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>Descrição</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="O que vai rolar?"
            placeholderTextColor={colors.textMuted}
            multiline
            style={[fieldStyle, styles.multiline]}
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>Local</Text>
          <TextInput
            value={venue}
            onChangeText={setVenue}
            placeholder="Endereço ou nome do espaço"
            placeholderTextColor={colors.textMuted}
            style={fieldStyle}
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>
            Data e hora (AAAA-MM-DDTHH:mm)
          </Text>
          <TextInput
            value={startsAt}
            onChangeText={setStartsAt}
            placeholder="2026-09-20T20:00"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            style={fieldStyle}
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>URL da imagem</Text>
          <TextInput
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            style={fieldStyle}
          />

          {error ? (
            <Text style={[styles.feedback, { color: colors.danger }]}>{error}</Text>
          ) : null}
          {success ? (
            <View style={styles.successRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
              <Text style={[styles.feedback, { color: colors.textPrimary, marginTop: 0 }]}>
                {success}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={[
              styles.submit,
              {
                backgroundColor: colors.buttonInk,
                opacity: loading ? 0.7 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.buttonInkText} />
            ) : (
              <Text style={[styles.submitLabel, { color: colors.buttonInkText }]}>
                Enviar para aprovação
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  feedback: {
    marginTop: spacing.md,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
  },
  submit: {
    marginTop: spacing.xl,
    borderRadius: radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    fontWeight: '700',
    fontSize: 16,
  },
});
