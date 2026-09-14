import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';

export const SEED_MERCHANT_ID = 'seed-merchant-unbora';

export const SEED_MERCHANT: Prisma.UserCreateInput = {
  id: SEED_MERCHANT_ID,
  name: 'Casa Unbora',
  email: 'lojista@unbora.com',
  isGuest: false,
  passwordHash: createHash('sha256').update('unbora123').digest('hex'),
  platform: 'seed',
  role: 'merchant',
  businessName: 'Casa Unbora',
};

type SeedEvent = Omit<Prisma.EventCreateManyInput, 'merchantId' | 'startsAt'> & {
  startsAt: Date;
};

/** Eventos de exemplo em Fortaleza / Grande Fortaleza */
export const SEED_EVENTS: SeedEvent[] = [
  {
    id: 'seed-event-1',
    title: 'Sunset Jazz na Beira-Mar',
    description:
      'Sessão de jazz ao vivo com vista para o mar. Food trucks e drinks especiais.',
    imageUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    venue: 'Feirinha da Beira-Mar',
    startsAt: daysFromNow(1, 18),
    active: true,
  },
  {
    id: 'seed-event-2',
    title: 'Feira Gastronômica do Centro',
    description:
      'Sabores do Ceará em um só lugar: caranguejo, tapioca, cajuína e sobremesas.',
    imageUrl:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    venue: 'Praça do Ferreira',
    startsAt: daysFromNow(2, 11),
    active: true,
  },
  {
    id: 'seed-event-3',
    title: 'Yoga no Parque do Cocó',
    description:
      'Aula aberta de yoga ao nascer do sol. Leve tapete e garrafa de água.',
    imageUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    venue: 'Parque do Cocó — portão principal',
    startsAt: daysFromNow(3, 6),
    active: true,
  },
  {
    id: 'seed-event-4',
    title: 'Noite Eletrônica no Dragão',
    description:
      'DJs locais e nacionais no Dragão do Mar. Open bar até meia-noite.',
    imageUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    venue: 'Centro Dragão do Mar',
    startsAt: daysFromNow(4, 22),
    active: true,
  },
  {
    id: 'seed-event-5',
    title: 'Mercado de Arte Independente',
    description:
      'Ilustração, cerâmica, moda e música ao vivo de artistas cearenses.',
    imageUrl:
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    venue: 'Mercado dos Pinhões',
    startsAt: daysFromNow(5, 15),
    active: true,
  },
  {
    id: 'seed-event-6',
    title: 'Stand-up Comedy Open Mic',
    description:
      'Novos humoristas sobem ao palco. Entrada franca — chega cedo para garantir lugar.',
    imageUrl:
      'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    venue: 'Bar do Cuscuz — Aldeota',
    startsAt: daysFromNow(6, 20),
    active: true,
  },
  {
    id: 'seed-event-7',
    title: 'Corrida Noturna da Orla',
    description:
      '5 km pela Beira-Mar com medalha e kit. Inscrições no local até 30 min antes.',
    imageUrl:
      'https://images.unsplash.com/photo-1452626038306-9aae5eaccda1?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    venue: 'Estátua de Iracema',
    startsAt: daysFromNow(7, 19),
    active: true,
  },
  {
    id: 'seed-event-8',
    title: 'Brunch & Vinil na Praia de Iracema',
    description:
      'Café da manhã estendido, vinil e ocean breeze. Ideal para o fim de semana.',
    imageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    venue: 'Varanda Cultural',
    startsAt: daysFromNow(8, 10),
    active: true,
  },
];

function daysFromNow(days: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}
