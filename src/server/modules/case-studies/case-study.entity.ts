import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import {
  CaseStudyPhase,
  CaseStudyMetric,
  CaseStudyDiagram,
  CodeComparison,
} from 'shared/types';

@Entity({ name: 'case_studies' })
export class CaseStudy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project, { eager: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  // Problem Section
  @Column('text')
  problemContext: string;

  @Column('simple-json')
  challenges: string[];

  // Solution Section
  @Column('text')
  approach: string;

  @Column('simple-json')
  phases: CaseStudyPhase[];

  @Column('simple-json')
  keyDecisions: string[];

  // Outcome Section
  @Column('text')
  outcomeSummary: string;

  @Column('simple-json')
  metrics: CaseStudyMetric[];

  @Column('simple-json')
  learnings: string[];

  // Optional Rich Content
  @Column('simple-json', { nullable: true })
  diagrams?: CaseStudyDiagram[];

  @Column('simple-json', { nullable: true })
  codeComparisons?: CodeComparison[];

  @Column({ default: false })
  published: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
