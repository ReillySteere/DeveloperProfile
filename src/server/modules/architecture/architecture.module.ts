import { Module } from '@nestjs/common';
import { ArchitectureController } from './architecture.controller';
import { ArchitectureService } from './architecture.service';
import TOKENS from './tokens';

@Module({
  controllers: [ArchitectureController],
  providers: [
    {
      provide: TOKENS.ArchitectureService,
      useClass: ArchitectureService,
    },
  ],
})
export class ArchitectureModule {}
