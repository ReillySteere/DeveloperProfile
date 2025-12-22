import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ExperienceEntry } from 'shared/types';

@Entity()
export class Experience implements ExperienceEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company: string;

  @Column()
  description: string;

  @Column()
  role: string;

  @Column()
  startDate: string;

  @Column({ type: 'text', nullable: true })
  endDate: string | null;

  @Column('simple-json')
  bulletPoints: string[];

  @Column('simple-json')
  tags: string[];
}
