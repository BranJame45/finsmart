import { IsString, IsOptional, IsNumber, IsEnum, IsHexColor } from 'class-validator';
import { Currency } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;
}
