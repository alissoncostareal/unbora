import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { moods } from '@/constants/wizardCatalog';
import {
  getMoodLabel,
  getPeriodLabel,
  radius,
  spacing,
  type ThemeColors,
} from '@/theme/colors';
import type { UnboraDayPeriod } from '@/types';

/**
 * Hero do guia emocional — primeira coisa que a home comunica.
 */
export function MoodGuideHero({
  colors,
  period,
  moodValue,
  city,
}: {
  colors: ThemeColors;
  period: UnboraDayPeriod;
  moodValue: string | null;
  city: string;
}) {
  const moodLabel = moods.find((m) => m.value === moodValue)?.label;

  const goExplore = () => {
    router.push('/(tabs)/explore');
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.scheme === 'dark' ? colors.surface : colors.primaryMuted,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.eyebrow, { color: colors.textMuted }]}>
        {getPeriodLabel(period)} · {getMoodLabel(period)} · {city}
      </Text>

      {moodLabel ? (
        <>
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            Hoje você está {moodLabel.toLowerCase()}
          </Text>
          <Text style={[styles.support, { color: colors.textMuted }]}>
            A agenda e os destaques abaixo já consideram esse clima.
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={goExplore}
              style={({ pressed }) => [
                styles.primary,
                {
                  backgroundColor: colors.buttonPrimary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={[styles.primaryLabel, { color: colors.buttonPrimaryText }]}>
                Atualizar humor
              </Text>
              <Ionicons
                name="refresh"
                size={16}
                color={colors.buttonPrimaryText}
              />
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            Como você está?
          </Text>
          <Text style={[styles.support, { color: colors.textMuted }]}>
            Um teste rápido de humor e a gente indica onde ir em {city} agora.
          </Text>
          <Pressable
            onPress={goExplore}
            style={({ pressed }) => [
              styles.primary,
              {
                backgroundColor: colors.buttonPrimary,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={[styles.primaryLabel, { color: colors.buttonPrimaryText }]}>
              Começar o guia
            </Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={colors.buttonPrimaryText}
            />
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 0,
    borderWidth: 1,
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  support: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  primary: {
    marginTop: 4,
    height: 44,
    borderRadius: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
  },
  primaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
