# Experience Feature Architecture

## Overview

The Experience feature provides a visual timeline of professional history. It is a full-stack feature encompassing database storage, API endpoints, and a rich interactive UI.

## Data Flow

### 1. Database Layer (SQLite)

- **Entity:** `Experience` (`src/server/modules/experience/experience.entity.ts`)
- **Schema:**
  - `id`: UUID
  - `company`: String
  - `role`: String
  - `description`: String
  - `startDate`: Date string
  - `endDate`: Date string (nullable)
  - `bulletPoints`: JSON array of strings
  - `tags`: JSON array of strings
- **Migrations:**
  - `SeedExperience`: Populates initial data.
  - `RemoveDuplicateExperience`: Ensures data integrity by removing duplicates based on role/company/date.

### 2. Backend API (NestJS)

- **Module:** `ExperienceModule`
- **Controller:** `ExperienceController` (`/api/experience`)
  - `GET /`: Returns all experience entries sorted by date.
- **Service:** `ExperienceService`
  - Handles business logic and interaction with `ExperienceRepository`.

### 3. Frontend Data Fetching (TanStack Query)

- **Hook:** `useExperience` (`src/ui/experience/hooks/useExperience.ts`)
  - Fetches data from `/api/experience`.
  - Returns `experiences`, `isLoading`, `isError`, `error`, `refetch`.
  - Uses `QueryState` component to handle UI states.

### 4. User Interface (React)

- **Page:** `ExperiencePage` (`src/ui/experience/components/ExperiencePage.tsx`)
  - **Layout:** Uses `Frame` for consistent page structure.
  - **Scroll Container:** Implements scroll snapping for section-by-section navigation.
  - **Navigation:** "Progress Dots" on the right side allow quick navigation to specific entries.
- **Component:** `ExperienceSection`
  - Displays a single experience entry.
  - **Animation:** Uses `framer-motion` for entrance animations when scrolling into view.
  - **Styling:** Uses `experience.module.scss` with CSS variables for theming.

## Key Dependencies

- **Backend:** `typeorm`, `@nestjs/typeorm`, `sqlite3`
- **Frontend:** `@tanstack/react-query`, `framer-motion`, `lucide-react` (icons)
- **Shared:** `ui/shared/components` (Card, Badge, etc.)

## Testing Strategy

- **Backend Integration:** `experience.integration.test.ts` verifies the full flow from Controller to Database using an in-memory SQLite instance.
- **Frontend Integration:** `experience.container.test.ts` tests the UI interactions, loading states, and error handling using `msw` (or mocked axios) and `testing-library/react`.
