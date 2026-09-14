# Unbora Fortaleza

> Descubra o que fazer hoje em Fortaleza com recomendações personalizadas por IA.

## Estrutura do monorepo

```
unbora/
├── mobile/                 # App React Native (Expo)
├── frontend/               # Portal admin web (Next.js)
├── backend/                # API Java 21 + Spring Boot 3.4
├── backend-nest-backup/    # Backup do backend legado NestJS
├── .env                    # Secrets do backend (não versionar)
└── README.md
```

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐
│  mobile/        │     │  frontend/      │
│  React Native   │     │  React (Next)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
            ┌─────────────────┐
            │  backend/       │
            │  Spring Boot 3  │
            └─────────────────┘
```

| Pasta | Stack | Função |
|---|---|---|
| `backend/` | **Java 21 + Spring Boot 3.4** | API única — IA, usuários, admin, OpenAPI Swagger |
| `frontend/` | **React** (Next.js) | Portal administrativo web |
| `mobile/` | **React Native** (Expo) | App iOS/Android |

## Como rodar tudo localmente

### 1. Backend Java Spring Boot (obrigatório)

```bash
# Na raiz do projeto, certifique-se de preencher o .env com GROQ_API_KEY e DATABASE_URL
cd backend
./mvnw clean package -DskipTests
java -jar target/unbora-api-1.0.0.jar
# ou durante o desenvolvimento:
./mvnw spring-boot:run
```

→ API: http://localhost:3001  
→ Swagger UI: http://localhost:3001/swagger-ui.html  
→ OpenAPI Docs: http://localhost:3001/v3/api-docs

### 2. Portal admin

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

→ http://localhost:3000

### 3. App mobile

```bash
cd mobile
npm install
cp .env.example .env   # EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
npm start
```

Pressione `i` para abrir no simulador iOS ou `a` para Android.

## Fluxo de dados

```
Mobile (Expo) ──POST /users/sync──► Backend (Spring Boot 3.4) ◄──GET /users── Frontend (Next.js)
       │                                     │
       └────── POST /api/recomendar ─────────┘
```

## Variáveis de ambiente (raiz `.env`)

| Variável | Uso |
|---|---|
| `GROQ_API_KEY` | Chave da IA no Groq |
| `DATABASE_URL` | String de conexão PostgreSQL (Neon / Supabase / Local) |
| `GOOGLE_PLACES_API_KEY` | Busca oficial de fotos de alta resolução dos locais e eventos |
| `BRAVE_API_KEY` | Contexto de eventos e buscas web |
| `SUPERADMIN_EMAIL` | E-mail do superadministrador |
| `SUPERADMIN_PASSWORD` | Senha do superadministrador |
| `ADMIN_JWT_SECRET` | Segredo para assinatura de tokens JWT |
| `ALLOWED_ORIGIN` | CORS (`*` ou origens específicas) |
| `PORT` | Porta HTTP da API (padrão `3001`) |

---

Feito com carinho em Fortaleza.
