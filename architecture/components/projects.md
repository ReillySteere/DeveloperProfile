# Projects Feature Architecture

## Overview

The Projects feature showcases a portfolio of technical projects. It provides a detailed view of each project, including the role played, requirements, execution details, results achieved, and technologies used.

## Data Flow

### 1. Database Layer (SQLite)

- **Entity:** `Project` (`src/server/modules/projects/project.entity.ts`)
- **Schema:**
  - `id`: UUID
  - `title`: String
  - `shortDescription`: String
  - `role`: String
  - `requirements`: JSON array of strings
  - `execution`: JSON array of strings
  - `results`: JSON array of strings
  - `technologies`: JSON array of strings
  - `startDate`: Date string
  - `endDate`: Date string (nullable)
- **Migrations:**
  - `SeedProjects`: Populates initial project data.

### 2. Backend API (NestJS)

- **Module:** `ProjectModule`
- **Controller:** `ProjectsController` (`/api/projects`)
  - `GET /`: Returns all projects.
- **Service:** `ProjectsService`
  - Handles business logic and interaction with `ProjectsRepository`.

### 3. Frontend Data Fetching (TanStack Query)

- **Hook:** `useProjects` (`src/ui/containers/projects/hooks/useProjects.ts`)
  - Fetches data from `/api/projects`.
  - Returns `projects`, `isLoading`, `isError`, `error`, `refetch`.
  - Uses `QueryState` component to handle UI states.

### 4. User Interface (React)

- **Page:** `ProjectsContainer` (`src/ui/containers/projects/projects.container.tsx`)
  - **Layout:** Uses `Frame` for consistent page structure.
  - **Container:** Displays a list of `ProjectCard` components.
- **Component:** `ProjectCard`
  - Displays a single project entry.
  - **Animation:** Uses `framer-motion` for entrance animations when scrolling into view.
  - **Styling:** Uses `projects.module.scss` with CSS variables for theming.
  - **Features:**
    - Displays project title, role, and date range.
    - Shows detailed sections for Requirements, Execution, and Results.
    - Lists technologies used as badges.

## Key Dependencies

- **Backend:** `typeorm`, `@nestjs/typeorm`, `sqlite3`
- **Frontend:** `@tanstack/react-query`, `framer-motion`, `lucide-react` (icons)
- **Shared:** `ui/shared/components` (Card, Badge, etc.)

## Testing Strategy

- **Backend Integration:** `project.integration.test.ts` verifies the full flow from Controller to Database using an in-memory SQLite instance.
- **Frontend Integration:** `projects.container.test.ts` tests the UI interactions, loading states, and error handling using mocked axios and `testing-library/react`.
