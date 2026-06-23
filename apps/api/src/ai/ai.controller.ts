import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('chat')
  getChatHistory(@Req() req: any) {
    return this.aiService.getHistory(req.user.id);
  }

  @Post('chat')
  async chat(@Req() req: any, @Body() body: { message: string; lang?: string }) {
    return this.aiService.chat(req.user.id, body.message, body.lang || 'es');
  }

  @Get('weekly-recommendation')
  async getWeeklyRecommendation(@Req() req: any) {
    return this.aiService.generateWeeklyRecommendation(req.user.id);
  }
}
