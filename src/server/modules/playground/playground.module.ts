import { Module } from '@nestjs/common';
import { PlaygroundController } from './playground.controller';
import { PlaygroundService } from './playground.service';
import TOKENS from './tokens';

@Module({
  controllers: [PlaygroundController],
  providers: [
    {
      provide: TOKENS.PlaygroundService,
      useClass: PlaygroundService,
    },
  ],
})
export class PlaygroundModule {}
