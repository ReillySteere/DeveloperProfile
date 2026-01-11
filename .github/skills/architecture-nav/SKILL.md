---
name: architecture-nav
description: Understand the Modular Monolith structure, find feature code, and resolve routes.
---

# Architecture Navigation

Use this skill when you need to locate code, understand the separation of concerns, or trace a route.

## 1. Project Structure

The project is a **Modular Monolith** with a strictly separated Frontend and Backend in a single repo.

- **Frontend**: `src/ui` (React 19, TanStack Router)
- **Backend**: `src/server` (NestJS, TypeORM, SQLite)
- **Shared**: `src/shared` (Types used by both)

## 2. Feature Mapping

Features are vertical slices split across the two main directories.

| Feature Area | UI Path | Server Path |
|Details|---|---|
| **Blog** | `src/ui/containers/blog/` | `src/server/modules/blog/` |
| **Experience** | `src/ui/containers/experience/` | `src/server/modules/experience/` |
| **Auth** | `src/ui/signin/` | `src/server/auth/` |

## 3. Route Resolution

To find the code for a URL:

### Frontend Routes (TanStack Router)

Check `src/ui/routeTree.gen.ts` to see the generated tree, but look for source files in `src/ui/containers/<feature>`.

- URL `/blog` -> Likely `src/ui/containers/blog/blog.container.tsx`

### Backend Routes (NestJS)

API routes are prefixed with `/api`.

- URL `/api/posts` -> Look for `@Controller('posts')` in `src/server/modules`.
- Global prefix is set in `main.ts`.

## 4. Dependency Rules

- **Strict**: `src/ui` CANNOT import from `src/server`.
- **Strict**: `src/server` CANNOT import from `src/ui`.
- **Allowed**: Both can import from `src/shared`.
