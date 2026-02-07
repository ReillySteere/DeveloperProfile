import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { WebVitals, NavigationTiming } from 'shared/types';

export class ReportMetricDto {
  @ApiProperty({ description: 'Anonymous session identifier' })
  sessionId: string;

  @ApiProperty({ description: 'Page URL where metrics were collected' })
  pageUrl: string;

  @ApiProperty({ description: 'Browser user agent string' })
  userAgent: string;

  @ApiPropertyOptional({ description: 'Network connection type' })
  connectionType?: string;

  @ApiPropertyOptional({ description: 'Device memory in GB' })
  deviceMemory?: number;

  @ApiProperty({ description: 'Collected Web Vitals metrics' })
  webVitals: Partial<WebVitals>;

  @ApiPropertyOptional({ description: 'Navigation timing breakdown' })
  navigationTiming?: NavigationTiming;
}
