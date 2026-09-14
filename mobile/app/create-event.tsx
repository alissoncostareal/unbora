import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
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
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { radius, spacing } from '@/theme/colors';
import { useDayTheme } from '@/theme/useDayTheme';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800';

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useDayTheme();
  const user = useAuthStore((s) => s.user);
  const city = useLocationStore((s) => s.city);
  const region = useLocationStore((s) => s.region);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [startsAt, setStartsAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user || user.role !== 'merchant') {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: colors.bg, paddingTop: insets.top + spacing.md },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted }}>Voltar</Text>
        </Pressable>
        <View style={styles.blocked}>
          <Text style={[styles.blockedTitle, { color: colors.textPrimary }]}>
            Só lojistas podem criar eventos
          </Text>
          <Pressable
            onPress={() => router.push('/merchant-register')}
            style={[styles.submit, { backgroundColor: colors.buttonSecondary }]}
          >
            <Text style={[styles.submitLabel, { color: colors.buttonSecondaryText }]}>
              Cadastrar como lojista
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const onSubmit = async () => {
    setError(null);
    if (!title.trim() || !description.trim() || !startsAt.trim()) {
      setError('Preencha título, descrição e data/hora.');
      return;
    }

    const parsed = new Date(startsAt);
    if (Number.isNaN(parsed.getTime())) {
      setError('Use a data no formato AAAA-MM-DDTHH:mm (ex.: 2026-07-20T20:00).');
      return;
    }

    setLoading(true);
    try {
      await createEvent({
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || DEFAULT_IMAGE,
        city,
        region,
        venue: venue.trim() || undefined,
        startsAt: parsed.toISOString(),
        merchantId: user.id,
      });
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar evento');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = [
    styles.input,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.textPrimary,
    },
  ];

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
            paddingBottom: insets.bottom + spacing.xl,
            paddingHorizontal: spacing.lg,
          }}
        >
          <Pressable onPress={() => router.back()} style={styles.backRow}>
            <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted }}>Voltar</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Novo evento</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {user.businessName ?? user.name} · {city}
          </Text>

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
            placeholder="2026-07-20T20:00"
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
            <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
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
                Publicar evento
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: spacing.md,
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
  error: {
    marginTop: spacing.md,
    fontSize: 14,
    fontWeight: '600',
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
  blocked: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    gap: spacing.md,
  },
  blockedTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
});
