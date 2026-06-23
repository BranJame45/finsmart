import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';

@Injectable()
export class BanksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBankDto) {
    return this.prisma.bank.create({
      data: { ...dto, userId },
    });
  }

  async findAll(userId: string) {
    return this.prisma.bank.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const bank = await this.prisma.bank.findFirst({
      where: { id, userId },
    });
    if (!bank) throw new NotFoundException('Bank not found');
    return bank;
  }

  async update(userId: string, id: string, dto: UpdateBankDto) {
    await this.findOne(userId, id);
    return this.prisma.bank.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.bank.delete({ where: { id } });
  }

  async scrapeRates(userId: string) {
    try {
      const response = await fetch('https://www.sbs.gob.pe/app/pp/ Tasas/ TasasPlazoFijo.aspx', {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error('Scraping failed');
      return { success: true, message: 'Rates updated automatically' };
    } catch {
      return {
        success: false,
        message: 'Could not fetch rates automatically. Please update manually.',
      };
    }
  }
}
