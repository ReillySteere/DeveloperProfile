import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Sse,
  Inject,
  MessageEvent,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Observable, fromEvent, map } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { IPerformanceService } from './performance.service';
import type { AggregatedMetrics, Benchmark } from 'shared/types';
import { ReportMetricDto } from './dto/reportMetric.dto';
import { PerformanceReport, BundleSnapshot } from './performance.entity';
import TOKENS from './tokens';
import { PERFORMANCE_EVENTS } from './events';

@ApiTags('Performance')
@Controller('api/performance')
export class PerformanceController {
  readonly #performanceService: IPerformanceService;
  readonly #eventEmitter: EventEmitter2;

  constructor(
    @Inject(TOKENS.IPerformanceService)
    performanceService: IPerformanceService,
    eventEmitter: EventEmitter2,
  ) {
    this.#performanceService = performanceService;
    this.#eventEmitter = eventEmitter;
  }

  @Post('report')
  @ApiOperation({ summary: 'Report client-side performance metrics' })
  @ApiBody({ type: ReportMetricDto })
  @ApiResponse({ status: 201, description: 'Metric reported' })
  async reportMetrics(
    @Body() report: ReportMetricDto,
  ): Promise<PerformanceReport> {
    return this.#performanceService.reportMetrics(report);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get aggregated performance metrics' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Filter by page URL',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to aggregate',
  })
  @ApiResponse({ status: 200, description: 'Aggregated metrics' })
  async getMetrics(
    @Query('page') page?: string,
    @Query('days') days?: string,
  ): Promise<AggregatedMetrics> {
    const daysNum = days ? parseInt(days, 10) : undefined;
    return this.#performanceService.getAggregatedMetrics(page, daysNum);
  }

  @Get('stream')
  @Sse()
  @ApiOperation({ summary: 'Real-time performance metric stream' })
  @ApiResponse({ status: 200, description: 'SSE stream of new metrics' })
  streamMetrics(): Observable<MessageEvent> {
    return fromEvent(
      this.#eventEmitter,
      PERFORMANCE_EVENTS.PERFORMANCE_REPORTED,
    ).pipe(
      map((report) => ({
        data: report as PerformanceReport,
      })),
    );
  }

  @Get('benchmarks')
  @ApiOperation({ summary: 'Get industry benchmark data' })
  @ApiResponse({ status: 200, description: 'Industry benchmark data' })
  getBenchmarks(): Benchmark[] {
    return this.#performanceService.getBenchmarks();
  }

  @Get('bundle')
  @ApiOperation({ summary: 'Get latest bundle analysis snapshot' })
  @ApiResponse({ status: 200, description: 'Latest bundle snapshot' })
  async getLatestBundle(): Promise<BundleSnapshot | null> {
    return this.#performanceService.getLatestBundle();
  }
}
