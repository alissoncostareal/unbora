import type { UnboraDayPeriod } from '@/types';

export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * Design system Unbora — Identidade Editorial (Plataforma Unbora).
 * Terracota / Coral editorial (#7c2f1d, #9a4632).
 * Areia / Linho e neutros escuros (#1c1917, #e8e0d7, #faf8f5).
 * Cantos retos (rounded-none) e bordas finas (hairline).
 */
export interface ThemeColors {
  scheme: ColorScheme;
  period: UnboraDayPeriod;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;
  accent: string;
  accentMuted: string;
  bg: string;
  canvas: string;
  surface: string;
  surfaceStrong: string;
  surfaceSubtle: string;
  textPrimary: string;
  textMuted: string;
  textMutedLight: string;
  border: string;
  borderSubtle: string;
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

export const BRAND = {
  /** Terracota / Coral editorial */
  coral: '#9A4632',
  coralDark: '#7C2F1D',
  coralLight: '#FAF2EE',
  coralMutedLight: 'rgba(154, 70, 50, 0.08)',
  coralMutedDark: 'rgba(154, 70, 50, 0.22)',
  coralBright: '#B85842',

  /** Areia, Linho e Neutros escuros */
  ink: '#1C1917',
  inkDark: '#0F0D0C',
  sand: '#F3EFE8',
  canvas: '#FAF8F5',
  border: '#E8E0D7',
  borderSubtle: '#F0E9E1',
  muted: '#746C64',
  mutedLight: '#A89F91',

  like: '#9A4632',
  danger: '#991B1B',
  gold: '#B45309',
} as const;

export const LIGHT_THEME: ThemeColors = {
  scheme: 'light',
  period: 'afternoon',
  primary: BRAND.coral,
  primaryDark: BRAND.coralDark,
  primaryLight: BRAND.coralLight,
  primaryMuted: BRAND.coralMutedLight,
  accent: BRAND.coralDark,
  accentMuted: 'rgba(124, 47, 29, 0.08)',
  bg: BRAND.canvas,
  canvas: BRAND.canvas,
  surface: '#FFFFFF',
  surfaceStrong: BRAND.sand,
  surfaceSubtle: '#FBF9F5',
  textPrimary: BRAND.ink,
  textMuted: BRAND.muted,
  textMutedLight: BRAND.mutedLight,
  border: BRAND.border,
  borderSubtle: BRAND.borderSubtle,
  danger: BRAND.danger,
  gold: BRAND.gold,
  like: BRAND.like,
  useGlass: false,
  buttonPrimary: BRAND.coral,
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: BRAND.sand,
  buttonSecondaryText: BRAND.ink,
  buttonInk: BRAND.ink,
  buttonInkText: '#FFFFFF',
};

export const DARK_THEME: ThemeColors = {
  scheme: 'dark',
  period: 'night',
  primary: BRAND.coralBright,
  primaryDark: BRAND.coral,
  primaryLight: 'rgba(184, 88, 66, 0.15)',
  primaryMuted: BRAND.coralMutedDark,
  accent: BRAND.coralBright,
  accentMuted: 'rgba(184, 88, 66, 0.12)',
  bg: '#141210',
  canvas: '#141210',
  surface: '#1C1917',
  surfaceStrong: '#26221F',
  surfaceSubtle: '#181614',
  textPrimary: '#FAF8F5',
  textMuted: '#A89F91',
  textMutedLight: '#746C64',
  border: '#352F2A',
  borderSubtle: '#26221F',
  danger: '#DC2626',
  gold: '#D97706',
  like: BRAND.coralBright,
  useGlass: false,
  buttonPrimary: BRAND.coral,
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#26221F',
  buttonSecondaryText: '#FAF8F5',
  buttonInk: '#FAF8F5',
  buttonInkText: '#141210',
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
      return 'Brisa da manhã';
    case 'afternoon':
      return 'Tarde editorial';
    case 'night':
      return 'Noite na cidade';
  }
}

/** Acentos de período — tons terracota e areia */
export function getStoryRingColors(period: UnboraDayPeriod): [string, string, string] {
  switch (period) {
    case 'morning':
      return ['#C47A65', '#9A4632', '#E8E0D7'];
    case 'afternoon':
      return ['#9A4632', '#7C2F1D', '#FAF2EE'];
    case 'night':
      return ['#7C2F1D', '#9A4632', '#1C1917'];
  }
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

/** Cantos retos do design editorial Unbora (rounded-none) */
export const radius = { none: 0, sm: 0, md: 0, lg: 0, pill: 0 } as const;
