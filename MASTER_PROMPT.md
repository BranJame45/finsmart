# Master Prompt — FinSmart (Plataforma Financiera Personal con IA)

> Copia y pega este prompt completo en una IA (Claude, Cursor, ChatGPT) para que genere el scaffold del proyecto.
> Este prompt es solo para crear la ESTRUCTURA y archivos base. No implementa la lógica completa — eso se hace fase por fase.

---

## PROMPT

Eres un arquitecto de software backend. Tu tarea es crear el scaffold completo de una aplicación fullstack llamada FinSmart.

Lee atentamente todo lo que sigue antes de escribir cualquier archivo.

---

### CONTEXTO DEL PROYECTO

FinSmart es una plataforma web personal de gestión financiera con IA. Permite a un solo usuario registrar ingresos, controlar gastos, simular inversiones en plazo fijo con bancos peruanos y recibir recomendaciones de una IA que conoce su contexto financiero real.

**Stack:**
- Backend: NestJS (TypeScript) + Prisma + PostgreSQL
- Frontend: Next.js 15 + Tailwind CSS + next-intl (ES/EN) + Recharts
- IA: Groq API
- Contenedores: Docker + docker-compose
- Auth: JWT + bcrypt

---

### ESTRUCTURA DE ARCHIVOS QUE DEBES CREAR

```
finsmart/
├── apps/
│   ├── api/                          (NestJS)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── dto/
│   │   │   │       └── login.dto.ts
│   │   │   ├── income/
│   │   │   │   ├── income.module.ts
│   │   │   │   ├── income.controller.ts
│   │   │   │   ├── income.service.ts
│   │   │   │   └── dto/
│   │   │   ├── expenses/
│   │   │   │   ├── expenses.module.ts
│   │   │   │   ├── expenses.controller.ts
│   │   │   │   ├── expenses.service.ts
│   │   │   │   └── dto/
│   │   │   ├── categories/
│   │   │   │   ├── categories.module.ts
│   │   │   │   ├── categories.controller.ts
│   │   │   │   ├── categories.service.ts
│   │   │   │   └── dto/
│   │   │   ├── reports/
│   │   │   │   ├── reports.module.ts
│   │   │   │   ├── reports.controller.ts
│   │   │   │   └── reports.service.ts
│   │   │   ├── banks/
│   │   │   │   ├── banks.module.ts
│   │   │   │   ├── banks.controller.ts
│   │   │   │   ├── banks.service.ts
│   │   │   │   └── dto/
│   │   │   ├── investment/
│   │   │   │   ├── investment.module.ts
│   │   │   │   ├── investment.controller.ts
│   │   │   │   ├── investment.service.ts
│   │   │   │   └── dto/
│   │   │   ├── goals/
│   │   │   │   ├── goals.module.ts
│   │   │   │   ├── goals.controller.ts
│   │   │   │   ├── goals.service.ts
│   │   │   │   └── dto/
│   │   │   ├── ai/
│   │   │   │   ├── ai.module.ts
│   │   │   │   ├── ai.controller.ts
│   │   │   │   ├── ai.service.ts
│   │   │   │   └── context.builder.ts
│   │   │   ├── notifications/
│   │   │   │   ├── notifications.module.ts
│   │   │   │   ├── notifications.controller.ts
│   │   │   │   └── notifications.service.ts
│   │   │   └── prisma/
│   │   │       └── prisma.service.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   └── web/                          (Next.js)
│       ├── app/
│       │   ├── [locale]/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx           (dashboard)
│       │   │   ├── income/
│       │   │   │   └── page.tsx
│       │   │   ├── expenses/
│       │   │   │   └── page.tsx
│       │   │   ├── reports/
│       │   │   │   └── page.tsx
│       │   │   ├── banks/
│       │   │   │   └── page.tsx
│       │   │   ├── investment/
│       │   │   │   └── page.tsx
│       │   │   ├── goals/
│       │   │   │   └── page.tsx
│       │   │   └── chat/
│       │   │       └── page.tsx
│       │   └── globals.css
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   └── Header.tsx
│       │   ├── dashboard/
│       │   │   ├── BalanceCard.tsx
│       │   │   └── RecentTransactions.tsx
│       │   ├── charts/
│       │   │   ├── ExpensesDonut.tsx
│       │   │   ├── IncomeVsExpenses.tsx
│       │   │   └── MonthlySavings.tsx
│       │   └── ui/
│       │       ├── Button.tsx
│       │       ├── Input.tsx
│       │       ├── Modal.tsx
│       │       └── Card.tsx
│       ├── lib/
│       │   ├── api.ts                 (cliente HTTP hacia el backend)
│       │   └── auth.ts
│       ├── messages/
│       │   ├── es.json
│       │   └── en.json
│       ├── i18n/
│       │   ├── request.ts
│       │   └── routing.ts
│       ├── Dockerfile
│       ├── package.json
│       └── .env.example
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

---

### INSTRUCCIONES DE IMPLEMENTACIÓN

**1. prisma/schema.prisma**
Crear el schema completo con los siguientes modelos:
- `User` (id, email, password, name, createdAt)
- `Income` (id, userId, type: SALARY|ADDITIONAL, amount, currency: PEN|USD, description, category, date, recurring, frequency, createdAt)
- `Expense` (id, userId, amount, currency, description, categoryId, date, recurring, frequency, createdAt)
- `Category` (id, userId, name, color, budget, currency)
- `Goal` (id, userId, name, targetAmount, currentAmount, currency, deadline, bankId, status: ACTIVE|COMPLETED|CANCELLED, createdAt)
- `Bank` (id, userId, name, treaPEN, apyUSD, terms: Int[], minAmountPEN, minAmountUSD, active, updatedAt)
- `Investment` (id, userId, bankId, amount, currency, termDays, treaApplied, projectedGain, finalAmount, startDate, endDate, createdAt)
- `ChatMessage` (id, userId, role, content, createdAt)
- `Notification` (id, userId, type, message, read, createdAt)
Con todos sus relaciones y enums correspondientes.

**2. main.ts (NestJS)**
- Habilitar CORS para el frontend
- Prefijo global `/api`
- Validation pipe global
- Puerto desde variable de entorno

**3. Cada módulo NestJS debe tener:**
- `@Controller` con prefijo de ruta
- `@UseGuards(JwtAuthGuard)` en todos los endpoints excepto auth
- DTOs con validaciones básicas usando class-validator
- Inyección de `PrismaService`
- Métodos del servicio vacíos pero con la firma correcta (para implementar después)

**4. context.builder.ts (módulo AI)**
Función que recibe el userId y construye el contexto para el LLM:
```typescript
async buildUserContext(userId: string): Promise<string> {
  // Obtiene: sueldo actual, balance del mes, top categorías de gasto,
  // metas activas, bancos configurados
  // Retorna string formateado para inyectar al system prompt
}
```

**5. docker-compose.yml**
```yaml
services:
  api:
    build: ./apps/api
    ports: ["3001:3001"]
    env_file: ./apps/api/.env
    depends_on: [db]
  web:
    build: ./apps/web
    ports: ["3000:3000"]
    env_file: ./apps/web/.env
    depends_on: [api]
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: finsmart
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
volumes:
  postgres_data:
