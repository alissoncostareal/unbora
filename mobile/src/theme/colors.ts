import type { UnboraDayPeriod } from '@/types';

export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * Design system Unbora — guia emocional de Fortaleza.
 * Coral da orla = ação e emoção (CTA, seleção).
 * Oceano/lagoa = apoio de marca e atmosfera (não satura a UI).
 */
export interface ThemeColors {
  scheme: ColorScheme;
  period: UnboraDayPeriod;
  primary: string;
  primaryMuted: string;
  accent: string;
  accentMuted: string;
  bg: string;
  surface: string;
  surfaceStrong: string;
  textPrimary: string;
  textMuted: string;
  border: string;
  danger: string;
  gold: string;
  like: string;
  useGlass: boolean;
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  buttonInk: string;
  buttonInkText: string;
}

const BRAND = {
  /** Coral da orla — ação, humor, destaque */
  coral: '#E85D4C',
  coralMutedLight: 'rgba(232, 93, 76, 0.12)',
  coralMutedDark: 'rgba(251, 113, 133, 0.2)',
  coralBright: '#FB7185',
  /** Oceano — atmosfera / apoio (não CTA principal) */
  ocean: '#0F766E',
  oceanMutedLight: 'rgba(15, 118, 110, 0.1)',
  oceanMutedDark: 'rgba(45, 212, 191, 0.16)',
  oceanBright: '#2DD4BF',
  like: '#E85D4C',
  danger: '#DC2626',
  gold: '#D97706',
} as const;

export const LIGHT_THEME: ThemeColors = {
  scheme: 'light',
  period: 'afternoon',
  primary: BRAND.coral,
  primaryMuted: BRAND.coralMutedLight,
  accent: BRAND.ocean,
  accentMuted: BRAND.oceanMutedLight,
  bg: '#F7F4F2',
  surface: '#FFFFFF',
  surfaceStrong: '#EEE8E4',
  textPrimary: '#1A1512',
  textMuted: '#6B605A',
  border: '#E2D9D3',
  danger: BRAND.danger,
  gold: BRAND.gold,
  like: BRAND.like,
  useGlass: false,
  buttonPrimary: BRAND.coral,
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#EEE8E4',
  buttonSecondaryText: '#1A1512',
  buttonInk: '#1A1512',
  buttonInkText: '#FFFFFF',
};

export const DARK_THEME: ThemeColors = {
  scheme: 'dark',
  period: 'night',
  primary: BRAND.coralBright,
  primaryMuted: BRAND.coralMutedDark,
  accent: BRAND.oceanBright,
  accentMuted: BRAND.oceanMutedDark,
  bg: '#120E0C',
  surface: '#1C1614',
  surfaceStrong: '#2A221F',
  textPrimary: '#F7F2EF',
  textMuted: '#A89A93',
  border: '#3A2F2A',
  danger: BRAND.danger,
  gold: BRAND.gold,
  like: BRAND.like,
  useGlass: true,
  buttonPrimary: BRAND.coral,
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#2A221F',
  buttonSecondaryText: '#F7F2EF',
  buttonInk: '#F7F2EF',
  buttonInkText: '#120E0C',
};

/** @deprecated use LIGHT_THEME */
export const DEFAULT_THEME = LIGHT_THEME;

export function getThemeColors(scheme: ColorScheme = 'light'): ThemeColors {
  const theme = scheme === 'dark' ? DARK_THEME : LIGHT_THEME;
  return { ...theme, period: getDayPeriod() };
}

export function getDayPeriod(date = new Date()): UnboraDayPeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

export function getPeriodLabel(period: UnboraDayPeriod): string {
  switch (period) {
    case 'morning':
      return 'Manhã';
    case 'afternoon':
      return 'Tarde';
    case 'night':
      return 'Noite';
  }
}

export function getMoodLabel(period: UnboraDayPeriod): string {
  switch (period) {
    case 'morning':
      return 'Sol e brisa';
    case 'afternoon':
      return 'Sol e mar';
    case 'night':
      return 'Noite na orla';
  }
}

/** Acentos de período — destaques e perfil. */
export function getStoryRingColors(period: UnboraDayPeriod): [string, string, string] {
  switch (period) {
    case 'morning':
      return ['#FDBA74', '#E85D4C', '#FBBF24'];
    case 'afternoon':
      return ['#E85D4C', '#0F766E', '#F59E0B'];
    case 'night':
      return ['#FB7185', '#0EA5E9', '#F59E0B'];
  }
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 12, md: 14, lg: 18, pill: 100 } as const;
