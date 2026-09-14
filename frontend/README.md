# Unbora Frontend — Portal Admin (React)

Portal administrativo em **React + Next.js + TypeScript**.

Consome a mesma **API NestJS** do app mobile (`../backend/`).

## Como rodar

```bash
# 1. Backend Nest
cd ../backend && npm run start:dev

# 2. Portal admin
cd ../frontend
npm install
cp .env.example .env.local
npm run dev
```

→ http://localhost:3000

## Variáveis (.env.local)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## Endpoints usados

| Rota | Uso |
|---|---|
| `GET /users` | Lista usuários do app |
| `GET /users/stats` | Métricas do dashboard |
| `GET /health` | Status da API |
