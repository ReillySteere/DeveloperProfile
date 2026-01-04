import { Controller, Get, Inject, Param } from '@nestjs/common';
import { IBlogService } from './blog.service';
import TOKENS from './tokens';
import { BlogPost } from 'shared/types';

@Controller('api/blog')
export class BlogController {
  readonly #blogService: IBlogService;

  constructor(
    @Inject(TOKENS.BlogService)
    blogService: IBlogService,
  ) {
    this.#blogService = blogService;
  }
  @Get()
  findAll(): Promise<Partial<BlogPost>[]> {
    return this.#blogService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<BlogPost> {
    return this.#blogService.findBySlug(slug);
  }
}
