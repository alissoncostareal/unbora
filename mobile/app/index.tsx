import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { suggestCities, type CitySuggestion } from '@/api/locations';
import { useLocationStore } from '@/stores/locationStore';
import { spacing, type ThemeColors } from '@/theme/colors';
import { useDayTheme } from '@/theme/useDayTheme';

export default function CityGateScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useDayTheme();

  const storedCity = useLocationStore((s) => s.city);
  const storedRegion = useLocationStore((s) => s.region);
  const storedCountry = useLocationStore((s) => s.country);
  const setLocation = useLocationStore((s) => s.setLocation);
  const requestDeviceLocation = useLocationStore((s) => s.requestDeviceLocation);

  const [selectedCity, setSelectedCity] = useState(storedCity || 'Fortaleza');
  const [selectedRegion, setSelectedRegion] = useState(storedRegion || 'Ceará');
  const [selectedCountry, setSelectedCountry] = useState(storedCountry || 'Brasil');
  const [selectedLat, setSelectedLat] = useState<number | undefined>(undefined);
  const [selectedLng, setSelectedLng] = useState<number | undefined>(undefined);

  const [typedCity, setTypedCity] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const isModelCity = selectedCity.trim().toLowerCase() === 'fortaleza' && !selectedRegion;
  const placeLine = [selectedCity, selectedRegion].filter(Boolean).join(', ');

  const handleLocate = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      await requestDeviceLocation();
      const nextCity = useLocationStore.getState().city;
      const nextRegion = useLocationStore.getState().region;
      const nextCountry = useLocationStore.getState().country;
      const nextLat = useLocationStore.getState().latitude;
      const nextLng = useLocationStore.getState().longitude;

      if (nextCity) {
        setSelectedCity(nextCity);
        setSelectedRegion(nextRegion);
        setSelectedCountry(nextCountry || 'Brasil');
        setSelectedLat(nextLat);
        setSelectedLng(nextLng);
      }
    } catch {
      setLocationError('Não foi possível ler a localização.');
    } finally {
      setLocating(false);
    }
  };

  const handleTypeChange = async (text: string) => {
    setTypedCity(text);
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const results = await suggestCities(text);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const chooseSuggestion = (item: CitySuggestion) => {
    Keyboard.dismiss();
    setSelectedCity(item.city);
    setSelectedRegion(item.region);
    setSelectedCountry(item.country || 'Brasil');
    setSelectedLat(item.latitude ?? undefined);
    setSelectedLng(item.longitude ?? undefined);
    setTypedCity('');
    setSuggestions([]);
  };

  const handleManualUse = () => {
    const raw = typedCity.trim();
    if (!raw) return;
    Keyboard.dismiss();
    if (suggestions.length > 0) {
      chooseSuggestion(suggestions[0]);
      return;
    }
    setSelectedCity(raw);
    setSelectedRegion('');
    setTypedCity('');
    setSuggestions([]);
  };

  const handleContinue = () => {
    setLocation(
      selectedCity,
      selectedRegion,
      selectedCountry,
      selectedLat,
      selectedLng,
    );
    router.replace('/(tabs)/home');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 80 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Eyebrow */}
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>
            {isModelCity ? `CIDADE MODELO · ${selectedCity.toUpperCase()}` : placeLine.toUpperCase()}
          </Text>
          <View style={[styles.eyebrowDivider, { backgroundColor: colors.border }]} />

          {/* Central Editorial Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              Onde você está?
            </Text>
            <Text style={[styles.subheadline, { color: colors.textMuted }]}>
              Escolha sua cidade.
            </Text>

            {/* City Display */}
            <View style={styles.cityDisplayBlock}>
              <Text style={[styles.cityName, { color: colors.textPrimary }]}>
                {selectedCity.trim() || 'Sua cidade'}
              </Text>
              <Text style={[styles.citySubtitle, { color: colors.textMuted }]}>
                {isModelCity
                  ? 'Cidade modelo, enquanto a sua não carrega.'
                  : selectedRegion || selectedCountry}
              </Text>

              {/* Sugerir a cidade onde estou */}
              <Pressable
                onPress={handleLocate}
                disabled={locating}
                style={({ pressed }) => [
                  styles.locateBtn,
                  { opacity: pressed || locating ? 0.6 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Sugerir a cidade onde estou"
              >
                {locating ? (
                  <View style={styles.locatingRow}>
                    <ActivityIndicator size="small" color={colors.textPrimary} />
                    <Text style={[styles.locateText, { color: colors.textPrimary }]}>
                      Lendo sua posição
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.locateText, { color: colors.textPrimary }]}>
                    Sugerir a cidade onde estou
                  </Text>
                )}
              </Pressable>

              {locationError ? (
                <Text style={styles.errorText}>{locationError}</Text>
              ) : null}

              {/* Campo para escrever qualquer cidade */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                  Escreva qualquer cidade
                </Text>

                <View style={styles.inputRow}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    value={typedCity}
                    onChangeText={handleTypeChange}
                    placeholder="São Paulo, Lisboa, Tóquio"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleManualUse}
                  />
                  <Pressable
                    onPress={handleManualUse}
                    disabled={!typedCity.trim()}
                    style={({ pressed }) => [
                      styles.useBtn,
                      {
                        backgroundColor: colors.buttonInk,
                        opacity: !typedCity.trim() ? 0.35 : pressed ? 0.85 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Usar cidade digitada"
                  >
                    <Text style={[styles.useBtnText, { color: colors.buttonInkText }]}>
                      Usar
                    </Text>
                  </Pressable>
                </View>

                {searching ? (
                  <View style={styles.searchingRow}>
                    <ActivityIndicator size="small" color={colors.textMuted} />
                    <Text style={[styles.searchingText, { color: colors.textMuted }]}>
                      Buscando cidades...
                    </Text>
                  </View>
                ) : null}

                {/* Lista de sugestões */}
                {suggestions.length > 0 ? (
                  <View style={[styles.suggestionsBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                    {suggestions.map((item, index) => (
                      <Pressable
                        key={`${item.city}-${item.region}-${index}`}
                        onPress={() => chooseSuggestion(item)}
                        style={({ pressed }) => [
                          styles.suggestionItem,
                          {
                            borderBottomColor: colors.border,
                            backgroundColor: pressed ? colors.surfaceStrong : 'transparent',
                          },
                          index === suggestions.length - 1 && styles.lastSuggestionItem,
                        ]}
                      >
                        <Text style={[styles.suggestionTitle, { color: colors.textPrimary }]}>
                          {item.city}
                        </Text>
                        <Text style={[styles.suggestionMeta, { color: colors.textMuted }]}>
                          {[item.region, item.country].filter(Boolean).join(', ')}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom bar com botão Continuar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueBtn,
            {
              backgroundColor: colors.buttonInk,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Continuar para a página inicial"
        >
          <Text style={[styles.continueBtnText, { color: colors.buttonInkText }]}>
            Continuar →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontWeight: '500',
  },
  eyebrowDivider: {
    width: 48,
    height: 1,
    marginTop: 8,
    marginBottom: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderRadius: 0,
    padding: spacing.lg,
    paddingVertical: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headline: {
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subheadline: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '400',
  },
  cityDisplayBlock: {
    marginTop: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  cityName: {
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  citySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  locateBtn: {
    marginTop: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  locatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locateText: {
    fontSize: 13,
    textDecorationLine: 'underline',
    fontWeight: '400',
  },
  errorText: {
    color: '#9a4632',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  inputSection: {
    width: '100%',
    marginTop: 28,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'left',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  useBtn: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  searchingText: {
    fontSize: 12,
  },
  suggestionsBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 0,
    marginTop: 6,
    maxHeight: 220,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastSuggestionItem: {
    borderBottomWidth: 0,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
  },
  continueBtn: {
    height: 48,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
