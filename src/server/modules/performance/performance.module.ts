import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'server/shared/modules/logger';
import { PerformanceReport, BundleSnapshot } from './performance.entity';
import { PerformanceRepository } from './performance.repository';
import { PerformanceService } from './performance.service';
import { PerformanceController } from './performance.controller';
import TOKENS from './tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([PerformanceReport, BundleSnapshot]),
    LoggerModule,
  ],
  controllers: [PerformanceController],
  providers: [
    {
      provide: TOKENS.IPerformanceRepository,
      useClass: PerformanceRepository,
    },
    {
      provide: TOKENS.IPerformanceService,
      useClass: PerformanceService,
    },
  ],
  exports: [TOKENS.IPerformanceService],
})
export class PerformanceModule {}
