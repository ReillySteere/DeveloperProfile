import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CaseStudyController } from './case-study.controller';
import { CaseStudyService } from './case-study.service';
import { CaseStudyRepository } from './case-study.repository';
import { CaseStudy } from './case-study.entity';
import TOKENS from './tokens';
import { AuthModule } from 'server/shared/modules/auth';
import {
  AuthGuardAdapter,
  AUTH_ADAPTER_TOKENS,
} from 'server/shared/adapters/auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([CaseStudy]),
    EventEmitterModule.forRoot(),
    AuthModule,
  ],
  controllers: [CaseStudyController],
  providers: [
    {
      provide: TOKENS.CaseStudyService,
      useClass: CaseStudyService,
    },
    {
      provide: TOKENS.CaseStudyRepository,
      useClass: CaseStudyRepository,
    },
    {
      provide: AUTH_ADAPTER_TOKENS.AuthGuard,
      useClass: AuthGuardAdapter,
    },
    AuthGuardAdapter,
  ],
  exports: [TOKENS.CaseStudyService],
})
export class CaseStudyModule {}
