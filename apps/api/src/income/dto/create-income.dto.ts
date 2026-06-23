import { IsEnum, IsNumber, IsString, IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { IncomeType, Currency, RecurringFrequency } from '@prisma/client';

export class CreateIncomeDto {
  @IsEnum(IncomeType)
  type: IncomeType;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsBoolean()
  recurring?: boolean;

  @IsOptional()
  @IsEnum(RecurringFrequency)
  frequency?: RecurringFrequency;
}
