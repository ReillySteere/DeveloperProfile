import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from './blog.entity';

export interface IBlogRepository {
  findAll(): Promise<Partial<BlogPost>[]>;
  findBySlug(slug: string): Promise<BlogPost | null>;
  update(slug: string, post: Partial<BlogPost>): Promise<BlogPost | null>;
}

@Injectable()
export class BlogRepository implements IBlogRepository {
  readonly #repo: Repository<BlogPost>;

  constructor(
    @InjectRepository(BlogPost)
    repo: Repository<BlogPost>,
  ) {
    this.#repo = repo;
  }

  findAll(): Promise<Partial<BlogPost>[]> {
    return this.#repo.find({
      select: ['id', 'slug', 'title', 'metaDescription', 'publishedAt', 'tags'],
      order: {
        publishedAt: 'DESC',
      },
    });
  }

  findBySlug(slug: string): Promise<BlogPost | null> {
    return this.#repo.findOne({ where: { slug } });
  }

  async update(
    slug: string,
    post: Partial<BlogPost>,
  ): Promise<BlogPost | null> {
    const existing = await this.findBySlug(slug);
    if (!existing) {
      return null;
    }
    const updated = this.#repo.merge(existing, post);
    return this.#repo.save(updated);
  }
}
