# Database Schema

This document outlines the database schema used in the application. It is visualized using Mermaid entity-relationship diagrams.

## Overview

- **Database:** SQLite (via `better-sqlite3` driver)
- **ORM:** TypeORM
- **Location:** `data/database.sqlite`
- **Migrations:** `src/server/migrations/`
- **Entities:**
  - `User`: Authentication credentials.
  - `BlogPost`: Blog content and metadata.
  - `Project`: Portfolio project details.
  - `Experience`: Professional work history.

## Schema Management

| Environment     | `synchronize` | `migrationsRun` | Behavior                                 |
| --------------- | ------------- | --------------- | ---------------------------------------- |
| **Development** | `true`        | `false`         | Auto-syncs entity changes to database    |
| **Production**  | `false`       | `true`          | Runs migrations automatically on startup |

### Migration Commands

```bash
npm run migration:generate -- MigrationName  # Generate from entity changes
npm run migration:run                         # Apply pending migrations
npm run migration:revert                      # Revert last migration
npm run migration:show                        # Show migration status
```

See the [database-migration skill](../.github/skills/database-migration/SKILL.md) for detailed instructions.

## Entity Relationship Diagram

```mermaid
erDiagram
    User {
        int userId PK
        string username
        string password "Hashed"
    }

    BlogPost {
        uuid id PK
        string slug "Unique"
        string title
        string metaDescription
        string publishedAt
        json tags
        text content
        datetime createdAt
        datetime updatedAt
    }

    Project {
        uuid id PK
        string title
        text shortDescription
        string role
        json requirements
        json execution
        json results
        json technologies
        string startDate
        string endDate "Nullable"
    }

    Experience {
        uuid id PK
        string company
        string role
        string description
        string startDate
        string endDate "Nullable"
        json bulletPoints
        json tags
    }
```

## Entity Details

### User

Manages authentication credentials.

- **PK**: `userId` (Auto-increment integer)
- `username`: Unique identifier.

### BlogPost

Content for the technical blog.

- **PK**: `id` (UUID)
- `slug`: Human-readable identifier for URLs (e.g., `/blog/my-post`).
- `content`: Markdown text of the post.

### Project

Displays technical projects in the portfolio.

- **PK**: `id` (UUID)
- `execution`, `results`, `requirements`: JSON arrays storing bullet points for the UI.

### Experience

Represents professional career timeline.

- **PK**: `id` (UUID)
- `bulletPoints`: Key achievements or responsibilities as a JSON array.
