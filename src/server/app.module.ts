import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { ExperienceModule } from './modules/experience/experience.module';
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
