import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ThemeColors } from '@/theme/colors';

const STAR_LABELS = [
  'Péssimo',
  'Ruim',
  'Ok',
  'Bom',
  'Excelente',
] as const;

export function starLabel(stars: number): string {
  const index = Math.min(5, Math.max(1, Math.round(stars))) - 1;
  return STAR_LABELS[index];
}

/** Seletor 1–5 estrelas (padrão Maps / Yelp). */
export function StarRatingInput({
  colors,
  value,
  onChange,
  size = 36,
}: {
  colors: ThemeColors;
  value: number;
  onChange: (stars: number) => void;
  size?: number;
}) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Avaliação de 1 a 5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            hitSlop={6}
            accessibilityRole="radio"
            accessibilityState={{ selected: filled && star === value }}
            accessibilityLabel={`${star} de 5 — ${STAR_LABELS[star - 1]}`}
            style={({ pressed }) => [
              styles.starHit,
              { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={size}
              color={filled ? colors.gold : colors.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  starHit: {
    padding: 4,
  },
});
