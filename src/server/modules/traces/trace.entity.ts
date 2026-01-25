import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import type { PhaseTiming, IRequestTrace } from './trace.types';

// Re-export for backward compatibility
export type { PhaseTiming } from './trace.types';

/**
 * Request trace entity for observability dashboard.
 * Stores metadata about each API request for visualization.
 *
 * @see architecture/components/traces.md
 */
@Entity()
export class RequestTrace implements IRequestTrace {
  /** UUID correlation ID for the request */
  @PrimaryColumn('uuid')
  traceId: string;

  /** HTTP method (GET, POST, PUT, DELETE, etc.) */
  @Column({ length: 10 })
  method: string;

  /** Request path (e.g., /api/experience) */
  @Column()
  @Index()
  path: string;

  /** HTTP status code returned */
  @Column()
  @Index()
  statusCode: number;

  /** Total request duration in milliseconds */
  @Column('float')
  durationMs: number;

  /** Breakdown of time spent in each pipeline phase */
  @Column('simple-json')
  timing: PhaseTiming;

  /** User ID if authenticated (null for anonymous requests) */
  @Column({ nullable: true })
  userId?: number;

  /** Client user agent string */
  @Column()
  userAgent: string;

  /** Client IP address */
  @Column()
  ip: string;

  /** When the request was received */
  @CreateDateColumn()
  @Index()
  timestamp: Date;
}
