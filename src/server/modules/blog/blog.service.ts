import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BlogPost } from './blog.entity';
import { IBlogRepository } from './blog.repository';
import TOKENS from './tokens';

export interface IBlogService {
  findAll(): Promise<Partial<BlogPost>[]>;
  findBySlug(slug: string): Promise<BlogPost>;
}

@Injectable()
export class BlogService implements IBlogService {
  readonly #blogRepository: IBlogRepository;

  constructor(@Inject(TOKENS.BlogRepository) blogRepository: IBlogRepository) {
    this.#blogRepository = blogRepository;
  }

  async findAll(): Promise<Partial<BlogPost>[]> {
    return this.#blogRepository.findAll();
  }

  async findBySlug(slug: string): Promise<BlogPost> {
    const post = await this.#blogRepository.findBySlug(slug);
    if (!post) {
      throw new NotFoundException(`Blog post with slug "${slug}" not found`);
    }
    return post;
  }
}
