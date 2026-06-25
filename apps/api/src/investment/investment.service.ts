import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SimulateInvestmentDto } from './dto/simulate-investment.dto';
import { CreateInvestmentDto } from './dto/create-investment.dto';

@Injectable()
export class InvestmentService {
  constructor(private readonly prisma: PrismaService) {}

  simulate(dto: SimulateInvestmentDto) {
    const { capital, trea, termDays, monthlyContribution } = dto;

    const gain = capital * (trea / 100) * (termDays / 360);
    const finalAmount = capital + gain;

    if (monthlyContribution && monthlyContribution > 0) {
      const months = Math.floor(termDays / 30);
      const monthlyRate = trea / 12 / 100;
      const futureValue =
        capital * Math.pow(1 + monthlyRate, months) +
        monthlyContribution *
          ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

      return {
        simpleGain: gain,
        simpleFinal: finalAmount,
        projectedWithContributions: futureValue,
        monthlyContribution,
        months,
      };
    }

    return { gain, finalAmount };
  }

  async compare(userId: string, amount: number, currency: string, termDays: number) {
    const banks = await this.prisma.bank.findMany({
      where: { userId, active: true, terms: { has: termDays } },
    });

    const results = banks
      .map((bank) => {
        const rate = currency === 'USD' ? bank.apyUSD : bank.treaPEN;
        if (!rate) return null;
        const gain = amount * (rate / 100) * (termDays / 360);
        return {
          bankId: bank.id,
          bankName: bank.name,
          rate,
          gain,
          finalAmount: amount + gain,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.finalAmount - a!.finalAmount);

    return {
      amount,
      currency,
      termDays,
      results,
      bestBank: results[0] || null,
    };
  }

  async goalProjection(dto: { targetAmount: number; initialCapital: number; monthlyContribution: number; termMonths: number; annualRate?: number }) {
    const { targetAmount, initialCapital, monthlyContribution, termMonths } = dto;
    // Tasa mensual a partir de la TREA recibida (fórmula del requerimiento: TREA/12/100).
    const annualRate = dto.annualRate ?? 4; // fallback realista si el front no envía banco
    const monthlyRate = annualRate / 12 / 100;
    const monthlyData = [];

    let current = initialCapital;
    for (let m = 1; m <= termMonths; m++) {
      current = current * (1 + monthlyRate) + monthlyContribution;
      monthlyData.push({ month: m, amount: Math.round(current * 100) / 100 });
    }

    const isReachable = current >= targetAmount;
    let requiredMonthly = monthlyContribution;
    if (!isReachable) {
      const guessMonthly = (targetAmount - initialCapital * Math.pow(1 + monthlyRate, termMonths)) /
        ((Math.pow(1 + monthlyRate, termMonths) - 1) / monthlyRate);
      requiredMonthly = Math.ceil(guessMonthly);
    }

    return {
      targetAmount,
      initialCapital,
      monthlyContribution: dto.monthlyContribution,
      termMonths,
      projectedFinal: Math.round(current * 100) / 100,
      isReachable,
      monthsToGoal: isReachable ? monthlyData.findIndex((d) => d.amount >= targetAmount) + 1 : null,
      suggestedMonthlyContribution: isReachable ? null : requiredMonthly,
      monthlyData,
    };
  }

  async create(userId: string, dto: CreateInvestmentDto) {
    const bank = await this.prisma.bank.findUnique({
      where: { id: dto.bankId },
    });
    if (!bank) throw new NotFoundException('Bank not found');

    const treaApplied = dto.currency === 'USD' ? bank.apyUSD : bank.treaPEN;
    if (!treaApplied) throw new NotFoundException('Bank has no rate for this currency');

    const gain = dto.amount * (treaApplied / 100) * (dto.termDays / 360);
    const finalAmount = dto.amount + gain;

    return this.prisma.investment.create({
      data: {
        ...dto,
        userId,
        treaApplied,
        projectedGain: gain,
        finalAmount,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.investment.findMany({
      where: { userId },
      include: { bank: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const investment = await this.prisma.investment.findFirst({
      where: { id, userId },
      include: { bank: true },
    });
    if (!investment) throw new NotFoundException('Investment not found');
    return investment;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.investment.delete({ where: { id } });
  }
}
