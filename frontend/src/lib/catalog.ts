export const JOURNEY_KEY = 'unbora-journey';

export interface JourneyChoice {
  moodLabel: string;
  moodLine: string;
  interests: string[];
  social: string;
  budgetReais: number;
  time: string;
  city: string;
  latitude?: number;
  longitude?: number;
  radiusKm: number;
}

export const moods = [
  { label: 'Relaxar', value: 'relaxar, em paz, sem pressa', line: 'Seu momento pede algo mais tranquilo.', note: 'Pausas lentas, sombras frescas, vinho e café.' },
  { label: 'Animado', value: 'animado, com energia, querendo aproveitar', line: 'Seu momento pede algo mais leve.', note: 'Vozes altas, som selecionado, balcão vivo.' },
  { label: 'Sair da rotina', value: 'sair da rotina, um programa diferente', line: 'Seu momento pede uma quebra de rotina.', note: 'Esquinas inéditas, conceitos fora do padrão.' },
  { label: 'Encontro', value: 'um encontro, clima a dois', line: 'Seu momento pede um encontro.', note: 'Iluminação indireta, acústica para conversar.' },
  { label: 'Curioso', value: 'curioso, querendo descobrir algo novo', line: 'Seu momento pede algo que você ainda não conhece.', note: 'Galerias de bairro, feiras locais, cardápios autorais.' },
  { label: 'Em paz', value: 'em paz, um tempo só seu', line: 'Seu momento pede um tempo só seu.', note: 'Brisa atlântica, pouca gente, silêncio protegido.' },
];

export const interests = [
  { id: 'cafe', label: 'Cafés', searchHint: 'cafés, padarias e brunch' },
  { id: 'music', label: 'Música', searchHint: 'música ao vivo, bares com show e casas de show' },
  { id: 'nature', label: 'Natureza', searchHint: 'parques, trilhas, mirantes e áreas verdes' },
  { id: 'food', label: 'Gastronomia', searchHint: 'restaurantes, bistrôs, almoço e jantar' },
  { id: 'culture', label: 'Cultura', searchHint: 'museus, teatros, centros culturais e feiras' },
  { id: 'games', label: 'Games', searchHint: 'fliperamas, board games e jogos' },
  { id: 'beach', label: 'Praia', searchHint: 'praia, orla e quiosques' },
  { id: 'cinema', label: 'Cinema', searchHint: 'cinemas e sessões de filme' },
];

export const activities = interests;

export const company = [
  { label: 'Sozinho', value: 'sozinho' },
  { label: 'A dois', value: 'a dois' },
  { label: 'Com amigos', value: 'com amigos' },
  { label: 'Com família', value: 'em família' },
  { label: 'Conhecendo pessoas', value: 'aberto a conhecer pessoas' },
];

export const durations = [
  { id: '30', label: '30 min', value: '30 minutos' },
  { id: '60', label: '1h', value: '1 hora' },
  { id: '120', label: '2h', value: '2 horas' },
  { id: '180', label: '3h+', value: '3 horas ou mais' },
];
