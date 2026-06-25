import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    // Recalcula notificaciones al abrir la campana (sin duplicar).
    await this.evaluate(userId);
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  /** Crea una notificación solo si no existe ya una idéntica sin leer. */
  private async createIfNew(userId: string, type: string, message: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { userId, type, message, read: false },
    });
    if (existing) return;
    await this.prisma.notification.create({ data: { userId, type, message } });
  }

  /**
   * Evalúa las 3 condiciones del requerimiento y genera notificaciones:
   * presupuesto de categoría superado, balance del mes negativo, meta en riesgo.
   */
  async evaluate(userId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [categories, expenses, incomes, goals] = await Promise.all([
      this.prisma.category.findMany({ where: { userId, budget: { not: null } } }),
      this.prisma.expense.findMany({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
      }),
      this.prisma.income.findMany({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
      }),
      this.prisma.goal.findMany({ where: { userId, status: 'ACTIVE' } }),
    ]);

    // 1) Presupuesto de categoría superado
    for (const cat of categories) {
      const spent = expenses
        .filter((e) => e.categoryId === cat.id)
        .reduce((s, e) => s + e.amount, 0);
      if (cat.budget && spent > cat.budget) {
        const pct = Math.round((spent / cat.budget) * 100);
        await this.createIfNew(
          userId,
          'budget_exceeded',
          `Superaste el presupuesto de "${cat.name}": ${pct}% (S/ ${spent.toFixed(0)} de S/ ${cat.budget.toFixed(0)}).`,
        );
      }
    }

    // 2) Balance del mes negativo
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    if (totalExpenses > totalIncome) {
      await this.createIfNew(
        userId,
        'negative_balance',
        `Tu balance de este mes es negativo: gastaste S/ ${(totalExpenses - totalIncome).toFixed(0)} más de lo que ingresaste.`,
      );
    }

    // 3) Meta en riesgo (deadline cerca y ahorro insuficiente)
    for (const goal of goals) {
      if (!goal.deadline) continue;
      const remaining = goal.targetAmount - goal.currentAmount;
      if (remaining <= 0) continue;
      const monthsLeft =
        (new Date(goal.deadline).getFullYear() - now.getFullYear()) * 12 +
        (new Date(goal.deadline).getMonth() - now.getMonth());
      // En riesgo si ya venció o si el ahorro mensual requerido es alto vs lo avanzado.
      const atRisk = monthsLeft <= 0 || remaining / Math.max(monthsLeft, 1) > goal.targetAmount * 0.5;
      if (atRisk) {
        await this.createIfNew(
          userId,
          'goal_at_risk',
          `Tu meta "${goal.name}" está en riesgo: te faltan ${goal.currency === 'USD' ? '$' : 'S/'} ${remaining.toFixed(0)}${monthsLeft > 0 ? ` y quedan ${monthsLeft} mes(es)` : ' y ya venció el plazo'}.`,
        );
      }
    }
  }
}
