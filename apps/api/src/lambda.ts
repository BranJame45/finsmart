import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverlessExpress from '@codegenie/serverless-express';
import type { Handler } from 'aws-lambda';
import { AppModule } from './app.module';

/**
 * Entry point para AWS Lambda.
 * Arranca la app NestJS una sola vez y la cachea entre invocaciones
 * (Lambda reutiliza el contenedor "caliente"), reduciendo el cold start.
 */
let cachedServer: Handler;

async function bootstrap(): Promise<Handler> {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  // Health check sin auth ni prefix (igual que en la versión local).
  app.getHttpAdapter().get('/api/health', (_req: any, res: any) =>
    res.status(200).json({ status: 'ok' }),
  );

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (event, context, callback) => {
  cachedServer = cachedServer ?? (await bootstrap());
  return cachedServer(event, context, callback);
};
