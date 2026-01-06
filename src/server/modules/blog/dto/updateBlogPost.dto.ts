import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBlogPostDto {
  @ApiProperty({
    description: 'The URL slug of the blog post',
    example: 'my-first-blog-post',
    required: false,
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    description: 'The title of the blog post',
    example: 'My First Blog Post',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Meta description for SEO',
    example: 'This is a short description of the blog post.',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiProperty({
    description: 'Array of tags associated with the post',
    example: ['nestjs', 'typescript'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'The markdown content of the blog post',
    example: '# Hello World\nThis is the content.',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;
}
