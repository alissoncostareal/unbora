import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/components/AmbientBackground';
import { AppHeader } from '@/components/AppHeader';
import {
  FLOATING_TAB_BAR_GAP,
  FLOATING_TAB_BAR_HEIGHT,
} from '@/components/FloatingTabBar';
import { MoodOptionButton, MoodProgressBar } from '@/components/MoodForm';
import { RecommendationResults } from '@/components/RecommendationResults';
import { SearchBar } from '@/components/SearchBar';
import { activities, feelings, moods } from '@/constants/wizardCatalog';
import { useLocationStore } from '@/stores/locationStore';
import { useRecommendationStore } from '@/stores/recommendationStore';
import {
  canProceed,
  toRequest,
  useWizardStore,
} from '@/stores/wizardStore';
import { radius, spacing } from '@/theme/colors';
import { useDayTheme } from '@/theme/useDayTheme';
import type { ActivityOption, WizardOption } from '@/types';

function getOptionKey(option: WizardOption | ActivityOption): string {
  return 'id' in option ? option.id : option.value;
}

const STEP_PAUSE_MS = 1800;

const steps = [
  {
    question: 'Como você está se sentindo?',
    subtitle: 'Identifique seu momento de agora',
    options: moods,
  },
  {
    question: 'Como você quer se sentir hoje?',
    subtitle: 'A energia e a vibe que você busca',
    options: feelings,
  },
  {
    question: 'Que tipo de lugar você quer ir?',
    subtitle: 'Escolha um ou mais ambientes que combinam com você',
    options: activities,
  },
];

