import { StyleSheet, View } from 'react-native';

import { ShimmerBox } from '@/components/ShimmerBox';
import type { ThemeColors } from '@/theme/colors';
import { radius, spacing } from '@/theme/colors';

function ResultCardSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <ShimmerBox colors={colors} height={160} width="100%" style={styles.cover} />
      <View style={styles.body}>
        <ShimmerBox colors={colors} height={12} width="30%" />
        <ShimmerBox colors={colors} height={18} width="75%" style={{ marginTop: 10 }} />
        <ShimmerBox colors={colors} height={12} width="50%" style={{ marginTop: 8 }} />
        <ShimmerBox colors={colors} height={40} width="100%" style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

export function ResultsLoadingSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <View>
      <ResultCardSkeleton colors={colors} />
      <ResultCardSkeleton colors={colors} />
      <ResultCardSkeleton colors={colors} />
      <ResultCardSkeleton colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  cover: {
    borderRadius: 0,
  },
  body: {
    padding: spacing.md,
  },
});
