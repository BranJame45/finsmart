# FinSmart — PROJECT_STRUCTURE

## 1. Mapa de archivos

```
finsmart/
├── apps/
│   ├── api/                              # Backend NestJS
│   │   ├── src/
│   │   │   ├── main.ts                   # Entry point: CORS, prefix /api, ValidationPipe
│   │   │   ├── app.module.ts             # Módulo raíz: importa todos los módulos
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts        # Passport + JWT config
│   │   │   │   ├── auth.controller.ts    # POST /auth/register, /auth/login
│   │   │   │   ├── auth.service.ts       # Registro/login con bcrypt + JWT
│   │   │   │   ├── jwt.strategy.ts       # Extrae token Bearer, valida contra DB
│   │   │   │   └── dto/login.dto.ts      # Email + password con validación
│   │   │   ├── income/
│   │   │   │   ├── income.module.ts
│   │   │   │   ├── income.controller.ts  # CRUD /income
│   │   │   │   ├── income.service.ts     # Prisma queries para ingresos
│   │   │   │   └── dto/create-income.dto.ts
│   │   │   ├── expenses/
│   │   │   │   ├── expenses.module.ts
│   │   │   │   ├── expenses.controller.ts # CRUD /expenses
│   │   │   │   ├── expenses.service.ts
│   │   │   │   └── dto/create-expense.dto.ts
│   │   │   ├── categories/
│   │   │   │   ├── categories.module.ts
│   │   │   │   ├── categories.controller.ts # CRUD /categories
│   │   │   │   ├── categories.service.ts
│   │   │   │   └── dto/ (create, update)
│   │   │   ├── reports/
│   │   │   │   ├── reports.module.ts
│   │   │   │   ├── reports.controller.ts  # GET /reports/monthly-summary, annual, category-breakdown
│   │   │   │   └── reports.service.ts     # Agregación de ingresos/gastos
│   │   │   ├── banks/
│   │   │   │   ├── banks.module.ts
│   │   │   │   ├── banks.controller.ts   # CRUD /banks
│   │   │   │   ├── banks.service.ts
│   │   │   │   └── dto/ (create, update)
│   │   │   ├── investment/
│   │   │   │   ├── investment.module.ts
│   │   │   │   ├── investment.controller.ts # POST /investment/simulate, CRUD
│   │   │   │   ├── investment.service.ts    # Fórmulas financieras + Prisma
│   │   │   │   └── dto/ (simulate, create)
│   │   │   ├── goals/
│   │   │   │   ├── goals.module.ts
│   │   │   │   ├── goals.controller.ts   # CRUD /goals
│   │   │   │   ├── goals.service.ts
│   │   │   │   └── dto/ (create, update)
│   │   │   ├── ai/
│   │   │   │   ├── ai.module.ts
│   │   │   │   ├── ai.controller.ts      # POST /ai/chat
│   │   │   │   ├── ai.service.ts         # Llama a Groq API
│   │   │   │   └── context.builder.ts    # Construye contexto financiero del usuario
│   │   │   ├── notifications/
│   │   │   │   ├── notifications.module.ts
│   │   │   │   ├── notifications.controller.ts # GET + PATCH /notifications
│   │   │   │   └── notifications.service.ts
│   │   │   └── prisma/
│   │   │       └── prisma.service.ts     # Singleton PrismaClient
│   │   ├── prisma/
│   │   │   └── schema.prisma            # 8 modelos + 4 enums
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   └── web/                              # Frontend Next.js
│       ├── app/
│       │   ├── [locale]/
│       │   │   ├── layout.tsx            # Providers + Sidebar + Header
│       │   │   ├── page.tsx              # Dashboard
│       │   │   ├── income/page.tsx
│       │   │   ├── expenses/page.tsx
│       │   │   ├── reports/page.tsx
│       │   │   ├── banks/page.tsx
│       │   │   ├── investment/page.tsx
│       │   │   ├── goals/page.tsx
│       │   │   └── chat/page.tsx
│       │   └── globals.css
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx           # Navegación lateral con iconos
│       │   │   └── Header.tsx            # Barra superior con toggle idioma
│       │   ├── dashboard/
│       │   │   ├── BalanceCard.tsx       # Tarjeta de balance
│       │   │   └── RecentTransactions.tsx
│       │   ├── charts/
│       │   │   ├── ExpensesDonut.tsx     # Gráfico donut con Recharts
│       │   │   ├── IncomeVsExpenses.tsx  # Barras agrupadas
│       │   │   └── MonthlySavings.tsx    # Área chart
│       │   └── ui/
│       │       ├── Button.tsx            # Botones primary/secondary/ghost
│       │       ├── Input.tsx
│       │       ├── Modal.tsx
│       │       └── Card.tsx
│       ├── lib/
│       │   ├── api.ts                    # Cliente HTTP con JWT automático
│       │   └── auth.ts                   # login/register/logout helpers
│       ├── messages/
│       │   ├── es.json
│       │   └── en.json
│       ├── i18n/
│       │   ├── request.ts
│       │   └── routing.ts
│       ├── middleware.ts
│       ├── Dockerfile
│       ├── package.json
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       ├── next.config.ts
│       └── .env.example
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── README.md
└── PROJECT_STRUCTURE.md
```

