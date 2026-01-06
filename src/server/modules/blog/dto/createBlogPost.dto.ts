import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBlogPostDto {
  @ApiProperty({
    description: 'The title of the blog post',
    example: 'My First Blog Post',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The URL slug of the blog post',
    example: 'my-first-blog-post',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'The meta description for SEO',
    example: 'A brief description of my first blog post.',
  })
  @IsString()
  @IsNotEmpty()
  metaDescription: string;

  @ApiProperty({
    description: 'Tags for the blog post',
    example: ['tech', 'personal'],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({
    description: 'The markdown content of the blog post',
    example: '# Hello World\nThis is my first post.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'The publication date',
    example: '2023-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  publishedAt?: string;
}
