# FinSmart — Plataforma Personal de Gestión Financiera con IA

## Contexto General

FinSmart es una aplicación web personal para gestión financiera. El objetivo es que una sola persona pueda registrar sus ingresos, controlar sus gastos, simular inversiones en plazo fijo con bancos peruanos, establecer metas de ahorro y recibir recomendaciones personalizadas de una IA que conoce su contexto financiero real.

El usuario objetivo es una persona que trabaja en Perú con sueldo en soles y/o dólares, que quiere tomar control de sus finanzas personales, planificar inversiones en bancos locales y alcanzar metas económicas concretas.

---

## Decisiones de Arquitectura

- **Un solo usuario** con autenticación simple (email + contraseña). No hay registro público.
- **MVP** sin límites artificiales de uso.
- **Idioma:** Español e inglés (toggle ES/EN en el frontend con next-intl). La IA responde en el idioma activo del usuario.
- **Sin importación automática de extractos bancarios** — todo es registro manual.
- **Sin etiquetas/tags** — las categorías son suficientes para organizar.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Backend | NestJS (TypeScript) |
| ORM | Prisma |
| Base de datos | PostgreSQL (Supabase free tier) |
| Frontend | Next.js 15 + Tailwind CSS |
| i18n | next-intl (ES / EN) |
| Gráficos | Recharts |
| Validación | Zod + class-validator |
| Auth | JWT + bcrypt |
| IA | Groq API (modelo: llama-3.3-70b-versatile) |
| Exportación PDF | Puppeteer o pdfkit |
| Contenedores | Docker + docker-compose |
| Hosting Backend | Render (free tier) |
| Hosting Frontend | Vercel (free tier) |
| BD Productiva | Supabase (free tier) |

---

## Módulos del Sistema

### Módulo 1: Autenticación
- Login con email y contraseña
- JWT con expiración de 24h
- Refresh token
- Ruta de cambio de contraseña
- No hay registro público — el usuario se crea directamente en la base de datos o por un endpoint protegido con clave de admin

### Módulo 2: Ingresos
Dos tipos diferenciados:

**2a. Sueldo Fijo:**
- Monto mensual en soles o dólares
- Fecha de cobro (ej. día 15 y último de mes)
- Historial de cambios de sueldo con fecha

**2b. Ingresos Adicionales:**
- Descripción libre
- Monto
- Moneda (soles / dólares)
- Fecha
- Categoría (freelance, venta, bono, otro)
- Recurrente (sí/no) + frecuencia si es recurrente

### Módulo 3: Gastos
- Monto
- Moneda (soles / dólares)
- Fecha
- Descripción
- Categoría (creada por el usuario)
- Tipo: gasto único o recurrente (con frecuencia: diario, semanal, mensual)

**Gestión de categorías:**
- El usuario crea sus propias categorías
- Cada categoría tiene nombre, color y presupuesto mensual asignado (opcional)
- Alerta visual cuando se supera el presupuesto de una categoría

### Módulo 4: Reportes y Dashboard

**Dashboard principal:**
- Balance del mes actual (ingresos totales − gastos totales)
- Porcentaje del presupuesto usado por categoría
- Últimas 5 transacciones
- Progreso hacia la meta principal activa

**Reportes:**
- Filtro por rango de fechas (mes específico, año, rango personalizado)
- Comparativo: mes vs mes anterior, año vs año anterior
- Desglose de gastos por categoría (gráfico donut)
- Evolución de ingresos vs gastos (gráfico de líneas)
- Ahorro neto mensual acumulado (gráfico de barras)
- Exportar reporte a PDF (snapshot del período seleccionado)

### Módulo 5: Configuración de Bancos

El usuario registra los bancos con los que trabaja o quiere simular:

Campos por banco:
- Nombre del banco (ej. BCP, Interbank, BBVA, Scotiabank, Mibanco, Caja Sullana)
- Moneda: soles (PEN) y/o dólares (USD)
- TREA en soles (%) — Tasa de Rendimiento Efectivo Anual
- Tasa en dólares (APY %) — equivalente a TREA pero para cuentas en dólares. APY = Annual Percentage Yield, es la tasa anual que incluye el efecto del interés compuesto.
- Plazos disponibles (checkboxes): 30, 60, 90, 180, 270, 360 días
- Monto mínimo de inversión
- Activo/inactivo

