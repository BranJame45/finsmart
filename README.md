# FinSmart — Plataforma Financiera Personal con IA

Gestión financiera personal con simulación de inversiones en plazo fijo y recomendaciones con IA.

## Stack

- **Backend:** NestJS + Prisma + PostgreSQL
- **Frontend:** Next.js 15 + Tailwind CSS + Recharts
- **IA:** Groq API (Llama 3.3 70B)
- **Auth:** JWT + bcrypt
- **Infra:** Docker + docker-compose

## Requisitos

- Node.js 18+
- Docker + docker-compose
- PostgreSQL (si no usas Docker)

## Desarrollo local

```bash
# 1. Clonar e instalar dependencias
cd apps/api && npm install
cd ../web && npm install

# 2. Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Iniciar base de datos con Docker
docker compose up db -d

# 4. Migrar base de datos
cd apps/api
npx prisma migrate dev
npx prisma generate

# 5. Iniciar API
npm run start:dev

# 6. En otra terminal, iniciar frontend
cd apps/web
npm run dev
```

## Con Docker

```bash
docker compose up --build
```

API: http://localhost:3001  
Web:  http://localhost:3000

## Estructura

```
finsmart/
├── apps/
│   ├── api/          # Backend NestJS
│   └── web/          # Frontend Next.js
├── docker-compose.yml
└── README.md
```
