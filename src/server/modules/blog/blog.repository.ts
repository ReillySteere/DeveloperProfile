import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from './blog.entity';

export interface IBlogRepository {
  findAll(): Promise<Partial<BlogPost>[]>;
  findBySlug(slug: string): Promise<BlogPost | null>;
  findById(id: string): Promise<BlogPost | null>;
  update(id: string, post: Partial<BlogPost>): Promise<BlogPost | null>;
  create(post: Partial<BlogPost>): Promise<BlogPost>;
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

  create(post: Partial<BlogPost>): Promise<BlogPost> {
    const newPost = this.#repo.create(post);
    return this.#repo.save(newPost);
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

  findById(id: string): Promise<BlogPost | null> {
    return this.#repo.findOne({ where: { id } });
  }

  async update(id: string, post: Partial<BlogPost>): Promise<BlogPost | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }
    const updated = this.#repo.merge(existing, post);
    return this.#repo.save(updated);
  }
}
