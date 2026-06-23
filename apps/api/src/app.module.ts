import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { IncomeModule } from './income/income.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CategoriesModule } from './categories/categories.module';
import { ReportsModule } from './reports/reports.module';
import { BanksModule } from './banks/banks.module';
import { InvestmentModule } from './investment/investment.module';
import { GoalsModule } from './goals/goals.module';
import { AiModule } from './ai/ai.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    AuthModule,
    IncomeModule,
    ExpensesModule,
    CategoriesModule,
    ReportsModule,
    BanksModule,
    InvestmentModule,
    GoalsModule,
    AiModule,
    NotificationsModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
