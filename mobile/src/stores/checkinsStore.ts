import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CheckinItem {
  id: string;
  placeName: string;
  city: string;
  state: string;
  category: string;
  date: string;
  timestamp: number;
  rating?: number;
  imageUrl?: string;
  icon?: string;
  notes?: string;
}

export interface VisitedCity {
  id: string;
  name: string;
  state: string;
  country: string;
  checkinsCount: number;
  badge: string;
  coverImage: string;
  isCurrent?: boolean;
}

const DEFAULT_CHECKINS: CheckinItem[] = [
  {
    id: 'chk-1',
    placeName: 'Hoots Gastropub',
    city: 'Fortaleza',
    state: 'CE',
    category: 'Gastropub',
    date: 'Hoje às 14:30',
    timestamp: Date.now() - 1000 * 60 * 90,
    rating: 4.8,
    icon: 'beer-outline',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80',
    notes: 'Chopes artesanais e ambiente agradável no Meireles.',
  },
  {
    id: 'chk-2',
    placeName: 'Praia de Iracema (Sunset)',
    city: 'Fortaleza',
    state: 'CE',
    category: 'Praia & Lazer',
    date: 'Ontem às 17:45',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    rating: 4.9,
    icon: 'sunny-outline',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    notes: 'Pôr do sol com vista para o espigão.',
  },
  {
    id: 'chk-3',
    placeName: 'Mercado dos Pinhões',
    city: 'Fortaleza',
    state: 'CE',
    category: 'Cultura & Gastronomia',
    date: '3 dias atrás',
    timestamp: Date.now() - 1000 * 60 * 60 * 72,
    rating: 4.7,
    icon: 'business-outline',
    imageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&auto=format&fit=crop&q=80',
    notes: 'Feira de arte, música e gastronomia local.',
  },
  {
    id: 'chk-4',
    placeName: 'Beco do Batman',
    city: 'São Paulo',
    state: 'SP',
    category: 'Cultura & Arte',
    date: 'Mês passado',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 35,
    rating: 4.8,
    icon: 'color-palette-outline',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80',
    notes: 'Galeria a céu aberto na Vila Madalena.',
  },
  {
    id: 'chk-5',
    placeName: 'Arpoador Sunset',
    city: 'Rio de Janeiro',
    state: 'RJ',
    category: 'Praia & Sunset',
    date: 'Em Janeiro',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 90,
    rating: 5.0,
    icon: 'sunny-outline',
    imageUrl: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=600&auto=format&fit=crop&q=80',
    notes: 'Pôr do sol clássico na pedra do Arpoador.',
  },
];

const DEFAULT_CITIES: VisitedCity[] = [
  {
    id: 'fortaleza',
    name: 'Fortaleza',
    state: 'Ceará',
    country: 'Brasil',
    checkinsCount: 3,
    badge: 'Base Atual',
    coverImage: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&auto=format&fit=crop&q=80',
    isCurrent: true,
  },
  {
    id: 'sao-paulo',
    name: 'São Paulo',
    state: 'São Paulo',
    country: 'Brasil',
    checkinsCount: 1,
    badge: 'Metrópole',
    coverImage: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop&q=80',
    isCurrent: false,
  },
  {
    id: 'rio-de-janeiro',
    name: 'Rio de Janeiro',
    state: 'Rio de Janeiro',
    country: 'Brasil',
    checkinsCount: 1,
    badge: 'Litoral',
    coverImage: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&auto=format&fit=crop&q=80',
    isCurrent: false,
  },
];

interface CheckinsState {
  checkins: CheckinItem[];
  cities: VisitedCity[];
  addCheckin: (item: Omit<CheckinItem, 'id' | 'timestamp'>) => void;
  removeCheckin: (id: string) => void;
  ensureCityVisited: (city: string, state?: string, country?: string) => void;
}

export const useCheckinsStore = create<CheckinsState>()(
  persist(
    (set, get) => ({
      checkins: DEFAULT_CHECKINS,
      cities: DEFAULT_CITIES,

      addCheckin: (item) => {
        const id = `chk-${Date.now()}`;
        const newCheckin: CheckinItem = {
          ...item,
          id,
          timestamp: Date.now(),
        };

        const currentCheckins = [newCheckin, ...get().checkins];
        set({ checkins: currentCheckins });

        // Atualiza contagem da cidade
        get().ensureCityVisited(item.city, item.state);
      },

      removeCheckin: (id) => {
        set({ checkins: get().checkins.filter((c) => c.id !== id) });
      },

      ensureCityVisited: (cityName: string, stateName?: string, countryName?: string) => {
        const cityKey = cityName.trim().toLowerCase();
        const existing = get().cities.find((c) => c.name.toLowerCase() === cityKey);

        if (existing) {
          const updated = get().cities.map((c) =>
            c.name.toLowerCase() === cityKey
              ? { ...c, checkinsCount: c.checkinsCount + 1 }
              : c,
          );
          set({ cities: updated });
        } else {
          const newCity: VisitedCity = {
            id: cityKey.replace(/\s+/g, '-'),
            name: cityName,
            state: stateName || 'Brasil',
            country: countryName || 'Brasil',
            checkinsCount: 1,
            badge: 'Explorada',
            coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
          };
          set({ cities: [newCity, ...get().cities] });
        }
      },
    }),
    {
      name: 'unbora-checkins-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ checkins: state.checkins, cities: state.cities }),
    },
  ),
);
