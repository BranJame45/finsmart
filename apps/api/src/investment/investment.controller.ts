import { Controller, Get, Post, Body, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvestmentService } from './investment.service';
import { SimulateInvestmentDto } from './dto/simulate-investment.dto';
import { CreateInvestmentDto } from './dto/create-investment.dto';

@Controller('investment')
@UseGuards(AuthGuard('jwt'))
export class InvestmentController {
  constructor(private readonly investmentService: InvestmentService) {}

  @Post('simulate')
  simulate(@Body() dto: SimulateInvestmentDto) {
    return this.investmentService.simulate(dto);
  }

  @Post('compare')
  compare(@Req() req: any, @Body() dto: { amount: number; currency: string; termDays: number }) {
    return this.investmentService.compare(req.user.id, dto.amount, dto.currency, dto.termDays);
  }

  @Post('goal-projection')
  goalProjection(@Body() dto: { targetAmount: number; initialCapital: number; monthlyContribution: number; termMonths: number }) {
    return this.investmentService.goalProjection(dto);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateInvestmentDto) {
    return this.investmentService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.investmentService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.investmentService.findOne(req.user.id, id);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.investmentService.remove(req.user.id, id);
  }
}
