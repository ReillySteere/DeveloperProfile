import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';
import { SentryExceptionFilter } from './sentry-exception.filter';
import { AppLoggerService } from './shared/modules/logger';
import { JwtAuthGuard } from './shared/modules/auth/jwt-auth.guard';

import * as fs from 'fs';
import { NextFunction, Request, Response } from 'express';

async function bootstrap() {
  // Ensure data directory exists for SQLite
  if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
  }

  const sentryDsn =
    process.env.SENTRY_DSN ||
    (process.env.NODE_ENV === 'production'
      ? 'https://eb783d6134fbc05925302caf50fc87bf@o4510728628797440.ingest.us.sentry.io/4510728630042624'
      : '');

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '0.0.0',
    integrations: [Sentry.httpIntegration()],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    enabled: !!sentryDsn,
    enableLogs: true,
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(AppLoggerService);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  app.useGlobalFilters(new SentryExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Developer Profile API')
    .setDescription('API documentation for the Developer Profile backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Protect Swagger documentation with JWT authentication
  const httpAdapter = app.getHttpAdapter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpAdapter.use('/api/docs', async (req: any, res: any, next: any) => {
    const jwtGuard = new JwtAuthGuard();
    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
      getArgs: () => [],
      getArgByIndex: () => ({}),
      switchToRpc: () => ({}),
      switchToWs: () => ({}),
      getType: () => 'http' as const,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canActivate = await jwtGuard.canActivate(context as any);
      if (canActivate) {
        next();
      } else {
        res.status(401).json({ message: 'Unauthorized' });
      }
    } catch {
      res.status(401).json({ message: 'Unauthorized' });
    }
  });

  SwaggerModule.setup('api/docs', app, document);

  /**
   * SPA history fallback for TanStack Router
   * Must run AFTER controllers and ServeStaticModule
   */
  const clientRoot = join(__dirname, '..', 'client');
  const indexHtml = join(clientRoot, 'index.html');

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api')) return next();

    const accept = req.headers.accept ?? '';
    if (!accept.includes('text/html')) return next();

    return res.sendFile(indexHtml);
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  Sentry.captureException(err);
  process.exit(1);
});
