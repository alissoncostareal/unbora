import type { ActivityOption, WizardOption } from '@/types';

/**
 * Passo 1: Como você está se sentindo agora? (Humor atual)
 */
export const moods: WizardOption[] = [
  { label: 'Animado', icon: 'flash-outline', value: 'animado, com energia e querendo aproveitar' },
  { label: 'Tranquilo', icon: 'water-outline', value: 'tranquilo, relaxado e sem pressa' },
  { label: 'Social', icon: 'people-outline', value: 'social, querendo ver gente e encontrar amigos' },
  { label: 'Romântico', icon: 'heart-outline', value: 'romântico, em clima intimista a dois' },
  { label: 'Curioso', icon: 'compass-outline', value: 'curioso, querendo descobrir novidades e lugares inéditos' },
  { label: 'Cansado', icon: 'moon-outline', value: 'cansado, precisando desestressar, relaxar e recarregar' },
];

/**
 * Passo 2: Como você quer se sentir hoje? (Desejo emocional)
 */
export const feelings: WizardOption[] = [
  { label: 'Alegre', icon: 'sunny-outline', value: 'alegre, se divertindo, celebrando e dando risadas' },
  { label: 'Calmo', icon: 'leaf-outline', value: 'calmo, em paz, sossego e atmosfera serena' },
  { label: 'Energizado', icon: 'flame-outline', value: 'energizado, animado com música e agito' },
  { label: 'Conectado', icon: 'chatbubbles-outline', value: 'conectado com amigos em boa conversa e confraternização' },
  { label: 'Inspirado', icon: 'color-palette-outline', value: 'inspirado por arte, boa gastronomia e estética bonita' },
  { label: 'Encantado', icon: 'heart-half-outline', value: 'encantado, em clima charmoso, requintado e especial' },
];

/**
 * Passo 3: Que tipo de lugar você gosta ou quer ir? (Ambiente e preferências)
 */
export const activities: ActivityOption[] = [
  {
    id: 'food',
    label: 'Restaurantes',
    icon: 'restaurant-outline',
    value: 'restaurantes e gastronomia',
    searchHint: 'restaurantes, bistrôs, pizzarias artesanais, carnes nobres e frutos do mar',
  },
  {
    id: 'bars',
    label: 'Bares & Pubs',
    icon: 'beer-outline',
    value: 'bares, gastrobares e pubs',
    searchHint: 'gastrobares, cervejarias artesanais, chopp gelado, coquetelaria e petiscos',
  },
  {
    id: 'cafe',
    label: 'Cafeterias',
    icon: 'cafe-outline',
    value: 'cafeterias especiais e brunch',
    searchHint: 'cafés especiais, docerias artesanais, confeitarias, brunch e padarias',
  },
  {
    id: 'beach',
    label: 'Praia & Sunset',
    icon: 'umbrella-outline',
    value: 'praia, quiosques e pôr do sol',
    searchHint: 'barracas de praia, beach clubs, quiosques na orla e mirantes ao pôr do sol',
  },
  {
    id: 'live-music',
    label: 'Shows & Noite',
    icon: 'musical-notes-outline',
    value: 'música ao vivo e noite',
    searchHint: 'música ao vivo, forró, samba, jazz, pubs com show e baladas',
  },
  {
    id: 'culture',
    label: 'Cultura & Lazer',
    icon: 'color-palette-outline',
    value: 'cultura, passeios e parques',
    searchHint: 'museus, teatros, centros culturais, praças arborizadas e feiras artesanais',
  },
];

export const activityById = Object.fromEntries(
  activities.map((activity) => [activity.id, activity]),
) as Record<string, ActivityOption>;
