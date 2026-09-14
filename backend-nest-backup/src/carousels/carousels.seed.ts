import { Prisma } from '@prisma/client';

export const DEFAULT_CAROUSELS: Prisma.CarouselCreateManyInput[] = [
  {
    id: '1',
    title: 'Round-the-clock wellness',
    subtitle: 'Explore o melhor do autocuidado e bem-estar em Fortaleza',
    tag: 'Destaque',
    imageUrl:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    sortOrder: 0,
    active: true,
  },
  {
    id: '2',
    title: 'Aventuras ao Ar Livre',
    subtitle: 'Descubra praias escondidas e trilhas incríveis',
    tag: 'Natureza',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    sortOrder: 1,
    active: true,
  },
  {
    id: '3',
    title: 'Gastronomia Local',
    subtitle: 'Os melhores cafés, bistrôs e restaurantes na orla',
    tag: 'Gastronomia',
    imageUrl:
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    sortOrder: 2,
    active: true,
  },
  {
    id: '4',
    title: 'Sunset em Canoa Quebrada',
    subtitle: 'Cliffs, dunas e música ao vivo no litoral leste',
    tag: 'Evento',
    imageUrl:
      'https://images.unsplash.com/photo-1473496167767-577a174412d8?w=800&auto=format&fit=crop&q=80',
    city: 'Canoa Quebrada',
    region: 'Litoral Leste',
    sortOrder: 0,
    active: true,
  },
  {
    id: 'organic-seed-cafes',
    title: 'Cafés calmos para focar',
    subtitle: 'Curadoria Unbora: lugares bons para trabalhar sem pressa',
    tag: 'Dica Unbora',
    imageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    sortOrder: 10,
    active: true,
  },
  {
    id: 'organic-seed-gratis',
    title: 'O que fazer de graça',
    subtitle: 'Sugestões da comunidade: cultura e lazer sem custo',
    tag: 'Comunidade',
    imageUrl:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    sortOrder: 11,
    active: true,
  },
];
