import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '@/theme/colors';
import type { WizardOption } from '@/types';

/** Tons suaves por opção — identidade Unbora, sem arco-íris IG. */
const OPTION_TINTS: Record<string, { soft: string; ink: string }> = {
  // Passo 1 - Humor atual
  Animado: { soft: 'rgba(251, 146, 60, 0.16)', ink: '#EA580C' },
  Tranquilo: { soft: 'rgba(56, 189, 248, 0.16)', ink: '#0284C7' },
  Social: { soft: 'rgba(167, 139, 250, 0.18)', ink: '#7C3AED' },
  Romântico: { soft: 'rgba(244, 63, 94, 0.14)', ink: '#E11D48' },
  Curioso: { soft: 'rgba(14, 165, 233, 0.14)', ink: '#0EA5E9' },
  Cansado: { soft: 'rgba(99, 102, 241, 0.14)', ink: '#4F46E5' },

  // Passo 2 - Como quer se sentir
  Alegre: { soft: 'rgba(250, 204, 21, 0.22)', ink: '#CA8A04' },
  Alegria: { soft: 'rgba(250, 204, 21, 0.22)', ink: '#CA8A04' },
  Calmo: { soft: 'rgba(125, 211, 252, 0.22)', ink: '#0284C7' },
  Calma: { soft: 'rgba(125, 211, 252, 0.22)', ink: '#0284C7' },
  Energizado: { soft: 'rgba(249, 115, 22, 0.16)', ink: '#EA580C' },
  Energia: { soft: 'rgba(249, 115, 22, 0.16)', ink: '#EA580C' },
  Conectado: { soft: 'rgba(192, 132, 252, 0.18)', ink: '#7C3AED' },
  Conexão: { soft: 'rgba(192, 132, 252, 0.18)', ink: '#7C3AED' },
  Inspirado: { soft: 'rgba(244, 114, 182, 0.16)', ink: '#DB2777' },
  Inspiração: { soft: 'rgba(244, 114, 182, 0.16)', ink: '#DB2777' },
  Encantado: { soft: 'rgba(52, 211, 153, 0.18)', ink: '#059669' },
  Realização: { soft: 'rgba(52, 211, 153, 0.18)', ink: '#059669' },

  // Passo 3 - Tipos de lugares
  Restaurantes: { soft: 'rgba(251, 146, 60, 0.16)', ink: '#EA580C' },
  Gastronomia: { soft: 'rgba(251, 146, 60, 0.16)', ink: '#EA580C' },
  Comer: { soft: 'rgba(251, 146, 60, 0.16)', ink: '#EA580C' },
  'Bares & Pubs': { soft: 'rgba(56, 189, 248, 0.16)', ink: '#0284C7' },
  Cafeterias: { soft: 'rgba(251, 191, 36, 0.2)', ink: '#D97706' },
  'Cafés & Brunch': { soft: 'rgba(251, 191, 36, 0.2)', ink: '#D97706' },
  'Praia & Sunset': { soft: 'rgba(14, 165, 233, 0.14)', ink: '#0EA5E9' },
  Praia: { soft: 'rgba(14, 165, 233, 0.14)', ink: '#0EA5E9' },
  'Shows & Noite': { soft: 'rgba(99, 102, 241, 0.16)', ink: '#4F46E5' },
  Noite: { soft: 'rgba(99, 102, 241, 0.16)', ink: '#4F46E5' },
  'Cultura & Lazer': { soft: 'rgba(167, 139, 250, 0.16)', ink: '#7C3AED' },
  Cultura: { soft: 'rgba(167, 139, 250, 0.16)', ink: '#7C3AED' },
};

function getTint(label: string) {
  return OPTION_TINTS[label] ?? { soft: 'rgba(14, 165, 233, 0.12)', ink: '#0EA5E9' };
}

/** Fundo opaco. rgba + elevation no Android vira um quadrado branco dentro do card. */
function solidFill(soft: string): string {
  const match = soft.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return '#FFFFFF';
  const alpha = match[4] != null ? Number(match[4]) : 1;
  const mix = (channel: number) => Math.round(alpha * channel + (1 - alpha) * 255);
  const hex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${hex(mix(Number(match[1])))}${hex(mix(Number(match[2])))}${hex(mix(Number(match[3])))}`;
}

/**
 * Card de humor — Headspace (calmo) + Fever (descoberta).
 */
export function MoodOptionButton({
  colors,
  option,
  selected,
  onPress,
  multi = false,
}: {
  colors: ThemeColors;
  option: WizardOption;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
}) {
  const tint = getTint(option.label);
  const isDark = colors.scheme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'transparent' }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected
            ? isDark
              ? tint.soft
              : solidFill(tint.soft)
            : isDark
              ? colors.surface
              : '#FFFFFF',
          borderColor: selected ? tint.ink : colors.border,
          borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          shadowOpacity: selected || isDark ? 0 : 0.04,
          elevation: 0,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: selected
                ? tint.ink
                : isDark
                  ? colors.surfaceStrong
                  : tint.soft,
            },
          ]}
        >
          <Ionicons
            name={option.icon}
            size={22}
            color={selected ? '#FFF' : tint.ink}
          />
        </View>
        {multi ? (
          <View
            style={[
              styles.dot,
              {
                borderColor: selected ? tint.ink : colors.border,
                backgroundColor: selected ? tint.ink : 'transparent',
              },
            ]}
          >
            {selected ? (
              <Ionicons name="checkmark" size={13} color="#FFF" />
            ) : null}
          </View>
        ) : null}
      </View>
      <Text
        style={[styles.label, { color: colors.textPrimary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}

const STEP_LABELS = ['Humor', 'Clima', 'Plano'];

export function MoodProgressBar({
  colors,
  currentStep,
  totalSteps,
}: {
  colors: ThemeColors;
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressRow}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          return (
            <View
              key={index}
              style={[
                styles.progressSegment,
                {
                  backgroundColor:
                    done || active ? colors.textPrimary : colors.surfaceStrong,
                  height: active ? 5 : 3,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.progressLabels}>
        {STEP_LABELS.slice(0, totalSteps).map((label, index) => (
          <Text
            key={label}
            style={[
              styles.progressLabel,
              {
                color:
                  index === currentStep
                    ? colors.textPrimary
                    : colors.textMuted,
                fontWeight: index === currentStep ? '700' : '500',
              },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48.2%',
    height: 102,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 0,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  progressBlock: {
    gap: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    flex: 1,
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
