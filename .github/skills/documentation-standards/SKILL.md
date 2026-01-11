---
name: documentation-standards
description: Guidelines for maintaining project documentation, including code comments, ADRs, and API docs.
---

# Documentation Standards

Use this skill when writing code, adding features, or making architectural changes.

## 1. Code-Level Documentation

### Server (NestJS)

- **Controllers**: MUST use Swagger decorators (`@ApiOperation`, `@ApiResponse`, `@ApiTags`).
  ```typescript
  @ApiOperation({ summary: 'Creates a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully.' })
  ```
- **Services/Utils**: Use JSDoc for public methods, explaining `params`, `returns`, and edge cases.

### UI (React)

- **Components**: Use JSDoc for complex logic or shared components. Prop types are documented via TypeScript interfaces.
- **Hooks**: Explain the hook's purpose and return values.

## 2. Architectural Documentation (`/architecture`)

### Architecture Decision Records (ADRs)

- **When to write**: Whenever a significant architectural choice is made (e.g., choice of library, pattern change).
- **Format**: Markdown file in `architecture/decisions/`.
- **Naming**: `ADR-XXX-short-title.md` (e.g., `ADR-004-use-tanstack-query.md`).

### Component Documentation

- **Location**: `architecture/components/`.
- **Content**: High-level overview of complex feature modules (e.g., `blog.md`).

## 3. General

- **README.md**: Each major directory (e.g., `src/server/modules`) should ideally have a brief README if the logic is non-standard.
