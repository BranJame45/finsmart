import { PrismaClient } from '@prisma/client';

/**
 * Seed de datos DEMO para el entorno desplegado (Neon).
 * Puebla la cuenta brandon@finsmart.app con categorías, ingresos, gastos,
 * metas e inversión para que el dashboard se vea completo ante reclutadores.
 * Idempotente: limpia los datos transaccionales del usuario antes de crear.
 */
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'brandon@finsmart.app' } });
  if (!user) throw new Error('Usuario brandon@finsmart.app no existe. Corre el seed base primero.');
  const uid = user.id;

  // Limpieza idempotente (respeta bancos ya sembrados).
  await prisma.investment.deleteMany({ where: { userId: uid } });
  await prisma.goal.deleteMany({ where: { userId: uid } });
  await prisma.expense.deleteMany({ where: { userId: uid } });
  await prisma.income.deleteMany({ where: { userId: uid } });
  await prisma.salaryHistory.deleteMany({ where: { userId: uid } });
  await prisma.category.deleteMany({ where: { userId: uid } });

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const day = (d: number) => new Date(y, m, d);

  // Categorías con presupuesto
  const food = await prisma.category.create({ data: { userId: uid, name: 'Alimentación', color: '#10b981', budget: 800, currency: 'PEN' } });
  const housing = await prisma.category.create({ data: { userId: uid, name: 'Vivienda', color: '#3b82f6', budget: 1500, currency: 'PEN' } });
  const transport = await prisma.category.create({ data: { userId: uid, name: 'Transporte', color: '#f59e0b', budget: 400, currency: 'PEN' } });
  const fun = await prisma.category.create({ data: { userId: uid, name: 'Entretenimiento', color: '#8b5cf6', budget: 300, currency: 'PEN' } });
  const health = await prisma.category.create({ data: { userId: uid, name: 'Salud', color: '#ec4899', budget: 250, currency: 'PEN' } });

  // Ingresos
  await prisma.income.create({ data: { userId: uid, type: 'SALARY', amount: 4500, description: 'Sueldo mensual', date: day(1), recurring: true } });
  await prisma.income.create({ data: { userId: uid, type: 'ADDITIONAL', amount: 900, description: 'Proyecto freelance', date: day(14), recurring: false } });
  await prisma.salaryHistory.create({ data: { userId: uid, amount: 4500, startDate: new Date(y, 0, 1) } });

  // Gastos del mes
  const expenses: [number, string, string, number][] = [
    [1500, 'Alquiler', housing.id, 2],
    [180, 'Supermercado', food.id, 3],
    [45, 'Almuerzo trabajo', food.id, 5],
    [120, 'Gasolina', transport.id, 6],
    [60, 'Uber', transport.id, 9],
    [200, 'Cena aniversario', fun.id, 12],
    [90, 'Cine y streaming', fun.id, 15],
    [150, 'Farmacia', health.id, 16],
    [220, 'Compras del mes', food.id, 18],
    [80, 'Internet', housing.id, 20],
  ];
  for (const [amount, description, categoryId, d] of expenses) {
    await prisma.expense.create({ data: { userId: uid, amount, description, categoryId, date: day(d), currency: 'PEN' } });
  }

  // Metas (una vinculada a un banco para la proyección)
  const bank = await prisma.bank.findFirst({ where: { userId: uid, active: true } });
  await prisma.goal.create({ data: { userId: uid, name: 'Fondo de emergencia', targetAmount: 10000, currentAmount: 3500, deadline: new Date(y + 1, m, 1), bankId: bank?.id } });
  await prisma.goal.create({ data: { userId: uid, name: 'Laptop nueva', targetAmount: 5000, currentAmount: 1200, deadline: new Date(y, m + 6, 1) } });

  // Inversión (plazo fijo) usando un banco real
  if (bank) {
    const trea = bank.treaPEN ?? 5;
    const amount = 5000;
    const termDays = 360;
    const gain = amount * (trea / 100) * (termDays / 360);
    const startDate = day(1);
    const endDate = new Date(startDate.getTime() + termDays * 24 * 60 * 60 * 1000);
    await prisma.investment.create({
      data: {
        userId: uid, bankId: bank.id, amount, termDays, currency: 'PEN',
        treaApplied: trea, projectedGain: gain, finalAmount: amount + gain,
        startDate, endDate,
      },
    });
  }

  const [nExp, nInc, nGoal] = await Promise.all([
    prisma.expense.count({ where: { userId: uid } }),
    prisma.income.count({ where: { userId: uid } }),
    prisma.goal.count({ where: { userId: uid } }),
  ]);
  console.log(`✅ Demo cargado: ${nExp} gastos, ${nInc} ingresos, ${nGoal} metas, 5 categorías, 1 inversión.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
