import { Controller, Sse, Query, MessageEvent, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Observable, interval, switchMap, startWith, from, map } from 'rxjs';
import { IMetricsService } from './metrics.service';
import type { ChaosFlags } from 'shared/types';
import TOKENS from './tokens';

/**
 * SSE Controller for real-time telemetry streaming.
 * Provides a Server-Sent Events endpoint for the Mission Control dashboard.
 *
 * @see architecture/components/status.md
 */
@ApiTags('Health & Telemetry')
@Controller('api/health')
export class SseController {
  readonly #metricsService: IMetricsService;

  constructor(@Inject(TOKENS.IMetricsService) metricsService: IMetricsService) {
    this.#metricsService = metricsService;
  }

  @Sse('stream')
  @ApiOperation({
    summary: 'Real-time telemetry stream',
    description:
      'Server-Sent Events endpoint providing system metrics every second. ' +
      'Pass chaos flags to simulate degradation (production-safe).',
  })
  @ApiQuery({
    name: 'chaos',
    required: false,
    description: 'Comma-separated chaos flags: cpu,memory',
    example: 'cpu,memory',
  })
  @ApiResponse({
    status: 200,
    description: 'SSE stream of TelemetrySnapshot objects',
  })
  stream(@Query('chaos') chaosParam?: string): Observable<MessageEvent> {
    // Parse chaos flags from query string (client-controlled, production-safe)
    const chaosFlags: ChaosFlags = {
      cpu: chaosParam?.includes('cpu') ?? false,
      memory: chaosParam?.includes('memory') ?? false,
    };

    // Emit every 1 second, starting immediately
    return interval(1000).pipe(
      startWith(0),
      switchMap(() => from(this.#metricsService.collectSnapshot())),
      map((snapshot) => {
        // Apply chaos SIMULATION (does not affect real server)
        const finalSnapshot = this.#metricsService.applyChaosSim(
          snapshot,
          chaosFlags,
        );
        return {
          data: finalSnapshot,
        } as MessageEvent;
      }),
    );
  }
}
