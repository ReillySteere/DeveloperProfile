import { Controller, Get, Param } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogPost } from './blog.entity';

@Controller('api/blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  findAll(): Promise<Partial<BlogPost>[]> {
    return this.blogService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<BlogPost> {
    return this.blogService.findBySlug(slug);
  }
}
