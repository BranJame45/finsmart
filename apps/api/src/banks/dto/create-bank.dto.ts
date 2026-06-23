import { IsString, IsNumber, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class CreateBankDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  treaPEN?: number;

  @IsOptional()
  @IsNumber()
  apyUSD?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  terms: number[];

  @IsOptional()
  @IsNumber()
  minAmountPEN?: number;

  @IsOptional()
  @IsNumber()
  minAmountUSD?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
