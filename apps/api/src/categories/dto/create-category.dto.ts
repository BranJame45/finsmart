import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Currency } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;
}
