import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ThemeColors } from '@/theme/colors';

export function RatingStars({
  colors,
  rating,
}: {
  colors: ThemeColors;
  rating: number;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name="star" size={14} color={colors.gold} />
      <Text style={[styles.text, { color: colors.textPrimary }]}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { fontSize: 13, fontWeight: '700' },
});
