import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { SseController } from './sse.controller';
import { MetricsService } from './metrics.service';
import TOKENS from './tokens';

@Module({
  controllers: [HealthController, SseController],
  providers: [
    {
      provide: TOKENS.IMetricsService,
      useClass: MetricsService,
    },
  ],
  exports: [TOKENS.IMetricsService],
})
export class HealthModule {}
