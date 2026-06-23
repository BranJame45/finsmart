import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { Currency, GoalStatus } from '@prisma/client';

export class CreateGoalDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  targetAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAmount?: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  bankId?: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;
}
