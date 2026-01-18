import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';
import { ValidationPipe } from '@nestjs/common';
import { SentryExceptionFilter } from './sentry-exception.filter';
import { AppLoggerService } from './shared/modules/logger';

import * as fs from 'fs';

async function bootstrap() {
  // Ensure data directory exists for SQLite
  if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
  }

  // Determine Sentry DSN: use env var if set, otherwise use prod DSN only in production
  const sentryDsn =
    process.env.SENTRY_DSN ||
    (process.env.NODE_ENV === 'production'
      ? 'https://eb783d6134fbc05925302caf50fc87bf@o4510728628797440.ingest.us.sentry.io/4510728630042624'
      : '');

  // Initialize Sentry with enhanced configuration
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '0.0.0',
    integrations: [Sentry.httpIntegration()],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    enabled: !!sentryDsn,
    enableLogs: true,
  });

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use custom logger
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
    .addBearerAuth() // JWT Authenication
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  Sentry.captureException(err);
  process.exit(1);
});
