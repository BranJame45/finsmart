import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function thisMonth(day: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0);
}
function addMonths(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d;
}

async function main() {
  const email = 'brandon@finsmart.app';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Usuario existe — borrando datos para re-sembrar...');
    await prisma.notification.deleteMany({ where: { userId: existing.id } });
    await prisma.chatMessage.deleteMany({ where: { userId: existing.id } });
    await prisma.investment.deleteMany({ where: { userId: existing.id } });
    await prisma.goal.deleteMany({ where: { userId: existing.id } });
    await prisma.expense.deleteMany({ where: { userId: existing.id } });
    await prisma.income.deleteMany({ where: { userId: existing.id } });
    await prisma.salaryHistory.deleteMany({ where: { userId: existing.id } });
    await prisma.category.deleteMany({ where: { userId: existing.id } });
    await prisma.bank.deleteMany({ where: { userId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const password = await bcrypt.hash('FinSmart2026!', 10);
  const user = await prisma.user.create({
    data: { email, password, name: 'Brandon' },
  });

  // ── Bancos peruanos con tasas (TREA PEN / APY USD) ────────────────────
  const bankData = [
    { name: 'BCP', treaPEN: 3.5, apyUSD: 1.2, minAmountPEN: 500, minAmountUSD: 200 },
    { name: 'Interbank', treaPEN: 3.8, apyUSD: 1.5, minAmountPEN: 500, minAmountUSD: 200 },
    { name: 'BBVA', treaPEN: 3.2, apyUSD: 1.0, minAmountPEN: 500, minAmountUSD: 200 },
    { name: 'Scotiabank', treaPEN: 3.6, apyUSD: 1.3, minAmountPEN: 500, minAmountUSD: 200 },
    { name: 'Mibanco', treaPEN: 5.5, apyUSD: 2.0, minAmountPEN: 1000, minAmountUSD: 300 },
    { name: 'Caja Arequipa', treaPEN: 6.5, apyUSD: 2.5, minAmountPEN: 1000, minAmountUSD: 500 },
    { name: 'Caja Piura', treaPEN: 6.8, apyUSD: 2.8, minAmountPEN: 1000, minAmountUSD: 500 },
    { name: 'Caja Sullana', treaPEN: 7.0, apyUSD: 3.0, minAmountPEN: 1000, minAmountUSD: 500 },
  ];
  const banks: Record<string, string> = {};
  for (const b of bankData) {
    const bank = await prisma.bank.create({
      data: { userId: user.id, ...b, terms: [30, 90, 180, 360], active: true },
    });
    banks[b.name] = bank.id;
  }

  console.log('\n✅ Seed completo (Entorno Limpio).');
  console.log('   Email:      brandon@finsmart.app');
  console.log('   Contraseña: FinSmart2026!');
  console.log('   Datos: 8 bancos inicializados. Sin transacciones ni datos de prueba.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
