import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * Alert history entity for tracking triggered alerts.
 * Used for cooldown checks and audit trail.
 */
@Entity('alert_history')
export class AlertHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  ruleName!: string;

  @Column()
  metric!: string;

  @Column('real')
  threshold!: number;

  @Column('real')
  actualValue!: number;

  @Index()
  @CreateDateColumn()
  triggeredAt!: Date;

  @Column('simple-json')
  channels!: string[];

  @Column({ default: false })
  resolved!: boolean;

  @Column({ type: 'datetime', nullable: true })
  resolvedAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
