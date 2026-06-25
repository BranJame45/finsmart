import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContextBuilder {
  constructor(private readonly prisma: PrismaService) {}

  async buildUserContext(userId: string): Promise<string> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [salary, incomes, expenses, goals, banks, investments] =
      await Promise.all([
        // Sueldo vigente: último ingreso tipo SALARY
        this.prisma.income.findFirst({
          where: { userId, type: 'SALARY' },
          orderBy: { date: 'desc' },
        }),
        this.prisma.income.findMany({
          where: {
            userId,
            date: { gte: currentMonthStart, lte: currentMonthEnd },
          },
        }),
        this.prisma.expense.findMany({
          where: {
            userId,
            date: { gte: currentMonthStart, lte: currentMonthEnd },
          },
          include: { category: true },
        }),
        this.prisma.goal.findMany({ where: { userId, status: 'ACTIVE' } }),
        this.prisma.bank.findMany({ where: { userId, active: true } }),
        this.prisma.investment.findMany({
          where: { userId },
          include: { bank: true },
        }),
      ]);

    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const topCategories = Object.entries(
      expenses.reduce(
        (acc, e) => {
          const name = e.category.name;
          acc[name] = (acc[name] || 0) + e.amount;
          return acc;
        },
        {} as Record<string, number>,
      ),
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return `
- Sueldo vigente: ${salary ? `${salary.currency === 'USD' ? '$' : 'S/'} ${salary.amount.toFixed(2)}/mes` : 'No registrado'}
- Balance del mes: S/ ${(totalIncome - totalExpenses).toFixed(2)}
- Ingresos del mes: S/ ${totalIncome.toFixed(2)}
- Gastos del mes: S/ ${totalExpenses.toFixed(2)}
- Top 3 categorías de gasto: ${topCategories.map(([c, a]) => `${c} (S/ ${a.toFixed(2)})`).join(', ') || 'Sin gastos'}
- Metas activas: ${goals.map((g) => `${g.name} (${g.currentAmount}/${g.targetAmount} ${g.currency})`).join(', ') || 'Ninguna'}
- Inversiones activas: ${investments.map((i) => `${i.bank.name} ${i.currency === 'USD' ? '$' : 'S/'}${i.amount.toFixed(0)} a ${i.termDays}d (gana ${i.currency === 'USD' ? '$' : 'S/'}${i.projectedGain.toFixed(2)})`).join(', ') || 'Ninguna'}
- Bancos configurados: ${banks.map((b) => `${b.name} (TREA ${b.treaPEN ?? '-'}% / APY ${b.apyUSD ?? '-'}%)`).join(', ') || 'Ninguno'}
`.trim();
  }
}