**Nota sobre scraping:**
Intentar scraping de tasas desde páginas de la SBS (https://www.sbs.gob.pe) o de cada banco. Si el scraping no es viable por bloqueos, el sistema funciona 100% con ingreso manual. Incluir un botón "Actualizar tasas automáticamente" que intente el scraping y, si falla, notifique al usuario para actualizar manual.

Bancos peruanos sugeridos para precargar:
- BCP, Interbank, BBVA, Scotiabank, BanBif, Pichincha, Mibanco, Caja Sullana, Caja Piura, Caja Arequipa, Compartamos, Financiera Oh!

### Módulo 6: Simulador de Inversiones (Plazo Fijo)

**Calculadora individual:**
- Inputs: banco, moneda, monto a invertir, plazo en días
- Output: ganancia bruta, monto final, tasa efectiva aplicada
- Fórmula plazo fijo:
  ```
  Ganancia = Capital × (TREA/100) × (días/360)
  Monto final = Capital + Ganancia
  ```

**Comparador de bancos:**
- Input: monto y plazo
- Output: tabla ordenada de mejor a peor rendimiento con todos los bancos activos que ofrezcan ese plazo
- Destacar el mejor banco visualmente

**Simulador de meta con inversión:**
- Input: monto objetivo, capital inicial disponible, aporte mensual, plazo total en meses
- Output: proyección mes a mes con el mejor banco disponible
- Fórmula con aportes periódicos:
  ```
  Monto futuro = P(1+r)^n + A × [((1+r)^n - 1) / r]
  donde:
    P = capital inicial
    r = tasa mensual (TREA / 12 / 100)
    n = número de meses
    A = aporte mensual
  ```
- Si el objetivo es alcanzable: mostrar en cuántos meses
- Si no: sugerir cuánto aporte mensual se necesitaría

### Módulo 7: Metas Financieras

- Nombre de la meta (ej. "Laptop nueva", "Fondo de emergencia")
- Monto objetivo
- Moneda
- Fecha límite (opcional)
- Monto actual ahorrado (actualizable manualmente)
- El sistema calcula: cuánto falta, cuánto ahorrar por mes para llegar a tiempo
- Vincular meta a un banco del simulador (el sistema sugiere cuál usar según la meta)
- Estado: activa, completada, cancelada
- Vista de progreso con barra y porcentaje

### Módulo 8: Asistente IA con Contexto

**Funcionamiento técnico:**
Cuando el usuario hace una pregunta al chat, el backend construye un contexto dinámico con sus datos reales:
- Sueldo actual
- Balance del mes corriente
- Top 3 categorías de gasto del mes
- Metas activas y progreso
- Inversiones activas
- Bancos configurados con sus tasas

Este contexto se inyecta como system prompt al modelo de Groq antes de la pregunta del usuario.

**Capacidades del asistente:**
- Responder preguntas sobre las finanzas del usuario ("¿puedo gastar X este mes?")
- Analizar gastos ("¿en qué gasto más?", "¿qué puedo recortar?")
- Recomendar el mejor banco para un monto y plazo específico
- Calcular si una meta es alcanzable con el ahorro actual
- Dar recomendaciones automáticas proactivas (el sistema genera una recomendación semanal basada en patrones)
- Enviar notificaciones internas cuando:
  - Se supera el presupuesto de una categoría
  - Una meta está en riesgo de no cumplirse a tiempo
  - El balance del mes es negativo

**Importante:** El asistente responde en el idioma activo del usuario (español o inglés). El idioma se envía en cada request al backend (`Accept-Language` header o campo `lang` en el body). No da consejos sobre inversiones de alto riesgo (criptomonedas, acciones). Se limita al contexto de plazo fijo, ahorro y gestión de gastos.

---

## Modelo de Datos (Prisma Schema)

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  name          String
  createdAt     DateTime @default(now())

  incomes       Income[]
  expenses      Expense[]
  categories    Category[]
  goals         Goal[]
  banks         Bank[]
  investments   Investment[]
  chatHistory   ChatMessage[]
  notifications Notification[]
}

