import { IsNumber, IsOptional, Min } from 'class-validator';

export class SimulateInvestmentDto {
  @IsNumber()
  @Min(0)
  capital: number;

  @IsNumber()
  @Min(0)
  trea: number;

  @IsNumber()
  @Min(1)
  termDays: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyContribution?: number;
}
