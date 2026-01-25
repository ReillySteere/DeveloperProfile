import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from 'server/shared/modules/auth';
import { RequestTrace } from './trace.entity';
import { TraceRepository } from './trace.repository';
import { TraceService } from './trace.service';
import { TraceController } from './trace.controller';
import TOKENS from './tokens';

/**
 * Module providing request tracing and observability features.
 *
 * Exposes:
 * - TraceService for recording and querying traces
 * - TraceController for REST API and SSE streaming
 * - Scheduled cleanup job for trace retention
 * - Database size monitoring with Sentry alerts
 *
 * @see architecture/components/traces.md
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([RequestTrace]),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    AuthModule,
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
  ],
  exports: [TOKENS.ITraceService],
})
export class TraceModule {}
