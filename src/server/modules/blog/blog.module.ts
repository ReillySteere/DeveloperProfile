import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogRepository } from './blog.repository';
import { BlogPost } from './blog.entity';
import TOKENS from './tokens';
import { AuthModule } from 'server/shared/modules/auth';
import {
  AuthGuardAdapter,
  AUTH_ADAPTER_TOKENS,
} from 'server/shared/adapters/auth';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost]), AuthModule],
  controllers: [BlogController],
  providers: [
    {
      provide: TOKENS.BlogService,
      useClass: BlogService,
    },
    {
      provide: TOKENS.BlogRepository,
      useClass: BlogRepository,
    },
    {
      provide: AUTH_ADAPTER_TOKENS.AuthGuard,
      useClass: AuthGuardAdapter,
    },
    AuthGuardAdapter,
  ],
  exports: [TOKENS.BlogService],
})
export class BlogModule {}
