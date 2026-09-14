const { PrismaClient } = require('@prisma/client');
const { createHash } = require('crypto');

const prisma = new PrismaClient();

function daysFromNow(days, hour) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const merchantId = 'seed-merchant-unbora';

const events = [
  [
    'seed-event-1',
    'Sunset Jazz na Beira-Mar',
    'Sessão de jazz ao vivo com vista para o mar.',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    'Feirinha da Beira-Mar',
    1,
    18,
  ],
  [
    'seed-event-2',
    'Feira Gastronômica do Centro',
    'Sabores do Ceará em um só lugar.',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
    'Praça do Ferreira',
    2,
    11,
  ],
  [
    'seed-event-3',
    'Yoga no Parque do Cocó',
    'Aula aberta de yoga ao nascer do sol.',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
    'Parque do Cocó',
    3,
    6,
  ],
  [
    'seed-event-4',
    'Noite Eletrônica no Dragão',
    'DJs locais e nacionais no Dragão do Mar.',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    'Centro Dragão do Mar',
    4,
    22,
  ],
  [
    'seed-event-5',
    'Mercado de Arte Independente',
    'Ilustração, cerâmica e música ao vivo.',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80',
    'Mercado dos Pinhões',
    5,
    15,
  ],
  [
    'seed-event-6',
    'Stand-up Comedy Open Mic',
    'Novos humoristas sobem ao palco. Entrada franca.',
    'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&auto=format&fit=crop&q=80',
    'Bar do Cuscuz — Aldeota',
    6,
    20,
  ],
  [
    'seed-event-7',
    'Corrida Noturna da Orla',
    '5 km pela Beira-Mar com medalha e kit.',
    'https://images.unsplash.com/photo-1452626038306-9aae5eaccda1?w=800&auto=format&fit=crop&q=80',
    'Estátua de Iracema',
    7,
    19,
  ],
  [
    'seed-event-8',
    'Brunch & Vinil na Praia de Iracema',
    'Café da manhã estendido e vinil.',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80',
    'Varanda Cultural',
    8,
    10,
  ],
];

async function main() {
  await prisma.user.upsert({
    where: { id: merchantId },
    create: {
      id: merchantId,
      name: 'Casa Unbora',
      email: 'lojista@unbora.com',
      isGuest: false,
      passwordHash: createHash('sha256').update('unbora123').digest('hex'),
      platform: 'seed',
      role: 'merchant',
      businessName: 'Casa Unbora',
    },
    update: {
      role: 'merchant',
      businessName: 'Casa Unbora',
      isGuest: false,
    },
  });

  for (const [id, title, description, imageUrl, venue, days, hour] of events) {
    await prisma.event.upsert({
      where: { id },
      create: {
        id,
        title,
        description,
        imageUrl,
        venue,
        city: 'Fortaleza',
        region: 'Grande Fortaleza',
        startsAt: daysFromNow(days, hour),
        active: true,
        merchantId,
      },
      update: {
        title,
        description,
        imageUrl,
        venue,
        startsAt: daysFromNow(days, hour),
        active: true,
      },
    });
  }

  const list = await prisma.event.findMany({
    where: { city: 'Fortaleza', active: true },
    orderBy: { startsAt: 'asc' },
  });

  console.log(`Seeded ${list.length} events:`);
  for (const event of list) {
    console.log(`- ${event.title}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
