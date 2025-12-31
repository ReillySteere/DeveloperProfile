import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';
import { ExperienceModule } from './modules/experience/experience.module';
import { AboutModule } from './modules/about/about.module';
import { Experience } from './modules/experience/experience.entity';
import { SeedExperience1703289600000 } from './migrations/1703289600000-SeedExperience';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/database.sqlite',
      entities: [Experience],
      synchronize: true,
      migrations: [SeedExperience1703289600000],
      migrationsRun: true,
    }),
    AuthModule,
    ExperienceModule,
    AboutModule,
  ],
})
export class AppModule {}