/** Explorar — wizard de lugares + busca. */
export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { colors, period } = useDayTheme();
  const city = useLocationStore((s) => s.city);
  const region = useLocationStore((s) => s.region);
  const country = useLocationStore((s) => s.country);
  const latitude = useLocationStore((s) => s.latitude);
  const longitude = useLocationStore((s) => s.longitude);
  const requestDeviceLocation = useLocationStore((s) => s.requestDeviceLocation);

  const step = useWizardStore((s) => s.step);
  const mood = useWizardStore((s) => s.mood);
  const feeling = useWizardStore((s) => s.feeling);
  const selectedActivities = useWizardStore((s) => s.activities);
  const setStep = useWizardStore((s) => s.setStep);
  const selectMood = useWizardStore((s) => s.selectMood);
  const selectFeeling = useWizardStore((s) => s.selectFeeling);
  const toggleActivity = useWizardStore((s) => s.toggleActivity);
  const showingResults = useWizardStore((s) => s.showingResults);
  const showResults = useWizardStore((s) => s.showResults);
  const resetWizard = useWizardStore((s) => s.reset);
  const submit = useRecommendationStore((s) => s.submit);
  const searchPlaces = useRecommendationStore((s) => s.search);
  const clearResults = useRecommendationStore((s) => s.clear);
  const loading = useRecommendationStore((s) => s.loading);
  const [showSearch, setShowSearch] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  useEffect(() => {
    void requestDeviceLocation();
  }, [requestDeviceLocation]);

  const wizardState = useMemo(
    () => ({ step, mood, feeling, activities: selectedActivities }),
    [step, mood, feeling, selectedActivities],
  );

  const current = steps[step];
  const proceed = canProceed(wizardState);
  const isLast = step === 2;
  const canPress = proceed && !loading;

  const isSelected = (option: WizardOption | ActivityOption) => {
    if (step === 0) return mood === option.value;
    if (step === 1) return feeling === option.value;
    return selectedActivities.includes(getOptionKey(option));
  };

  const pauseThen = (next: () => void) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(next, STEP_PAUSE_MS);
  };

  const onSelect = (option: WizardOption | ActivityOption) => {
    if (step === 0) {
      selectMood(option.value);
      pauseThen(() => setStep(1));
      return;
    }
    if (step === 1) {
      selectFeeling(option.value);
      pauseThen(() => setStep(2));
      return;
    }
    toggleActivity(getOptionKey(option));
  };

  const onPrimary = () => {
    if (!proceed || loading) return;
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    showResults();
    void submit(
      toRequest(wizardState, {
        city,
        region,
        country,
        latitude,
        longitude,
      }),
    );
  };

  const onTextSearch = (query: string) => {
    showResults();
    void searchPlaces(query, city, latitude ?? undefined, longitude ?? undefined);
  };

  const onRestart = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    resetWizard();
    clearResults();
    setShowSearch(false);
  };

  const tabClearance =
    FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_GAP + Math.max(insets.bottom, 8);

  return (
    <AmbientBackground colors={colors}>
      <AppHeader
        colors={colors}
        period={period}
        title={showingResults ? 'Resultados' : 'Explorar'}
        subtitle={city}
      />

      {showingResults ? (
        <RecommendationResults colors={colors} bottomPad={tabClearance} onRestart={onRestart} />
      ) : (
        <>
          <ScrollView
            style={styles.body}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {showSearch ? (
              <SearchBar colors={colors} placeholder={`Buscar em ${city}`} onSearch={onTextSearch} />
            ) : (
              <Pressable
                onPress={() => setShowSearch(true)}
                style={({ pressed }) => [
                  styles.searchChip,
                  {
                    backgroundColor: colors.surfaceStrong,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <Text style={[styles.searchChipLabel, { color: colors.textMuted }]}>
                  Buscar lugares em {city}
                </Text>
              </Pressable>
            )}

            <View style={styles.progressWrap}>
              <MoodProgressBar colors={colors} currentStep={step} totalSteps={3} />
            </View>

            <View style={styles.copyBlock}>
              <Text style={[styles.question, { color: colors.textPrimary }]}>
                {current.question}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {step === 2 && selectedActivities.length > 0
                  ? `${selectedActivities.length} escolhida${selectedActivities.length > 1 ? 's' : ''} — pode continuar`
                  : current.subtitle}
              </Text>
            </View>

            <View style={styles.grid}>
              {current.options.map((item) => (
                <MoodOptionButton
                  key={getOptionKey(item)}
                  colors={colors}
                  option={item}
                  selected={isSelected(item)}
                  multi={isLast}
                  onPress={() => onSelect(item)}
                />
              ))}
            </View>
          </ScrollView>

          {step === 0 ? null : (
            <View
              style={[
                styles.bottomBar,
                {
                  paddingBottom: tabClearance + spacing.sm,
                  backgroundColor: colors.bg,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <Pressable
                onPress={() => {
                  if (advanceTimer.current) clearTimeout(advanceTimer.current);
                  setStep(step - 1);
                }}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                style={({ pressed }) => [
                  styles.backButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    opacity: loading ? 0.5 : pressed ? 0.88 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
              </Pressable>

              {isLast ? (
                <Pressable
                  onPress={onPrimary}
                  disabled={!canPress}
                  accessibilityRole="button"
                  accessibilityLabel="Descobrir lugares"
                  style={({ pressed }) => [
                    styles.primaryButton,
                    {
                      backgroundColor: canPress
                        ? colors.buttonInk
                        : colors.surfaceStrong,
                      opacity: pressed && canPress ? 0.9 : 1,
                      transform: [{ scale: pressed && canPress ? 0.98 : 1 }],
                    },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.buttonInkText} />
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.primaryLabel,
                          {
                            color: canPress
                              ? colors.buttonInkText
                              : colors.textMuted,
                          },
                        ]}
                      >
                        Descobrir lugares
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={canPress ? colors.buttonInkText : colors.textMuted}
                      />
                    </>
                  )}
                </Pressable>
              ) : (
                <View style={styles.primaryButtonSpacer} />
              )}
            </View>
          )}
        </>
      )}
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  searchChip: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    height: 40,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchChipLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressWrap: {
    paddingHorizontal: spacing.md,
    marginTop: 4,
    marginBottom: 16,
  },
  copyBlock: {
    paddingHorizontal: spacing.md,
    marginBottom: 16,
  },
  question: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.7,
    lineHeight: 34,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    rowGap: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonSpacer: {
    flex: 1,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
