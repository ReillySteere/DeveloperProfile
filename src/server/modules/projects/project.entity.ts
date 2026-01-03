import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Project as ProjectType } from 'shared/types/projects.types';

@Entity({ name: 'projects' })
export class Project implements ProjectType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  shortDescription!: string;

  @Column({ type: 'varchar', length: 255 })
  role!: string;

  @Column({ type: 'simple-json' })
  requirements!: string[];

  @Column({ type: 'simple-json' })
  execution!: string[];

  @Column({ type: 'simple-json' })
  results!: string[];

  @Column({ type: 'simple-json' })
  technologies!: string[];

  @Column({ type: 'varchar', length: 10 })
  startDate!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  endDate?: string;
}
