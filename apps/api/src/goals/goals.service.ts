import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Agrega métricas calculadas: cuánto falta, progreso y ahorro mensual necesario. */
  private enrich<T extends { targetAmount: number; currentAmount: number; deadline: Date | null }>(goal: T) {
    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
    const progress = goal.targetAmount > 0 ? Math.min(goal.currentAmount / goal.targetAmount, 1) : 0;
    let monthsLeft: number | null = null;
    let monthlySavingNeeded: number | null = null;
    if (goal.deadline) {
      const now = new Date();
      const d = new Date(goal.deadline);
      monthsLeft = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
      if (monthsLeft > 0) monthlySavingNeeded = Math.ceil(remaining / monthsLeft);
    }
    return {
      ...goal,
      remaining,
      progress: Math.round(progress * 100), // %
      monthsLeft,
      monthlySavingNeeded,
    };
  }

  async create(userId: string, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: { ...dto, userId },
    });
  }

  async findAll(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      include: { bank: true },
      orderBy: { createdAt: 'desc' },
    });
    return goals.map((g) => this.enrich(g));
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId },
      include: { bank: true },
    });
    if (!goal) throw new NotFoundException('Goal not found');
    return this.enrich(goal);
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    await this.findOne(userId, id);
    return this.prisma.goal.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.goal.delete({ where: { id } });
  }
}
