import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, type ThemeColors } from '@/theme/colors';

interface MinimalBackButtonProps {
  colors: ThemeColors;
  onPress: () => void;
  label?: string;
}

export function MinimalBackButton({
  colors,
  onPress,
  label = 'Voltar',
}: MinimalBackButtonProps) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={16}
      style={[
        styles.root,
        {
          bottom: insets.bottom + spacing.md,
          left: spacing.lg,
        },
      ]}
    >
      <Ionicons name="chevron-back" size={14} color={colors.textMuted} />
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingVertical: 4,
    paddingRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
});
