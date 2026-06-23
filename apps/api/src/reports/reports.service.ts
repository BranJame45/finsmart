import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [incomes, expenses, categories, goals, recentTransactions] = await Promise.all([
      this.prisma.income.findMany({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
      }),
      this.prisma.expense.findMany({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
        include: { category: true },
      }),
      this.prisma.category.findMany({ where: { userId } }),
      this.prisma.goal.findMany({
        where: { userId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      }),
      this.prisma.expense.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { date: 'desc' },
        take: 5,
      }),
    ]);

    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    const budgetUsage = categories.map((cat) => {
      const spent = expenses
        .filter((e) => e.categoryId === cat.id)
        .reduce((s, e) => s + e.amount, 0);
      return {
        category: cat.name,
        color: cat.color,
        budget: cat.budget || 0,
        spent,
        percentage: cat.budget ? Math.min((spent / cat.budget) * 100, 100) : 0,
      };
    });

    const activeGoal = goals[0] || null;

    return {
      balance: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
      budgetUsage,
      activeGoal: activeGoal
        ? {
            id: activeGoal.id,
            name: activeGoal.name,
            targetAmount: activeGoal.targetAmount,
            currentAmount: activeGoal.currentAmount,
            percentage: Math.min((activeGoal.currentAmount / activeGoal.targetAmount) * 100, 100),
          }
        : null,
      recentTransactions,
    };
  }

  async getMonthlySummary(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const incomes = await this.prisma.income.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
    });

    const expenses = await this.prisma.expense.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
    });

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return { year, month, totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
  }

  async getAnnualSummary(userId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const incomes = await this.prisma.income.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
    });
    const expenses = await this.prisma.expense.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
    });

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const monthlyData = [];
    for (let m = 1; m <= 12; m++) {
      const monthStart = new Date(year, m - 1, 1);
      const monthEnd = new Date(year, m, 0);
      monthlyData.push({
        month: m,
        income: incomes
          .filter((i) => i.date >= monthStart && i.date <= monthEnd)
          .reduce((s, i) => s + i.amount, 0),
        expenses: expenses
          .filter((e) => e.date >= monthStart && e.date <= monthEnd)
          .reduce((s, e) => s + e.amount, 0),
      });
    }

    return { year, totalIncome, totalExpenses, monthlyData };
  }

  async getComparison(userId: string, from: string, to: string) {
    const startDate = new Date(from);
    const endDate = new Date(to);

    const incomes = await this.prisma.income.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
    });

    const expenses = await this.prisma.expense.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      include: { category: true },
    });

    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    const categoryBreakdown: Record<string, number> = {};
    for (const expense of expenses) {
      const name = expense.category.name;
      categoryBreakdown[name] = (categoryBreakdown[name] || 0) + expense.amount;
    }

    const monthlyBreakdown: Record<string, { income: number; expenses: number }> = {};
    for (const inc of incomes) {
      const key = `${inc.date.getFullYear()}-${String(inc.date.getMonth() + 1).padStart(2, '0')}`;
      monthlyBreakdown[key] = monthlyBreakdown[key] || { income: 0, expenses: 0 };
      monthlyBreakdown[key].income += inc.amount;
    }
    for (const exp of expenses) {
      const key = `${exp.date.getFullYear()}-${String(exp.date.getMonth() + 1).padStart(2, '0')}`;
      monthlyBreakdown[key] = monthlyBreakdown[key] || { income: 0, expenses: 0 };
      monthlyBreakdown[key].expenses += exp.amount;
    }

    return {
      from,
      to,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, total]) => ({
        category,
        total,
      })),
      monthlyBreakdown: Object.entries(monthlyBreakdown).map(([month, data]) => ({
        month,
        ...data,
      })),
    };
  }

  async getCategoryBreakdown(userId: string, startDate: string, endDate: string) {
    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      include: { category: true },
    });

    const grouped: Record<string, number> = {};
    for (const expense of expenses) {
      const name = expense.category.name;
      grouped[name] = (grouped[name] || 0) + expense.amount;
    }

    return Object.entries(grouped).map(([category, total]) => ({ category, total }));
  }

  async exportPdf(userId: string, from: string, to: string): Promise<Buffer> {
    const data = await this.getComparison(userId, from, to);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      doc.fontSize(20).text('FinSmart - Report', { align: 'center' });
      doc.fontSize(12).text(`Period: ${from} to ${to}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text('Summary');
      doc.fontSize(12).text(`Total Income: S/ ${data.totalIncome.toFixed(2)}`);
      doc.text(`Total Expenses: S/ ${data.totalExpenses.toFixed(2)}`);
      doc.text(`Balance: S/ ${data.balance.toFixed(2)}`);
      doc.moveDown();

      doc.fontSize(14).text('Category Breakdown');
      for (const cat of data.categoryBreakdown) {
        doc.fontSize(12).text(`${cat.category}: S/ ${cat.total.toFixed(2)}`);
      }

      doc.end();
    });
  }
}
