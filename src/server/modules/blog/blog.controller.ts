import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Inject,
  Param,
  UseGuards,
} from '@nestjs/common';
import { IBlogService } from './blog.service';
import TOKENS from './tokens';
import { BlogPost } from 'shared/types';
import { UpdateBlogPostDto } from './dto/updateBlogPost.dto';
import { CreateBlogPostDto } from './dto/createBlogPost.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuardAdapter } from 'server/shared/adapters/auth';

@ApiTags('Blog')
@Controller('api/blog')
export class BlogController {
  readonly #blogService: IBlogService;

  constructor(
    @Inject(TOKENS.BlogService)
    blogService: IBlogService,
  ) {
    this.#blogService = blogService;
  }
  @ApiOperation({ summary: 'Retrieve all blog posts' })
  @ApiResponse({
    status: 200,
    description: 'List of all blog posts',
  })
  @Get()
  findAll(): Promise<Partial<BlogPost>[]> {
    return this.#blogService.findAll();
  }

  @ApiOperation({ summary: 'Retrieve a single blog post by slug' })
  @ApiParam({
    name: 'slug',
    type: 'string',
    description: 'Slug of the blog post',
    example: 'my-first-blog-post',
  })
  @ApiResponse({
    status: 200,
    description: 'The requested blog post',
  })
  @ApiResponse({
    status: 404,
    description: 'Blog post not found',
  })
  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<BlogPost> {
    return this.#blogService.findBySlug(slug);
  }

  @ApiOperation({ summary: 'Create a new blog post' })
  @ApiBody({
    type: CreateBlogPostDto,
    description: 'Data for the new blog post',
  })
  @ApiResponse({
    status: 201,
    description: 'The created blog post',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuardAdapter)
  @Post()
  create(@Body() createBlogPostDto: CreateBlogPostDto): Promise<BlogPost> {
    return this.#blogService.create(createBlogPostDto);
  }

  @ApiOperation({ summary: 'Update an existing blog post' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID of the blog post to update',
    example: 'uuid-1234',
  })
  @ApiBody({
    type: UpdateBlogPostDto,
    description: 'Data using to update the blog post',
  })
  @ApiResponse({
    status: 200,
    description: 'The updated blog post',
  })
  @ApiResponse({
    status: 404,
    description: 'Blog post to update not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuardAdapter)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateBlogPostDto: UpdateBlogPostDto,
  ): Promise<BlogPost> {
    return this.#blogService.update(id, updateBlogPostDto);
  }
}
