import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  Sse,
  Inject,
  NotFoundException,
  UseGuards,
  MessageEvent,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Observable, fromEvent, map } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthGuardAdapter } from 'server/shared/adapters/auth';
import { ITraceService } from './trace.service';
import { TraceAlertService } from './trace-alert.service';
import type {
  TraceFilters,
  TraceStatsResult,
  HourlyStatsResult,
  EndpointStatsResult,
} from './trace.types';
import type { AlertRule, AlertEvent } from './alert.config';
import type { AlertHistory } from './alert-history.entity';
import { RequestTrace } from './trace.entity';
import TOKENS from './tokens';

/**
 * Controller for request trace observability endpoints.
 * Provides access to stored traces and real-time streaming.
 *
 * @see architecture/components/traces.md
 */
@ApiTags('Observability')
@Controller('api/traces')
export class TraceController {
  readonly #traceService: ITraceService;
  readonly #alertService: TraceAlertService;
  readonly #eventEmitter: EventEmitter2;

  constructor(
    @Inject(TOKENS.ITraceService)
    traceService: ITraceService,
    @Inject(TOKENS.ITraceAlertService)
    alertService: TraceAlertService,
    eventEmitter: EventEmitter2,
  ) {
    this.#traceService = traceService;
    this.#alertService = alertService;
    this.#eventEmitter = eventEmitter;
  }

