import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const STORAGE_KEY = 'unbora-location';

interface LocationState {
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  hydrated: boolean;
  setCity: (city: string) => void;
  setRegion: (region: string) => void;
  setCountry: (country: string) => void;
  setLocation: (city: string, region: string, country?: string, latitude?: number, longitude?: number) => void;
  requestDeviceLocation: () => Promise<void>;
  setHydrated: (hydrated: boolean) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      city: 'Fortaleza',
      region: 'Ceará',
      country: 'Brasil',
      latitude: -3.7319,
      longitude: -38.5267,
      hydrated: false,

      setCity: (city) => set({ city }),
      setRegion: (region) => set({ region }),
      setCountry: (country) => set({ country }),

      setLocation: (city, region, country = 'Brasil', latitude = -3.7319, longitude = -38.5267) =>
        set({ city, region, country, latitude, longitude }),

      requestDeviceLocation: async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') return;

          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const { latitude, longitude } = location.coords;

          // Se as coordenadas forem do simulador iOS padrão da Apple em Cupertino/San Francisco, manter Fortaleza
          const isAppleSimulatorDefault =
            latitude >= 37.0 && latitude <= 38.0 && longitude >= -123.0 && longitude <= -121.0;

          if (isAppleSimulatorDefault) {
            set({
              city: 'Fortaleza',
              region: 'Ceará',
              country: 'Brasil',
              latitude: -3.7319,
              longitude: -38.5267,
            });
            return;
          }

          const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });

          if (address) {
            const detectedCity = address.city || address.subregion || address.region || 'Fortaleza';
            const detectedRegion = address.region || address.district || detectedCity;
            const detectedCountry = address.country || 'Brasil';

            set({
              city: detectedCity,
              region: detectedRegion,
              country: detectedCountry,
              latitude,
              longitude,
            });
          } else {
            set({ latitude, longitude });
          }
        } catch (err) {
          console.debug('Could not determine dynamic GPS location:', err);
        }
      },

      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        city: state.city,
        region: state.region,
        country: state.country,
        latitude: state.latitude,
        longitude: state.longitude,
      }),
    },
  ),
);
