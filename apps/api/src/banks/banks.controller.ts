import { Controller, Get, Post, Body, Param, Delete, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BanksService } from './banks.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';

@Controller('banks')
@UseGuards(AuthGuard('jwt'))
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateBankDto) {
    return this.banksService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.banksService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.banksService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBankDto) {
    return this.banksService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.banksService.remove(req.user.id, id);
  }

  @Post('scrape-rates')
  async scrapeRates(@Req() req: any) {
    return this.banksService.scrapeRates(req.user.id);
  }
}
