import { Global, Module } from '@nestjs/common';
import { AppLoggerService } from './logger.service';
import { LOGGER_TOKENS } from './tokens';

@Global()
@Module({
  providers: [
    AppLoggerService,
    {
      provide: LOGGER_TOKENS.LoggerService,
      useExisting: AppLoggerService,
    },
  ],
  exports: [AppLoggerService, LOGGER_TOKENS.LoggerService],
})
export class LoggerModule {}
