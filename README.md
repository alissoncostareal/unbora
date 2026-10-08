# Unbora Fortaleza

> Descubra o que fazer hoje em Fortaleza com recomendações personalizadas por IA.

O backlog principal está em [BACKLOG.md](BACKLOG.md).

## Estrutura do monorepo

```
unbora/
├── mobile/                 # App React Native (Expo)
├── frontend/               # Site público (o mesmo serviço do app)
├── admin/                  # Portal administrativo (Next.js)
├── backend/                # API Java 21 + Spring Boot 3.4
├── .env                    # Secrets do backend (não versionar)
└── README.md
```

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐
│  mobile/        │     │  frontend/      │
│  React Native   │     │  Site público   │
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
| `frontend/` | **React** (Vite) | Site público — humor, busca e eventos |
| `admin/` | **React** (Next.js) | Portal administrativo |
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

### 2. Site público

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

→ http://localhost:3000

### 3. Portal admin

```bash
cd admin
npm install
cp .env.example .env.local
npm run dev
```

→ http://localhost:3002

### 4. App mobile

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

## Deploy na VPS

O push em `main` roda o CI e, se passar, publica a API no mesmo k3s do PartiuMenu (`173.212.242.9`), no namespace `unbora`. O banco `unbora` é criado no Postgres que já está no namespace `data`. O Kafka também é o do cluster.

Na primeira vez, no repositório GitHub: Settings → Environments → `production` → adicione o secret `VPS_SSH_KEY` (a mesma chave da VPS). Chaves da API (`GROQ_API_KEY`, `BRAVE_API_KEY`, `GOOGLE_PLACES_API_KEY`, `ADMIN_JWT_SECRET`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`) são opcionais nesse environment; quando existirem, o deploy grava no Secret do cluster sem imprimir o valor.

API: https://api.unbora.com.br/health

## Variáveis de ambiente (raiz `.env`)

| Variável | Uso |
|---|---|
| `GROQ_API_KEY` | Chave da IA no Groq |
| `DATABASE_URL` | PostgreSQL. Na VPS, banco `unbora` no Postgres do cluster |
| `GOOGLE_PLACES_API_KEY` | Busca oficial de fotos de alta resolução dos locais e eventos |
| `BRAVE_API_KEY` | Contexto de eventos e buscas web |
| `SUPERADMIN_EMAIL` | E-mail do superadministrador |
| `SUPERADMIN_PASSWORD` | Senha do superadministrador |
| `ADMIN_JWT_SECRET` | Segredo para assinatura de tokens JWT |
| `ALLOWED_ORIGIN` | CORS (`*` ou origens específicas) |
| `PORT` | Porta HTTP da API (padrão `3001`) |

---

Feito com carinho em Fortaleza.
