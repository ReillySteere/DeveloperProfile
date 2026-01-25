import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
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
import type { TraceFilters, TraceStatsResult } from './trace.types';
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
  readonly #eventEmitter: EventEmitter2;

  constructor(
    @Inject(TOKENS.ITraceService)
    traceService: ITraceService,
    eventEmitter: EventEmitter2,
  ) {
    this.#traceService = traceService;
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
