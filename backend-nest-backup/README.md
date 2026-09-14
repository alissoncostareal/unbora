# Unbora Backend (NestJS)

API central do Unbora — usada pelo **mobile**, **frontend admin** e futuros serviços.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/recomendar` | Recomendações por IA |
| POST | `/users/register` | Cadastro de usuário |
| POST | `/users/login` | Login |
| POST | `/users/sync` | Sincroniza sessão do app mobile |
| GET | `/users` | Lista usuários (admin) |
| GET | `/users/stats` | Estatísticas (admin) |

## Como rodar

```bash
cd backend
npm install
# Configure DATABASE_URL no .env da raiz do monorepo
npm run db:deploy
npm run start:dev
```

O servidor sobe em **http://localhost:3001**.

## Banco de dados (PostgreSQL)

Persistência via **Prisma + PostgreSQL** (Neon, Supabase, Railway, etc.).

```bash
npm run db:deploy    # aplica migrations no banco
npm run db:migrate   # cria nova migration em dev
npm run db:studio    # UI visual do Prisma
```

Tabelas: `users`, `carousels`, `notifications`, `portal_users`.

## Variáveis de ambiente

Carrega automaticamente o `.env` da raiz do repositório.

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL |
| `GROQ_API_KEY` | Chave da API Groq |
| `BRAVE_API_KEY` | Brave Search (opcional) |
| `ALLOWED_ORIGIN` | CORS |
| `PORT` | Porta (padrão 3001) |
| `SUPERADMIN_*` | Credenciais do superadmin do portal |