```

**6. messages/es.json y messages/en.json**
Incluir claves de traducción para todas las páginas:
nav, dashboard, income, expenses, categories, reports, banks, investment, goals, chat, notifications, common (botones, errores, confirmaciones)

**7. lib/api.ts**
Cliente HTTP base (fetch o axios) que:
- Lee la URL del backend desde variable de entorno
- Agrega el JWT al header Authorization automáticamente
- Maneja errores 401 redirigiendo al login

---

### FÓRMULAS FINANCIERAS — implementar en investment.service.ts

```typescript
// Plazo fijo simple
calcularPlazoFijo(capital: number, trea: number, dias: number) {
  const ganancia = capital * (trea / 100) * (dias / 360)
  return { ganancia, montoFinal: capital + ganancia }
}

// Proyección con aportes periódicos
calcularProyeccion(capital: number, tasaMensual: number, meses: number, aporteMensual: number) {
  const r = tasaMensual / 100
  const montoFuturo = capital * Math.pow(1 + r, meses) +
    aporteMensual * ((Math.pow(1 + r, meses) - 1) / r)
  return montoFuturo
}
```

---

### VARIABLES DE ENTORNO

**apps/api/.env.example:**
```env
DATABASE_URL=postgresql://user:password@db:5432/finsmart
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=24h
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**apps/web/.env.example:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXTAUTH_SECRET=change_this_secret
```

---

### AL FINALIZAR — genera PROJECT_STRUCTURE.md

Una vez creados todos los archivos, genera un archivo `PROJECT_STRUCTURE.md` en la raíz con:

1. **Mapa de archivos** — árbol completo con descripción de cada archivo/carpeta
2. **Flujo de una request** — desde que el frontend llama a la API hasta que Prisma consulta la BD y devuelve la respuesta
3. **Cómo funciona la autenticación** — JWT, guards, flujo completo
4. **Cómo funciona el módulo AI** — cómo se construye el contexto y se llama a Groq
5. **Cómo agregar un módulo nuevo** — pasos exactos (module, controller, service, dto, registro en app.module)
6. **Cómo correr el proyecto localmente** — comandos paso a paso con Docker
7. **Cómo hacer deploy** — Render (backend) + Vercel (frontend) + Supabase (BD)

Este archivo es la guía de mantenimiento. Debe ser entendible por alguien que abre el repo por primera vez.
