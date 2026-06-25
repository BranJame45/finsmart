import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto } from './dto/create-income.dto';

@Injectable()
export class IncomeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateIncomeDto) {
    const income = await this.prisma.income.create({
      data: { ...dto, userId },
    });
    // Si es sueldo, deja registro en el historial de cambios de sueldo.
    if (dto.type === 'SALARY') {
      await this.prisma.salaryHistory.create({
        data: {
          userId,
          amount: dto.amount,
          currency: dto.currency ?? 'PEN',
          startDate: new Date(dto.date),
        },
      });
    }
    return income;
  }

  async salaryHistory(userId: string) {
    return this.prisma.salaryHistory.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findAll(userId: string) {
    return this.prisma.income.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const income = await this.prisma.income.findFirst({
      where: { id, userId },
    });
    if (!income) throw new NotFoundException('Income not found');
    return income;
  }

  async update(userId: string, id: string, dto: CreateIncomeDto) {
    const existing = await this.findOne(userId, id);
    const updated = await this.prisma.income.update({
      where: { id },
      data: dto,
    });
    // Cambio de sueldo -> nuevo registro en el historial.
    if (updated.type === 'SALARY' && existing.amount !== updated.amount) {
      await this.prisma.salaryHistory.create({
        data: {
          userId,
          amount: updated.amount,
          currency: updated.currency,
          startDate: new Date(updated.date),
        },
      });
    }
    return updated;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.income.delete({ where: { id } });
  }
}
