import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    database: 'connected' | 'disconnected';
  };
}

interface ReadinessResponse {
  status: 'ready' | 'not-ready';
}

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({
    summary: 'Health check endpoint for load balancers and orchestration',
  })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check(): HealthCheckResponse {
    const dbHealthy = this.dataSource.isInitialized;

    return {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy ? 'connected' : 'disconnected',
      },
    };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness check for Kubernetes/container orchestration',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is ready to accept traffic',
  })
  ready(): ReadinessResponse {
    return { status: 'ready' };
  }
}
