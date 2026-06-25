import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

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
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const incomes = await this.prisma.income.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
    });

    const expenses = await this.prisma.expense.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
    });

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const dailyData = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStart = new Date(Date.UTC(year, month - 1, d));
      const dayEnd = new Date(Date.UTC(year, month - 1, d, 23, 59, 59, 999));

      dailyData.push({
        day: d,
        income: incomes
          .filter((i) => i.date >= dayStart && i.date <= dayEnd)
          .reduce((s, i) => s + i.amount, 0),
        expenses: expenses
          .filter((e) => e.date >= dayStart && e.date <= dayEnd)
          .reduce((s, e) => s + e.amount, 0),
      });
    }

    return { year, month, totalIncome, totalExpenses, balance: totalIncome - totalExpenses, dailyData };
  }

  async getAnnualSummary(userId: string, year: number) {
    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

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
      const monthStart = new Date(Date.UTC(year, m - 1, 1));
      const monthEnd = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
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
    endDate.setUTCHours(23, 59, 59, 999);

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
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        date: { gte: new Date(startDate), lte: end },
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
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const primaryColor = '#059669'; // Emerald-600
      const secondaryColor = '#4B5563'; // Gray-600
      const lightGray = '#F3F4F6'; // Gray-100
      const borderGray = '#E5E7EB'; // Gray-200
      
      const width = doc.page.width;
      const fmt = (n: number) => `S/ ${n.toFixed(2)}`;

      // --- Header ---
      doc.rect(0, 0, width, 100).fill(primaryColor);
      doc.fillColor('white').font('Helvetica-Bold').fontSize(28).text('FinSmart', 50, 30);
      doc.font('Helvetica').fontSize(12).text('REPORTE FINANCIERO', 50, 65);
      
      doc.fontSize(10).text(`Período: ${from} a ${to}`, 0, 45, { align: 'right', width: width - 50 });
      doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 0, 60, { align: 'right', width: width - 50 });

      // Reset Y pos after header
      doc.y = 130;

      // --- Summary Section ---
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(16).text('Resumen General', 50, doc.y);
      doc.moveDown(0.5);
      
      const summaryY = doc.y;
      const boxWidth = (width - 120) / 3;
      
      const drawBox = (x: number, title: string, amount: number, isRed: boolean) => {
        doc.rect(x, summaryY, boxWidth, 70).fillAndStroke(lightGray, borderGray);
        doc.fillColor(secondaryColor).font('Helvetica').fontSize(10).text(title, x + 15, summaryY + 15);
        doc.fillColor(isRed ? '#DC2626' : '#111827').font('Helvetica-Bold').fontSize(16).text(fmt(amount), x + 15, summaryY + 35);
      };

      drawBox(50, 'INGRESOS TOTALES', data.totalIncome, false);
      drawBox(50 + boxWidth + 10, 'GASTOS TOTALES', data.totalExpenses, true);
      drawBox(50 + (boxWidth + 10) * 2, 'BALANCE FINAL', data.balance, data.balance < 0);
      
      doc.y = summaryY + 100;

      // --- Categories Table ---
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(16).text('Desglose por Categoría', 50, doc.y);
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const col1X = 50;
      const col2X = width - 200;
      
      // Table Header
      doc.rect(50, tableTop, width - 100, 25).fill(primaryColor);
      doc.fillColor('white').font('Helvetica-Bold').fontSize(10);
      doc.text('CATEGORÍA', col1X + 10, tableTop + 8);
      doc.text('TOTAL GASTADO', col2X, tableTop + 8, { width: 140, align: 'right' });

      let currentY = tableTop + 25;
      
      if (data.categoryBreakdown.length === 0) {
         doc.rect(50, currentY, width - 100, 30).fill('white').stroke(borderGray);
         doc.fillColor(secondaryColor).font('Helvetica').text('No hay gastos en este período', col1X + 10, currentY + 10);
         currentY += 30;
      } else {
        // Sort descending
        const sortedCats = [...data.categoryBreakdown].sort((a, b) => b.total - a.total);
        
        sortedCats.forEach((cat, i) => {
          // Draw row background
          doc.rect(50, currentY, width - 100, 25).fill(i % 2 === 0 ? 'white' : lightGray);
          
          doc.fillColor('#111827').font('Helvetica').fontSize(10);
          doc.text(cat.category, col1X + 10, currentY + 8);
          doc.font('Helvetica-Bold').text(fmt(cat.total), col2X, currentY + 8, { width: 140, align: 'right' });
          
          currentY += 25;
        });
      }
      
      // Table Footer border
      doc.rect(50, tableTop, width - 100, currentY - tableTop).stroke(borderGray);

      // --- Footer ---
      const pageHeight = doc.page.height;
      doc.fillColor('#9CA3AF').font('Helvetica').fontSize(9);
      doc.text('FinSmart - Todos los derechos reservados', 50, pageHeight - 50, { align: 'center', width: width - 100 });

      doc.end();
    });
  }
}