  @Get()
  @ApiOperation({
    summary: 'List recent traces',
    description: 'Retrieves recent API request traces with optional filtering.',
  })
  @ApiQuery({
    name: 'method',
    required: false,
    description: 'Filter by HTTP method',
  })
  @ApiQuery({
    name: 'path',
    required: false,
    description: 'Filter by path (partial match)',
  })
  @ApiQuery({
    name: 'statusCode',
    required: false,
    description: 'Filter by status code',
  })
  @ApiQuery({
    name: 'minDuration',
    required: false,
    description: 'Minimum duration in ms',
  })
  @ApiQuery({
    name: 'maxDuration',
    required: false,
    description: 'Maximum duration in ms',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max results (default 100)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset for pagination',
  })
  @ApiResponse({ status: 200, description: 'List of traces' })
  async getTraces(
    @Query('method') method?: string,
    @Query('path') path?: string,
    @Query('statusCode') statusCode?: string,
    @Query('minDuration') minDuration?: string,
    @Query('maxDuration') maxDuration?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<RequestTrace[]> {
    const filters: TraceFilters = {
      method,
      path,
      statusCode: statusCode ? parseInt(statusCode, 10) : undefined,
      minDuration: minDuration ? parseFloat(minDuration) : undefined,
      maxDuration: maxDuration ? parseFloat(maxDuration) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.#traceService.getRecentTraces(filters);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get trace statistics',
    description: 'Returns aggregate statistics about stored traces.',
  })
  @ApiResponse({ status: 200, description: 'Trace statistics' })
  async getStats(): Promise<TraceStatsResult> {
    return this.#traceService.getStats();
  }

  @Get('stats/hourly')
  @ApiOperation({
    summary: 'Get hourly trace statistics',
    description: 'Returns hourly statistics for trend visualization.',
  })
  @ApiQuery({
    name: 'hours',
    required: false,
    description: 'Number of hours to look back (default 24)',
  })
  @ApiResponse({ status: 200, description: 'Hourly statistics array' })
  async getHourlyStats(
    @Query('hours') hours?: string,
  ): Promise<HourlyStatsResult[]> {
    const hoursNum = hours ? parseInt(hours, 10) : 24;
    return this.#traceService.getHourlyStats(hoursNum);
  }

  @Get('stats/endpoints')
  @ApiOperation({
    summary: 'Get per-endpoint statistics',
    description: 'Returns statistics grouped by endpoint for breakdown view.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of endpoints to return (default 20)',
  })
  @ApiResponse({ status: 200, description: 'Endpoint statistics array' })
  async getEndpointStats(
    @Query('limit') limit?: string,
  ): Promise<EndpointStatsResult[]> {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.#traceService.getEndpointStats(limitNum);
  }

  @Get('stream')
  @Sse()
  @ApiOperation({
    summary: 'Real-time trace stream',
    description: 'Server-Sent Events endpoint for live trace updates.',
  })
  @ApiResponse({ status: 200, description: 'SSE stream of new traces' })
  streamTraces(): Observable<MessageEvent> {
    return fromEvent<RequestTrace>(this.#eventEmitter, 'trace.created').pipe(
      /* istanbul ignore next -- callback is tested via SSE integration, hard to unit test with EventEmitter2 */
      map((trace) => ({
        data: trace,
      })),
    );
  }

  @Get('alerts/stream')
  @Sse()
  @ApiOperation({
    summary: 'Real-time alert stream',
    description: 'Server-Sent Events endpoint for live alert updates.',
  })
  @ApiResponse({ status: 200, description: 'SSE stream of alerts' })
  streamAlerts(): Observable<MessageEvent> {
    return fromEvent<AlertEvent>(this.#eventEmitter, 'alert.triggered').pipe(
      /* istanbul ignore next -- callback tested via SSE integration */
      map((alert) => ({
        data: alert,
      })),
    );
  }

  @Get('alerts/rules')
  @ApiOperation({
    summary: 'Get alert rules',
    description: 'Returns the configured alert rules.',
  })
  @ApiResponse({ status: 200, description: 'List of alert rules' })
  getAlertRules(): AlertRule[] {
    return this.#alertService.getAlertRules();
  }

  @Get('alerts/history')
  @ApiOperation({
    summary: 'Get alert history',
    description: 'Returns recent triggered alerts.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of alerts to return (default 20)',
  })
  @ApiResponse({ status: 200, description: 'List of alert history records' })
  async getAlertHistory(
    @Query('limit') limit?: string,
  ): Promise<AlertHistory[]> {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.#alertService.getRecentAlerts(limitNum);
  }

  @Get('alerts/unresolved')
  @ApiOperation({
    summary: 'Get unresolved alerts',
    description: 'Returns alerts that have not been resolved.',
  })
  @ApiResponse({ status: 200, description: 'List of unresolved alerts' })
  async getUnresolvedAlerts(): Promise<AlertHistory[]> {
    return this.#alertService.getUnresolvedAlerts();
  }

  @Patch('alerts/:id/resolve')
  @UseGuards(AuthGuardAdapter)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Resolve an alert',
    description: 'Marks an alert as resolved. Requires authentication.',
  })
  @ApiResponse({ status: 200, description: 'Alert resolved' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resolveAlert(
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ): Promise<AlertHistory> {
    const alert = await this.#alertService.resolveAlert(
      parseInt(id, 10),
      body.notes,
    );
    if (!alert) {
      throw new NotFoundException(`Alert ${id} not found`);
    }
    return alert;
  }

  @Get(':traceId')
  @ApiOperation({
    summary: 'Get trace by ID',
    description: 'Retrieves a single trace by its correlation ID.',
  })
  @ApiResponse({ status: 200, description: 'The trace' })
  @ApiResponse({ status: 404, description: 'Trace not found' })
  async getTraceById(@Param('traceId') traceId: string): Promise<RequestTrace> {
    const trace = await this.#traceService.getTraceById(traceId);

    if (!trace) {
      throw new NotFoundException(`Trace ${traceId} not found`);
    }

    return trace;
  }

  @Delete()
  @UseGuards(AuthGuardAdapter)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Clear all traces',
    description: 'Deletes all stored traces. Requires authentication.',
  })
  @ApiResponse({ status: 200, description: 'Traces cleared' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearTraces(): Promise<{ deleted: number }> {
    // Delete all traces by using a very old cutoff date
    const deleted = await this.#traceService.cleanupOldTraces();
    return { deleted };
  }
}
