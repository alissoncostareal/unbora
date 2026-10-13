import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '@/theme/colors';
import type { WizardOption } from '@/types';

/**
 * Card de humor editorial Unbora — cantos retos, terracota e paleta neutra.
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
              ? colors.surfaceStrong
              : colors.primaryLight
            : isDark
              ? colors.surface
              : '#FFFFFF',
          borderColor: selected ? colors.primary : colors.border,
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
                ? colors.primary
                : isDark
                  ? colors.surfaceStrong
                  : colors.primaryMuted,
            },
          ]}
        >
          <Ionicons
            name={option.icon}
            size={22}
            color={selected ? '#FFFFFF' : colors.primary}
          />
        </View>
        {multi ? (
          <View
            style={[
              styles.dot,
              {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary : 'transparent',
              },
            ]}
          >
            {selected ? (
              <Ionicons name="checkmark" size={13} color="#FFFFFF" />
            ) : null}
          </View>
        ) : null}
      </View>
      <Text
        style={[
          styles.label,
          {
            color: selected && !isDark ? colors.primaryDark : colors.textPrimary,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}

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
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48.2%',
    height: 102,
    borderRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 0,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 0,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    borderRadius: 0,
    height: 3,
  },
});
