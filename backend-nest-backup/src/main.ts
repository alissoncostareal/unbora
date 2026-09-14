import { loadEnvFiles } from './config/load-env';

loadEnvFiles();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.ALLOWED_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');

  const dbReady = Boolean(process.env.DATABASE_URL);
  const groqReady = Boolean(process.env.GROQ_API_KEY);
  const braveReady = Boolean(process.env.BRAVE_API_KEY);
  const placesReady = Boolean(
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
      process.env.GOOGLE_MAPS_API_KEY?.trim(),
  );
  const superadminReady = Boolean(
    process.env.SUPERADMIN_EMAIL?.trim() && process.env.SUPERADMIN_PASSWORD,
  );
  const jwtReady = Boolean(process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET);
  const superadminEmail = process.env.SUPERADMIN_EMAIL?.trim() ?? '';
  const maskedSuperadminEmail = superadminEmail
    ? superadminEmail.replace(/(.{2}).+(@.*)/, '$1***$2')
    : 'não configurado';
  const baseUrl = `http://localhost:${port}`;

  const row = (text: string) => `║  ${text.padEnd(44)}║`;

  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log(row('✓ Unbora API rodando'));
  console.log('╠══════════════════════════════════════════════╣');
  console.log(row(`Local:    ${baseUrl}`));
  console.log(row(`Health:   ${baseUrl}/health`));
  console.log(row(`Groq:     ${groqReady ? 'ok' : 'faltando GROQ_API_KEY'}`));
  console.log(row(`Postgres: ${dbReady ? 'ok (DATABASE_URL)' : 'faltando DATABASE_URL'}`));
  console.log(row(`Brave:    ${braveReady ? 'ok' : 'opcional'}`));
  console.log(row(`Places:   ${placesReady ? 'ok (fotos)' : 'faltando GOOGLE_PLACES_API_KEY'}`));
  console.log(row(`Admin:    ${superadminReady && jwtReady ? 'ok (.env)' : 'faltando SUPERADMIN_* / ADMIN_JWT_SECRET'}`));
  if (superadminReady) {
    console.log(row(`Super:    ${maskedSuperadminEmail}`));
  }
  console.log('╠══════════════════════════════════════════════╣');
  console.log(row(`Celular:  http://<seu-ip>:${port}`));
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
}

bootstrap();
