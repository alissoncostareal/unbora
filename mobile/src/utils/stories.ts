import type { CarouselItem } from '@/api/carousels';
import {
  ORGANIC_STORIES,
  SPONSORED_ACTIVITY_HINTS,
  type OrganicStory,
} from '@/constants/organicStories';

export type StoryItem = CarouselItem & {
  source?: 'sponsored' | 'organic';
  activityIds?: string[];
  moodKeywords?: string[];
};

function matchesCity(story: StoryItem, city: string, region: string): boolean {
  const cityOk =
    !city ||
    story.city.toLowerCase() === city.toLowerCase() ||
    story.city.toLowerCase().includes(city.toLowerCase().split(' ')[0] ?? '');
  const regionOk =
    !region || story.region.toLowerCase() === region.toLowerCase();
  return cityOk || regionOk;
}

function scoreStory(
  story: StoryItem,
  mood: string | null,
  feeling: string | null,
  activityIds: string[],
): number {
  let score = 0;
  const haystack = `${mood ?? ''} ${feeling ?? ''}`.toLowerCase();
  const tag = story.tag.toLowerCase();

  const organic = story as OrganicStory;
  const linkedActivities =
    organic.activityIds ??
    SPONSORED_ACTIVITY_HINTS[tag] ??
    SPONSORED_ACTIVITY_HINTS[
      Object.keys(SPONSORED_ACTIVITY_HINTS).find((key) => tag.includes(key)) ?? ''
    ] ??
    [];

  for (const activityId of activityIds) {
    if (linkedActivities.includes(activityId)) score += 4;
  }

  const keywords = organic.moodKeywords ?? [];
  for (const keyword of keywords) {
    if (haystack.includes(keyword.toLowerCase())) score += 3;
  }

  // Tags genéricas do conteúdo também contam
  if (activityIds.includes('food') && tag.includes('gastro')) score += 3;
  if (activityIds.includes('beach') && (tag.includes('natureza') || tag.includes('praia'))) {
    score += 3;
  }
  if (
    (activityIds.includes('nightlife') || activityIds.includes('live-music')) &&
    tag.includes('evento')
  ) {
    score += 3;
  }
  if (activityIds.includes('outdoors') && tag.includes('natureza')) score += 3;
  if (activityIds.includes('culture') && (tag.includes('cultura') || tag.includes('evento'))) {
    score += 2;
  }
  if (activityIds.includes('pet-friendly') && (tag.includes('natureza') || tag.includes('dica'))) {
    score += 3;
  }

  // Orgânico leve boost para combater banner blindness
  if (story.source === 'organic' || tag.includes('unbora') || tag.includes('dica') || tag.includes('comunidade')) {
    score += 1;
  }

  return score;
}

/**
 * Mistura curadoria Unbora + patrocinados (A),
 * opcionalmente priorizando pelo humor do wizard (D).
 */
export function buildStories(options: {
  sponsored: CarouselItem[];
  city: string;
  region: string;
  mood?: string | null;
  feeling?: string | null;
  activityIds?: string[];
}): StoryItem[] {
  const {
    sponsored,
    city,
    region,
    mood = null,
    feeling = null,
    activityIds = [],
  } = options;

  const organic: StoryItem[] = ORGANIC_STORIES.filter((story) =>
    matchesCity(story, city, region),
  ).map((story) => ({ ...story }));

  // API só entra como patrocinado — curadoria fica no catálogo local (evita duplicar)
  const sponsoredItems: StoryItem[] = sponsored
    .filter((item) => {
      if (item.active === false) return false;
      if (item.id.startsWith('organic')) return false;
      const tag = item.tag.toLowerCase();
      return !(
        tag.includes('unbora') ||
        tag.includes('dica') ||
        tag.includes('comunidade')
      );
    })
    .map((item) => ({
      ...item,
      source: 'sponsored' as const,
    }));

  // Intercala: orgânico, patrocinado, orgânico...
  const mixed: StoryItem[] = [];
  const max = Math.max(organic.length, sponsoredItems.length);
  for (let i = 0; i < max; i += 1) {
    if (organic[i]) mixed.push(organic[i]);
    if (sponsoredItems[i]) mixed.push(sponsoredItems[i]);
  }

  if (activityIds.length === 0 && !mood && !feeling) {
    return mixed;
  }

  return [...mixed].sort((a, b) => {
    const scoreDiff =
      scoreStory(b, mood, feeling, activityIds) -
      scoreStory(a, mood, feeling, activityIds);
    if (scoreDiff !== 0) return scoreDiff;
    return a.order - b.order;
  });
}