model Income {
  id          String      @id @default(uuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  type        IncomeType  // SALARY | ADDITIONAL
  amount      Float
  currency    Currency    // PEN | USD
  description String?
  category    String?     // solo para ADDITIONAL
  date        DateTime
  recurring   Boolean     @default(false)
  frequency   String?     // daily | weekly | monthly
  createdAt   DateTime    @default(now())
}

model Expense {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  amount      Float
  currency    Currency
  description String
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  date        DateTime
  recurring   Boolean  @default(false)
  frequency   String?
  createdAt   DateTime @default(now())
}

model Category {
  id       String    @id @default(uuid())
  userId   String
  user     User      @relation(fields: [userId], references: [id])
  name     String
  color    String
  budget   Float?
  currency Currency?
  expenses Expense[]
}

model Goal {
  id            String     @id @default(uuid())
  userId        String
  user          User       @relation(fields: [userId], references: [id])
  name          String
  targetAmount  Float
  currentAmount Float      @default(0)
  currency      Currency
  deadline      DateTime?
  bankId        String?
  bank          Bank?      @relation(fields: [bankId], references: [id])
  status        GoalStatus @default(ACTIVE)
  createdAt     DateTime   @default(now())
}

model Bank {
  id           String       @id @default(uuid())
  userId       String
  user         User         @relation(fields: [userId], references: [id])
  name         String
  treaPEN      Float?
  apyUSD       Float?
  terms        Int[]        // ej. [30, 90, 180, 360]
  minAmountPEN Float?
  minAmountUSD Float?
  active       Boolean      @default(true)
  investments  Investment[]
  goals        Goal[]
  updatedAt    DateTime     @updatedAt
}

model Investment {
  id             String   @id @default(uuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  bankId         String
  bank           Bank     @relation(fields: [bankId], references: [id])
  amount         Float
  currency       Currency
  termDays       Int
  treaApplied    Float
  projectedGain  Float
  finalAmount    Float
  startDate      DateTime
  endDate        DateTime
  createdAt      DateTime @default(now())
}

model ChatMessage {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  role      String   // user | assistant
  content   String
  createdAt DateTime @default(now())
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // budget_exceeded | goal_at_risk | negative_balance
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}

enum IncomeType { SALARY ADDITIONAL }
enum Currency   { PEN USD }
enum GoalStatus { ACTIVE COMPLETED CANCELLED }
```

---

## Endpoints API (NestJS)

```
POST   /auth/login
POST   /auth/refresh
POST   /auth/change-password

GET    /income
POST   /income
PUT    /income/:id
DELETE /income/:id

GET    /expenses
POST   /expenses
PUT    /expenses/:id
DELETE /expenses/:id

GET    /categories
POST   /categories
PUT    /categories/:id
DELETE /categories/:id

GET    /reports/dashboard
GET    /reports/monthly?month=&year=
GET    /reports/annual?year=
GET    /reports/comparison?from=&to=
GET    /reports/export-pdf?from=&to=

GET    /banks
POST   /banks
PUT    /banks/:id
DELETE /banks/:id
POST   /banks/scrape-rates     (intenta actualizar tasas automáticamente)

POST   /investment/simulate    (calcula sin guardar)
POST   /investment/compare     (compara todos los bancos)
POST   /investment/goal-projection
GET    /investment
POST   /investment
DELETE /investment/:id

GET    /goals
POST   /goals
PUT    /goals/:id
DELETE /goals/:id

GET    /ai/chat
POST   /ai/chat
GET    /ai/weekly-recommendation

GET    /notifications
PATCH  /notifications/:id/read
```

---

## Estructura de Carpetas

```
finsmart/
├── apps/
│   ├── api/                    (NestJS)
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── income/
│   │   │   ├── expenses/
│   │   │   ├── categories/
│   │   │   ├── reports/
│   │   │   ├── banks/
│   │   │   ├── investment/
│   │   │   ├── goals/
│   │   │   ├── ai/
│   │   │   ├── notifications/
│   │   │   └── prisma/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/                    (Next.js)
│       ├── app/
│       │   ├── (auth)/
│       │   ├── dashboard/
│       │   ├── income/
│       │   ├── expenses/
│       │   ├── reports/
│       │   ├── banks/
│       │   ├── investment/
│       │   ├── goals/
│       │   └── chat/
│       ├── components/
│       ├── Dockerfile
│       └── package.json
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

---

## Variables de Entorno (.env.example)

```env
# Base de datos
DATABASE_URL=postgresql://user:password@host:5432/finsmart

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Groq IA
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# App
PORT=3001
FRONTEND_URL=http://localhost:3000
```

---

## Fases de Desarrollo

### Fase 1: Setup + Auth (Semana 1)
- Inicializar monorepo NestJS + Next.js
- Configurar Prisma + PostgreSQL (Supabase)
- Módulo Auth completo (login, JWT, refresh)
- Docker + docker-compose funcional
- Deploy inicial en Render

### Fase 2: Ingresos + Gastos + Categorías (Semana 1-2)
- CRUD completo de ingresos (sueldo + adicionales)
- CRUD completo de gastos
- CRUD de categorías con presupuesto
- Frontend: formularios y listados

### Fase 3: Dashboard + Reportes (Semana 2-3)
- Lógica de reportes (mensual, anual, comparativo)
- Gráficos con Recharts (donut, líneas, barras)
- Exportación PDF
- Deploy frontend en Vercel

### Fase 4: Bancos + Simulador (Semana 3-4)
- CRUD de bancos con tasas
- Lógica de cálculo de plazo fijo
- Comparador de bancos
- Simulador de metas con proyección
- Frontend: formularios y tabla comparativa
- Intento de scraping de tasas SBS

### Fase 5: Metas Financieras (Semana 4)
- CRUD de metas
- Cálculo automático de ahorro necesario
- Vinculación con bancos
- Frontend: progress bars y proyecciones

### Fase 6: Asistente IA (Semana 5)
- Integración Groq API
- Función de construcción de contexto del usuario
- Chat funcional
- Sistema de notificaciones
- Recomendación semanal automática

### Fase 7: Polish + Deploy Final (Semana 6)
- docker-compose con todos los servicios
- README con instrucciones
- Última pasada de UI/UX
- Variables de entorno en Render y Vercel
- Screenshots para el portafolio

---

## Criterios de Éxito

- El usuario puede registrar ingresos y gastos y ver su balance en tiempo real
- El simulador calcula correctamente el rendimiento de plazo fijo con la fórmula real
- El asistente IA responde preguntas usando datos reales del usuario
- La app corre correctamente con docker-compose localmente
- La app está desplegada y accesible en producción (Render + Vercel)
- El código está en GitHub con README claro y screenshots
