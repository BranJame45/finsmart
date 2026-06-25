import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContextBuilder } from './context.builder';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextBuilder: ContextBuilder,
  ) {}

  async getHistory(userId: string) {
    return this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
  }

  async chat(userId: string, message: string, lang: string = 'es') {
    const userContext = await this.contextBuilder.buildUserContext(userId);

    const userMessage = await this.prisma.chatMessage.create({
      data: { userId, role: 'user', content: message, lang },
    });

    const isSpanish = lang === 'es';
    const systemPrompt = isSpanish
      ? `Eres un asistente financiero personal. Contexto financiero real del usuario:\n${userContext}\n\nResponde preguntas sobre sus finanzas, analiza sus gastos y da recomendaciones basadas en sus datos reales. Limítate a ahorro, gestión de gastos y plazo fijo. NO des consejos sobre inversiones de alto riesgo (criptomonedas, acciones, forex, derivados); si te lo piden, recomienda con cortesía mantenerse en plazo fijo y ahorro. Responde SIEMPRE en español.`
      : `You are a personal financial assistant. The user's real financial context:\n${userContext}\n\nAnswer questions about their finances, analyze spending and give recommendations based on their real data. Stick to savings, expense management and fixed-term deposits. DO NOT give advice on high-risk investments (crypto, stocks, forex, derivatives); if asked, politely steer them back to fixed-term deposits and saving. Always respond in English.`;

    const groqResponse = await this.callGroq(systemPrompt, message);

    const assistantMessage = await this.prisma.chatMessage.create({
      data: { userId, role: 'assistant', content: groqResponse, lang },
    });

    return { userMessage, assistantMessage };
  }

  async generateWeeklyRecommendation(userId: string) {
    const context = await this.contextBuilder.buildUserContext(userId);

    const prompt = `Based on this financial context, give a personalized weekly recommendation:\n${context}\nKeep it concise and actionable.`;

    const recommendation = await this.callGroq(
      'You are a financial advisor. Give a short weekly recommendation.',
      prompt,
    );

    return { recommendation, generatedAt: new Date().toISOString() };
  }

  private async callGroq(systemPrompt: string, userMessage: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return 'AI service not configured. Please set GROQ_API_KEY.';

    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
          }),
        },
      );

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'No response from AI';
    } catch {
      return 'Error calling AI service';
    }
  }
}