## 2. Flujo de una request

```
Frontend (Next.js)
  │
  │  fetch('/api/investment/simulate', { headers: { Authorization: 'Bearer <jwt>' } })
  │
  ▼
Middleware (next-intl) → detecta locale → redirige /es o /en
  │
  ▼
Backend (NestJS)
  │
  ├── main.ts: ValidationPipe transforma y valida el body
  ├── JwtAuthGuard: extrae el token, llama a JwtStrategy.validate()
  │     └── busca el usuario en DB, retorna user object
  ├── Controller: recibe el request, llama al Service
  ├── Service: ejecuta lógica de negocio, llama a PrismaService
  ├── PrismaService: ejecuta query en PostgreSQL
  │     └── SELECT/INSERT/UPDATE/DELETE
  └── Response: JSON con el resultado
```

## 3. Cómo funciona la autenticación

1. **Registro/Login**: `POST /api/auth/register` o `/api/auth/login`. El service hashea la contraseña con bcrypt (10 rounds) y genera un JWT firmado con `JWT_SECRET`.

2. **JWT Payload**: `{ sub: userId, email }`, expira en `JWT_EXPIRES_IN` (default 24h).

3. **Protección de rutas**: Cada controller usa `@UseGuards(AuthGuard('jwt'))`. El guard ejecuta `JwtStrategy.validate()` que:
   - Extrae el token del header `Authorization: Bearer <token>`
   - Verifica la firma con `passport-jwt`
   - Busca el usuario en DB por `payload.sub`
   - Retorna `{ id, email, name }` o lanza 401

4. **Frontend**: El token se almacena en `localStorage` con clave `finsmart_token`. `lib/api.ts` lo agrega automáticamente a cada request. Si recibe 401, limpia el token y redirige a `/login`.

## 4. Cómo funciona el módulo AI

1. El usuario envía un mensaje desde el chat → `POST /api/ai/chat`
2. `AiService.chat()` llama a `ContextBuilder.buildUserContext(userId)` que consulta:
   - Ingresos y gastos del mes actual
   - Top 5 categorías de gasto
   - Metas activas con progreso
   - Bancos configurados
   - Últimos 5 mensajes del chat
3. Construye un system prompt con todo el contexto financiero del usuario
4. Llama a la API de Groq con `llama-3.3-70b-versatile`
5. Guarda tanto el mensaje del usuario como la respuesta en `ChatMessage`
6. Retorna ambos mensajes al frontend

## 5. Cómo agregar un módulo nuevo (ej: presupuestos)

1. Crear la carpeta `apps/api/src/budgets/` con:
   - `budgets.module.ts`
   - `budgets.controller.ts`
   - `budgets.service.ts`
   - `dto/create-budget.dto.ts` (y update si aplica)

2. En `app.module.ts`, agregar `BudgetsModule` al array `imports`

3. En `prisma/schema.prisma`, agregar el modelo `Budget` y ejecutar:
   ```bash
   npx prisma migrate dev --name add_budgets
   npx prisma generate
   ```

4. En el frontend:
   - Crear `apps/web/app/[locale]/budgets/page.tsx`
   - Agregar ruta en `Sidebar.tsx`
   - Agregar traducciones en `messages/es.json` y `messages/en.json`

## 6. Cómo correr el proyecto localmente

```bash
# Opción 1: Todo con Docker
docker compose up --build
# API → http://localhost:3001
# Web → http://localhost:3000

# Opción 2: Desarrollo sin Docker
# Terminal 1: Base de datos
docker compose up db -d

# Terminal 2: Backend
cd apps/api
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma generate
npm run start:dev

# Terminal 3: Frontend
cd apps/web
cp .env.example .env
npm install
npm run dev
```

## 7. Cómo hacer deploy

**Backend (Render o Railway):**
1. Crear servicio web desde el directorio `apps/api`
2. Configurar variables de entorno (DATABASE_URL, JWT_SECRET, GROQ_API_KEY)
3. Agregar comando de build: `npm install && npx prisma generate && npm run build`
4. Agregar comando de start: `npm run start:prod`

**Frontend (Vercel):**
1. Importar repositorio, directorio `apps/web`
2. Variables de entorno: `NEXT_PUBLIC_API_URL=https://tu-api.onrender.com/api`
3. Deploy automático en cada push a main

**Base de datos (Supabase o Neon):**
1. Crear proyecto PostgreSQL gratuito
2. Obtener DATABASE_URL
3. Ejecutar migraciones: `npx prisma migrate deploy`
