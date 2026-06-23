import { IsString, IsNumber, IsEnum, IsDateString, Min } from 'class-validator';
import { Currency } from '@prisma/client';

export class CreateInvestmentDto {
  @IsString()
  bankId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(Currency)
  currency: Currency;

  @IsNumber()
  @Min(1)
  termDays: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
