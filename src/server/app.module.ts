import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as fs from 'fs';

import { ExperienceModule } from './modules/experience/experience.module';
import { AboutModule } from './modules/about/about.module';
import { Experience } from './modules/experience/experience.entity';
import { Project } from './modules/projects/project.entity';
import { ProjectModule } from './modules/projects/project.module';
import { BlogModule } from './modules/blog/blog.module';
import { BlogPost } from './modules/blog/blog.entity';
import { User } from 'server/shared/modules/auth/user.entity';
import { SeedingModule } from './modules/seeding/seeding.module';

const clientPath = join(__dirname, '..', '..', 'client');

if (!fs.existsSync(clientPath)) {
  console.log('Client path does not exist:', clientPath);
  console.log('Current directory:', __dirname);
  try {
    const distPath = join(__dirname, '..', '..');
    console.log('Contents of dist:', fs.readdirSync(distPath));
  } catch (e) {
    console.log('Could not list dist:', e);
  }
} else {
  console.log('Client path exists:', clientPath);
  console.log(
    'Index file exists:',
    fs.existsSync(join(clientPath, 'index.html')),
  );
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/database.sqlite',
      entities: [Experience, Project, BlogPost, User],
      synchronize: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: clientPath,
    }),
    ExperienceModule,
    AboutModule,
    ProjectModule,
    BlogModule,
    SeedingModule,
  ],
})
export class AppModule {}
