import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import type { WebVitals, NavigationTiming, BundleModule } from 'shared/types';

/**
 * Stores client-side performance reports.
 */
@Entity()
export class PerformanceReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  @Index()
  pageUrl: string;

  @Column()
  userAgent: string;

  @Column({ nullable: true })
  connectionType: string;

  @Column({ type: 'float', nullable: true })
  deviceMemory: number;

  @Column('simple-json')
  webVitals: Partial<WebVitals>;

  @Column('simple-json', { nullable: true })
  navigationTiming: NavigationTiming;

  @CreateDateColumn()
  @Index()
  timestamp: Date;
}

/**
 * Stores webpack bundle analysis snapshots.
 */
@Entity()
export class BundleSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  buildId: string;

  @Column({ type: 'integer' })
  totalSize: number;

  @Column({ type: 'integer' })
  gzippedSize: number;

  @Column('simple-json')
  modules: BundleModule[];

  @CreateDateColumn()
  generatedAt: Date;
}
