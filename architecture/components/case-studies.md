# Case Studies Feature Architecture

## Overview

The Case Studies feature transforms project summaries into rich, narrative case studies that showcase the Problem → Solution → Outcome journey. It provides detailed technical storytelling with metrics, implementation phases, code comparisons, and architecture diagrams.

Case studies are thinly coupled to projects: each case study references a project via foreign key but extends it with narrative content that doesn't belong in the core project entity.

## Data Flow

### 1. Database Layer (SQLite)

- **Entity:** `CaseStudy` (`src/server/modules/case-studies/case-study.entity.ts`)
- **Schema:**
  - `id`: UUID
  - `slug`: String (unique, URL-friendly identifier)
  - `projectId`: UUID (foreign key to Project)
  - `project`: Project (eager-loaded relationship, see ADR-023)
  - **Problem Section:**
    - `problemContext`: Text (Markdown)
    - `challenges`: JSON array of strings
  - **Solution Section:**
    - `approach`: Text (Markdown)
    - `phases`: JSON array of `CaseStudyPhase` objects
    - `keyDecisions`: JSON array of strings
  - **Outcome Section:**
    - `outcomeSummary`: Text (Markdown)
    - `metrics`: JSON array of `CaseStudyMetric` objects
    - `learnings`: JSON array of strings
  - **Rich Content (optional):**
    - `diagrams`: JSON array of `CaseStudyDiagram` objects
    - `codeComparisons`: JSON array of `CodeComparison` objects
  - `published`: Boolean (default: false)
  - `createdAt`, `updatedAt`: Timestamps

### 2. Backend API (NestJS)

- **Module:** `CaseStudyModule`
- **Controller:** `CaseStudyController` (`/api/case-studies`)
  - `GET /`: Returns all **published** case studies with project data
  - `GET /:slug`: Returns full case study by slug
  - `GET /project/:projectId`: Returns case study for a specific project
  - `POST /`: Creates a new case study (Authenticated)
  - `PUT /:id`: Updates an existing case study (Authenticated)
  - `DELETE /:id`: Deletes a case study (Authenticated)
- **Service:** `CaseStudyService`
  - Handles business logic and error handling (`NotFoundException` for invalid slugs/IDs)
  - Emits domain events on mutations (see Event-Driven Architecture below)
- **Repository:** `CaseStudyRepository`
  - Encapsulates TypeORM operations with clean interface

### 3. Event-Driven Architecture

Following ADR-011, the case studies module emits domain events:

- **Events:** `src/server/modules/case-studies/events.ts`
  - `case-study.created`: Emitted after successful creation
  - `case-study.updated`: Emitted after successful update
  - `case-study.deleted`: Emitted after successful deletion

```typescript
import { CASE_STUDY_EVENTS } from './events';

// In service
this.eventEmitter.emit(CASE_STUDY_EVENTS.CREATED, caseStudy);
```

### 4. Frontend Data Fetching (TanStack Query)

- **Hooks:** `src/ui/containers/case-studies/hooks/useCaseStudies.ts`
  - `useCaseStudies()`: Fetches list from `/api/case-studies`
  - `useCaseStudy(slug)`: Fetches single case study by slug
  - `useCreateCaseStudy()`: Mutation for creation
  - `useUpdateCaseStudy()`: Mutation for updates
  - `useDeleteCaseStudy()`: Mutation for deletion
- **State Management:** Uses `QueryState` component for loading/error/empty states

### 5. User Interface (React)

- **Containers:**
  - `CaseStudiesContainer`: List view with cards showing project title, role, technologies
  - `CaseStudyDetailContainer`: Full narrative view with sections

- **Components:**
  - `CaseStudyCard`: Preview card linking to detail view
  - `PhasesTimeline`: Visual timeline of implementation phases
  - `MetricsGrid`: Before/after metrics display
  - `DiagramViewer`: Renders Mermaid diagrams and images
  - `CodeComparisonViewer`: Side-by-side code before/after

- **Views:**
  - `CaseStudyEditor`: Form for creating/editing case studies (authenticated)

- **Styling:** `case-studies.module.scss` with CSS variable tokens

## Key Dependencies

- **Backend:**
  - `typeorm`, `@nestjs/typeorm`: Database operations
  - `@nestjs/event-emitter`: Domain event emission
  - `class-validator`, `class-transformer`: DTO validation
- **Frontend:**
  - `@tanstack/react-query`: Data fetching
  - `react-markdown`: Markdown rendering
  - `mermaid`: Diagram generation
  - `react-syntax-highlighter`: Code block styling

## Testing Strategy

- **Backend Integration:** `case-study.integration.test.ts`
  - Tests CRUD operations through controller
  - Verifies project relationship loading
  - Tests 404 handling for invalid slugs
  - Uses `:memory:` SQLite database

- **Backend Unit Tests:**
  - `case-study.service.test.ts`: Service logic with mocked repository
  - `case-study.repository.test.ts`: Repository operations
  - `create-case-study.dto.test.ts`: DTO validation

- **Frontend Integration:** `case-studies.container.test.tsx`
  - Uses MSW handlers for API mocking
  - Tests list view, detail view, empty states, error states
  - Tests authenticated actions (create/edit buttons)
  - Covers `DiagramViewer` and `CodeComparisonViewer` rendering

## Relationship to Projects

Case studies have a **thin coupling** to projects (see ADR-023):

```
┌─────────────────┐         ┌─────────────────┐
│    Project      │◄────────│   CaseStudy     │
│                 │  FK     │                 │
│ - title         │         │ - projectId     │
│ - role          │         │ - project (ref) │
│ - technologies  │         │ - narrative...  │
└─────────────────┘         └─────────────────┘
```

- **Project → CaseStudy**: No back-reference (unidirectional)
- **CaseStudy → Project**: Foreign key + eager-loaded relationship
- **Rationale**: Case studies need project context for display; projects don't need to know about case studies

## Future Considerations

1. **Project card enhancement**: Add "View Case Study" button on project cards (requires `findByProjectId` endpoint)
2. **Case study routing from projects**: `/projects/:id/case-study` redirect
3. **Rich text editor**: Replace textarea with WYSIWYG for markdown editing
