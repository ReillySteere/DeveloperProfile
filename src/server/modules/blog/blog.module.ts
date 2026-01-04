import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogRepository } from './blog.repository';
import { BlogPost } from './blog.entity';
import TOKENS from './tokens';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost])],
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
  ],
  exports: [TOKENS.BlogService],
})
export class BlogModule {}
