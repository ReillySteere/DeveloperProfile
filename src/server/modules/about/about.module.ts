import { Module } from '@nestjs/common';
import { AboutController } from './about.controller';
import { AboutService } from './about.service';
import TOKENS from './tokens';

@Module({
  controllers: [AboutController],
  providers: [
    {
      provide: TOKENS.AboutService,
      useClass: AboutService,
    },
  ],
})
export class AboutModule {}
