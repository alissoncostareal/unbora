import { StyleSheet, View } from 'react-native';

import type { ThemeColors } from '@/theme/colors';

export function StepProgressBar({
  colors,
  currentStep,
  totalSteps,
}: {
  colors: ThemeColors;
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.segment,
            {
              backgroundColor:
                index <= currentStep ? colors.textPrimary : colors.surfaceStrong,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  segment: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
});
