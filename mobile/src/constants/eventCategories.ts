export const EVENT_CATEGORIES = [
  'Shows',
  'Gastronomia',
  'Festas',
  'Cultura',
  'Esportes',
  'Feiras',
  'Outros',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

const DEFAULT_IMAGES: Record<EventCategory, string> = {
  Shows:
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
  Gastronomia:
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop&q=80',
  Festas:
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
  Cultura:
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop&q=80',
  Esportes:
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
  Feiras:
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
  Outros:
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
};

export function defaultImageForCategory(category: string): string {
  const key = EVENT_CATEGORIES.find((c) => c === category) ?? 'Outros';
  return DEFAULT_IMAGES[key];
}
