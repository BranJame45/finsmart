import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.reportsService.getDashboard(req.user.id);
  }

  @Get('monthly')
  getMonthlySummary(
    @Req() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.reportsService.getMonthlySummary(
      req.user.id,
      parseInt(year),
      parseInt(month),
    );
  }

  @Get('annual')
  getAnnualSummary(@Req() req: any, @Query('year') year: string) {
    return this.reportsService.getAnnualSummary(
      req.user.id,
      parseInt(year),
    );
  }

  @Get('comparison')
  getComparison(
    @Req() req: any,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.getComparison(req.user.id, from, to);
  }

  @Get('category-breakdown')
  getCategoryBreakdown(
    @Req() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getCategoryBreakdown(
      req.user.id,
      startDate,
      endDate,
    );
  }

  @Get('export-pdf')
  async exportPdf(
    @Req() req: any,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: any,
  ) {
    const pdfBuffer = await this.reportsService.exportPdf(req.user.id, from, to);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-${from}-${to}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
