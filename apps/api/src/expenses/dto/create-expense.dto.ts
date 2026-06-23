import { IsNumber, IsString, IsOptional, IsBoolean, IsDateString, IsEnum } from 'class-validator';
import { Currency, RecurringFrequency } from '@prisma/client';

export class CreateExpenseDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsString()
  description: string;

  @IsString()
  categoryId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsBoolean()
  recurring?: boolean;

  @IsOptional()
  @IsEnum(RecurringFrequency)
  frequency?: RecurringFrequency;
}
