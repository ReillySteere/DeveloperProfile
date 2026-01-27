import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'server/shared/modules/auth';
import { LoggerModule } from 'server/shared/modules/logger';
import { RequestTrace } from './trace.entity';
import { AlertHistory } from './alert-history.entity';
import { TraceRepository } from './trace.repository';
import { TraceService } from './trace.service';
import { TraceController } from './trace.controller';
import { TraceAlertService } from './trace-alert.service';
import {
  SentryAlertChannel,
  LogAlertChannel,
  EmailAlertChannel,
} from './channels';
import TOKENS from './tokens';

/**
 * Module providing request tracing and observability features.
 *
 * Exposes:
 * - TraceService for recording and querying traces
 * - TraceController for REST API and SSE streaming
 * - TraceAlertService for metric monitoring and alerting
 * - Scheduled cleanup job for trace retention
 * - Database size monitoring with Sentry alerts
 *
 * @see architecture/components/traces.md
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([RequestTrace, AlertHistory]),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ConfigModule,
    AuthModule,
    LoggerModule,
  ],
  controllers: [TraceController],
  providers: [
    {
      provide: TOKENS.ITraceRepository,
      useClass: TraceRepository,
    },
    {
      provide: TOKENS.ITraceService,
      useClass: TraceService,
    },
    {
      provide: TOKENS.ITraceAlertService,
      useClass: TraceAlertService,
    },
    SentryAlertChannel,
    LogAlertChannel,
    EmailAlertChannel,
  ],
  exports: [TOKENS.ITraceService, TOKENS.ITraceAlertService],
})
export class TraceModule {}
