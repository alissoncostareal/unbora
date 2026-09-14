# Unbora Mobile (React Native + Expo)

App mobile que consome a **API NestJS** em `../backend/`.

## Stack

- Expo SDK 57 + Expo Router
- React Native + TypeScript
- Zustand (estado local)
- API Nest (`/api/recomendar`, `/users/*`)

## Como rodar

```bash
# 1. Backend Nest (obrigatório)
cd ../backend && npm run start:dev

# 2. Mobile
cd ../mobile
npm install
cp .env.example .env
npm start
```

Pressione `i` (iOS) ou `a` (Android).

## Variáveis (.env)

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
```

## Endpoints usados

| Rota | Uso |
|---|---|
| `POST /api/recomendar` | Recomendações de lugares |
| `POST /users/sync` | Sincroniza sessão (convidado/cadastrado) |
| `POST /users/register` | Cadastro |
| `POST /users/login` | Login |
