import { Controller, Get, Post, Body, Param, Delete, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IncomeService } from './income.service';
import { CreateIncomeDto } from './dto/create-income.dto';

@Controller('income')
@UseGuards(AuthGuard('jwt'))
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateIncomeDto) {
    return this.incomeService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.incomeService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.incomeService.findOne(req.user.id, id);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: CreateIncomeDto) {
    return this.incomeService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.incomeService.remove(req.user.id, id);
  }
}
