import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContextBuilder {
  constructor(private readonly prisma: PrismaService) {}

  async buildUserContext(userId: string): Promise<string> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [incomes, expenses, goals, banks, lastMessages] = await Promise.all([
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
      this.prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
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
      .slice(0, 5);

    return `
- Balance del mes: S/ ${(totalIncome - totalExpenses).toFixed(2)}
- Ingresos del mes: S/ ${totalIncome.toFixed(2)}
- Gastos del mes: S/ ${totalExpenses.toFixed(2)}
- Top categorías de gasto: ${topCategories.map(([c, a]) => `${c} (S/ ${a.toFixed(2)})`).join(', ')}
- Metas activas: ${goals.map((g) => `${g.name} (${g.currentAmount}/${g.targetAmount})`).join(', ') || 'Ninguna'}
- Bancos configurados: ${banks.map((b) => b.name).join(', ') || 'Ninguno'}
`.trim();
  }
}
