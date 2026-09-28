# Unbora Admin

Portal administrativo em **React + Next.js + TypeScript**.

Consome a API Spring Boot (`../backend/`). O site público fica em `../frontend`.

## Como rodar

```bash
cd admin
npm install
cp .env.example .env.local
npm run dev
```

→ http://localhost:3002

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
