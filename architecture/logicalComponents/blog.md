# Blog Feature Architecture

## Overview

The Blog feature is a content publishing system designed to share technical articles, tutorials, and thoughts. It supports rich text formatting via Markdown, code syntax highlighting, and dynamic diagrams using Mermaid. Unlike other features, it utilizes nested routing to handle both the list view and individual post views within the same parent route structure.

## Data Flow

### 1. Database Layer (SQLite)

- **Entity:** `BlogPost` (`src/server/modules/blog/blog.entity.ts`)
- **Schema:**
  - `id`: UUID
  - `slug`: String (Unique identifier for URLs)
  - `title`: String
  - `metaDescription`: String (For SEO and list previews)
  - `publishedAt`: Date string
  - `tags`: JSON array of strings
  - `content`: Text (The main body of the post)
  - `documentContent`: Text (Nullable, reserved for future structured content)
- **Migrations:**
  - `SeedBlog`: Populates initial blog posts.

### 2. Backend API (NestJS)

- **Module:** `BlogModule`
- **Controller:** `BlogController` (`/api/blog`)
  - `GET /`: Returns a list of posts.
    - **Optimization:** Selects only metadata (`id`, `slug`, `title`, `metaDescription`, `publishedAt`, `tags`) to reduce payload size.
    - **Sorting:** Orders by `publishedAt` descending.
  - `GET /:slug`: Returns the full blog post object, including `content`.
- **Service:** `BlogService`
  - Handles retrieval logic and error handling (e.g., `NotFoundException` for invalid slugs).

### 3. Frontend Data Fetching (TanStack Query)

- **Hooks:** `src/ui/blog/hooks/useBlog.ts`
  - `useBlogPosts()`: Fetches the list of posts from `/api/blog`.
  - `useBlogPost(slug)`: Fetches a single post from `/api/blog/:slug`.
- **State Management:** Uses `QueryState` to handle loading, error, and empty states consistently.

### 4. User Interface (React)

- **Routing Strategy (TanStack Router):**
  - **Parent Route:** `/blog`
  - **Child Route:** `/blog/$slug`
  - **Implementation:** `BlogContainer` checks for active child routes.
    - If a child route (`$slug`) is active, it renders the `<Outlet />`.
    - If no child route is active, it renders the `BlogList`.
    - This allows for a clean separation of concerns while maintaining a unified route structure.

- **Containers:**
  - `BlogContainer` (`src/ui/blog/blog.container.tsx`): Manages the list view and routing logic.
  - `BlogPostContainer` (`src/ui/blog/blog-post.container.tsx`): Manages the detail view for a specific post.

- **Key Components:**
  - `BlogList`: Renders a grid/list of `Card` components displaying post summaries.
  - `BlogPost`: Renders the full article.
    - **Markdown Rendering:** Uses `react-markdown` to parse content.
    - **Syntax Highlighting:** Uses `react-syntax-highlighter` (Prism) for code blocks.
    - **Diagrams:** Custom `Mermaid` component renders `mermaid` code blocks as SVG diagrams.

## Key Dependencies

- **Backend:** `typeorm`, `@nestjs/typeorm`
- **Frontend:**
  - `@tanstack/react-query`
  - `react-markdown`: Markdown parsing.
  - `react-syntax-highlighter`: Code styling.
  - `mermaid`: Diagram generation.

## Testing Strategy

- **Backend Integration:** `blog.integration.test.ts`
  - Verifies data seeding.
  - Tests list retrieval (ensuring heavy content fields are excluded).
  - Tests single post retrieval by slug.
- **Frontend Integration:** `blog.container.test.tsx`
  - **Mocking:** Extensive mocking required for `react-markdown`, `mermaid`, and `react-syntax-highlighter` to avoid ESM/CommonJS compatibility issues in the test environment.
  - **Routing Tests:** Verifies that the correct view (List vs. Outlet) is rendered based on the active route.

## Future Roadmap

- **Content Management:** Implementation of an admin interface or CMS integration to allow adding/editing articles without database migrations.
