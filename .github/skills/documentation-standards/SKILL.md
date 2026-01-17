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

## 4. Documentation Maintenance Checklist

Use this checklist after implementing new features or making significant changes:

### Code Documentation

- [ ] **JSDoc on public methods**: All new public service methods, utilities, and complex functions have JSDoc comments
- [ ] **Component documentation**: Complex shared components have JSDoc explaining purpose and usage
- [ ] **Hook documentation**: Custom hooks explain their purpose, parameters, and return values

### API Documentation

- [ ] **Swagger decorators**: All new controller endpoints have `@ApiOperation`, `@ApiResponse`, `@ApiTags`
- [ ] **DTO documentation**: DTOs use `@ApiProperty` and `@ApiPropertyOptional` decorators
- [ ] **Error responses**: All possible error responses (400, 401, 404, etc.) are documented

### Architectural Documentation

- [ ] **ADR for decisions**: Significant choices (new library, pattern change) have an ADR in `architecture/decisions/`
- [ ] **Component doc**: Complex feature modules have documentation in `architecture/components/`
- [ ] **Shared UI updates**: New shared components are documented in `architecture/components/shared-ui.md`

### Project Documentation

- [ ] **README updates**: Setup changes, new environment variables, or dependency changes reflected
- [ ] **CONTRIBUTING updates**: New workflows or conventions documented
- [ ] **AI instructions**: Changes to patterns or conventions updated in `.github/copilot-instructions.md`

### Cross-Reference Verification

- [ ] **Paths are accurate**: All file paths in documentation match actual project structure
- [ ] **Examples work**: Code examples follow current conventions
- [ ] **Skills reference valid resources**: Any skill or prompt references point to existing files

## 5. ADR Template

When creating a new ADR, use this template:

```markdown
# ADR-XXX: [Short Title]

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-XXX]

## Context

[What is the issue that we're seeing that is motivating this decision?]

## Decision

[What is the change that we're proposing and/or doing?]

## Consequences

### Positive

- [Benefit 1]
- [Benefit 2]

### Negative

- [Drawback 1]
- [Drawback 2]

### Neutral

- [Side effect that is neither positive nor negative]
```
