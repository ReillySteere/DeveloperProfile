---
name: api-design
description: Design RESTful API endpoints following project conventions including Swagger, guards, and error handling.
---

# API Design

Use this skill when creating new API endpoints or reviewing existing API design.

## 1. RESTful Conventions

### URL Structure

All API routes use the `/api` prefix:

```
/api/<resource>           # Collection
/api/<resource>/:id       # Single item by ID
/api/<resource>/:slug     # Single item by slug (for SEO-friendly URLs)
```

### HTTP Methods

| Method | Purpose           | Example                | Response Code |
| ------ | ----------------- | ---------------------- | ------------- |
| GET    | Retrieve resource | `GET /api/blog`        | 200           |
| POST   | Create resource   | `POST /api/blog`       | 201           |
| PUT    | Update resource   | `PUT /api/blog/:id`    | 200           |
| PATCH  | Partial update    | `PATCH /api/blog/:id`  | 200           |
| DELETE | Delete resource   | `DELETE /api/blog/:id` | 204           |

### Naming Conventions

- Use **plural nouns** for resources: `/api/posts`, not `/api/post`
- Use **kebab-case** for multi-word resources: `/api/blog-posts`
- Nest sub-resources: `/api/posts/:postId/comments`

## 2. Controller Structure

### Basic Controller Template

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuardAdapter } from '../../shared/adapters/auth';

@ApiTags('Blog')
@Controller('api/blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @ApiOperation({ summary: 'Get all blog posts' })
  @ApiResponse({ status: 200, description: 'Returns all blog posts' })
  findAll() {
    return this.blogService.findAll();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a blog post by slug' })
  @ApiResponse({ status: 200, description: 'Returns the blog post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Post()
  @UseGuards(AuthGuardAdapter)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new blog post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() dto: CreateBlogPostDto) {
    return this.blogService.create(dto);
  }
}
```

## 3. Required Swagger Decorators

Every endpoint MUST have these decorators:

### Class Level

| Decorator     | Purpose             | Example                   |
| ------------- | ------------------- | ------------------------- |
| `@ApiTags`    | Group in Swagger UI | `@ApiTags('Blog')`        |
| `@Controller` | Define route prefix | `@Controller('api/blog')` |

### Method Level

| Decorator        | Purpose                     | Required   |
| ---------------- | --------------------------- | ---------- |
| `@ApiOperation`  | Describe what endpoint does | ✅ Yes     |
| `@ApiResponse`   | Document response codes     | ✅ Yes     |
| `@ApiBearerAuth` | Mark as requiring auth      | If guarded |

### Example: Complete Swagger Documentation

```typescript
@Post()
@UseGuards(AuthGuardAdapter)
@ApiBearerAuth()
@ApiOperation({
  summary: 'Create a new blog post',
  description: 'Creates a new blog post. Requires authentication.',
})
@ApiResponse({
  status: 201,
  description: 'The blog post has been created successfully.',
  type: BlogPost,
})
@ApiResponse({
  status: 400,
  description: 'Invalid input data.',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized - valid JWT token required.',
})
create(@Body() dto: CreateBlogPostDto): Promise<BlogPost> {
  return this.blogService.create(dto);
}
```

## 4. Authentication & Guards

### Protecting Routes

Use `AuthGuardAdapter` for routes requiring authentication (see ADR-005 for hexagonal architecture details):

```typescript
import { AuthGuardAdapter } from '../../shared/adapters/auth';

// Protect single route
@Post()
@UseGuards(AuthGuardAdapter)
create(@Body() dto: CreateDto) { ... }

// Protect entire controller
@UseGuards(AuthGuardAdapter)
@Controller('api/admin')
export class AdminController { ... }
```

### Public vs Protected Endpoints

| Action        | Auth Required | Guard              |
| ------------- | ------------- | ------------------ |
| Read (GET)    | Usually No    | None               |
| Create (POST) | Usually Yes   | `AuthGuardAdapter` |
| Update (PUT)  | Usually Yes   | `AuthGuardAdapter` |
| Delete        | Usually Yes   | `AuthGuardAdapter` |

## 5. Error Handling

### Standard Exception Classes

Use NestJS built-in exceptions for consistent error responses:

```typescript
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

// 404 - Resource not found
throw new NotFoundException(`Post with slug "${slug}" not found`);

// 400 - Invalid input
throw new BadRequestException('Title is required');

// 401 - Not authenticated
throw new UnauthorizedException('Valid token required');

// 403 - Authenticated but not allowed
throw new ForbiddenException('You cannot edit this post');

// 409 - Conflict (e.g., duplicate)
throw new ConflictException('A post with this slug already exists');
```

### Error Response Format

NestJS automatically formats exceptions as:

```json
{
  "statusCode": 404,
  "message": "Post with slug \"my-post\" not found",
  "error": "Not Found"
}
```

## 6. DTOs (Data Transfer Objects)

### Location

DTOs live in the module's `dto/` folder:

```
src/server/modules/blog/
├── dto/
│   ├── createBlogPost.dto.ts
│   └── updateBlogPost.dto.ts
├── blog.controller.ts
├── blog.service.ts
└── blog.module.ts
```

### DTO Template with Validation

```typescript
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBlogPostDto {
  @ApiProperty({ description: 'The title of the blog post' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'URL-friendly identifier' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: 'The main content in Markdown' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Tags for categorization' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
```

### Partial DTOs for Updates

Use `PartialType` to make all fields optional for updates:

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateBlogPostDto } from './createBlogPost.dto';

export class UpdateBlogPostDto extends PartialType(CreateBlogPostDto) {}
```

## 7. Response Optimization

### List Endpoints - Select Only Needed Fields

For list endpoints, avoid returning heavy fields:

```typescript
// In service
async findAll(): Promise<BlogPostSummary[]> {
  return this.repository.find({
    select: ['id', 'slug', 'title', 'metaDescription', 'publishedAt', 'tags'],
    order: { publishedAt: 'DESC' },
  });
}
```

### Detail Endpoints - Return Full Object

```typescript
async findBySlug(slug: string): Promise<BlogPost> {
  const post = await this.repository.findOne({ where: { slug } });
  if (!post) {
    throw new NotFoundException(`Post with slug "${slug}" not found`);
  }
  return post;
}
```

## 8. Checklist for New Endpoints

When adding a new endpoint:

- [ ] Controller has `@ApiTags` decorator
- [ ] Endpoint has `@ApiOperation` with summary
- [ ] Endpoint has `@ApiResponse` for all possible status codes
- [ ] Protected endpoints have `@UseGuards(AuthGuardAdapter)` and `@ApiBearerAuth`
- [ ] Request body validated with DTO
- [ ] DTO has `@ApiProperty` decorators for Swagger
- [ ] Service throws appropriate exceptions (404, 400, etc.)
- [ ] Integration test covers happy path and error cases
