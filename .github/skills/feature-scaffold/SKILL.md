---
name: feature-scaffold
description: Generate boilerplate for new features following the BFF/Modular Monolith pattern.
---

# Feature Scaffolding

Use this skill when you need to create a new feature set (UI + Server).

## Instructions

1.  **Run the Scaffold Script**
    The script `scaffold-feature.js` in this directory can generate the folder structure for you.

    Usage:

    ```bash
    node .github/skills/feature-scaffold/scaffold-feature.js <feature-name>
    ```

2.  **Generated Structure**

    **Server**: `src/server/modules/<feature>`
    - `<feature>.module.ts`: NestJS Module.
    - `<feature>.controller.ts`: API Endpoints.
    - `<feature>.service.ts`: Business Logic.
    - `<feature>.service.spec.ts`: Unit test (Manual DI).

    **UI**: `src/ui/containers/<feature>`
    - `<feature>.container.tsx`: Main route container.
    - `hooks/use<Feature>.ts`: Data fetching hook.
    - `components/`: Folder for sub-components.

3.  **Post-Scaffold Checklist**
    - [ ] Add the new Module to `app.module.ts` imports.
    - [ ] Add the new UI route to the TanStack router configuration (or let file-based routing handle it if configured).
    - [ ] Add types to `src/shared/types/<feature>.ts`.

## Example: Scaffolding a "Comments" Feature

### Step 1: Run the Script

```bash
node .github/skills/feature-scaffold/scaffold-feature.js comments
```

**Output:**

```
Scaffolding feature: comments
PascalCase: Comments
camelCase: comments
Created: src/server/modules/comments
Created: src/server/modules/comments/tokens.ts
Created: src/server/modules/comments/comments.service.ts
Created: src/server/modules/comments/comments.controller.ts
Created: src/server/modules/comments/comments.module.ts
Created: src/ui/containers/comments
Created: src/ui/containers/comments/comments.container.tsx
...
```

### Step 2: Add Shared Types

Create `src/shared/types/comments.ts`:

```typescript
export interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface CreateCommentDto {
  postId: string;
  content: string;
}
```

### Step 3: Register the Module

Edit `src/server/app.module.ts`:

```typescript
import { CommentsModule } from './modules/comments/comments.module';

@Module({
  imports: [
    // ... existing modules
    CommentsModule, // ← Add this
  ],
})
export class AppModule {}
```

### Step 4: Add the Route

Create `src/ui/shared/routes/comments.tsx` (if not using file-based routing):

```typescript
import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { CommentsContainer } from 'ui/containers/comments/comments.container';

export const commentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/comments',
  component: CommentsContainer,
});
```

### Step 5: Implement Business Logic

Update the generated service with actual logic:

```typescript
// src/server/modules/comments/comments.service.ts
@Injectable()
export class CommentsService implements ICommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
  ) {}

  async findByPostId(postId: string): Promise<Comment[]> {
    return this.repository.find({
      where: { postId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateCommentDto, userId: string): Promise<Comment> {
    const comment = this.repository.create({
      ...dto,
      author: userId,
    });
    return this.repository.save(comment);
  }
}
```

### Step 6: Implement the UI Hook

Update the generated hook:

```typescript
// src/ui/containers/comments/hooks/useComments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Comment, CreateCommentDto } from 'shared/types/comments';

const commentKeys = {
  byPost: (postId: string) => ['comments', postId] as const,
};

export function useComments(postId: string) {
  return useQuery({
    queryKey: commentKeys.byPost(postId),
    queryFn: () =>
      axios
        .get<Comment[]>(`/api/comments?postId=${postId}`)
        .then((r) => r.data),
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCommentDto) =>
      axios.post<Comment>('/api/comments', dto).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) });
    },
  });
}
```

### Step 7: Write Tests

Create integration test for the container:

```typescript
// src/ui/containers/comments/comments.container.test.tsx
import { render, screen, waitFor } from 'test-utils';
import axios from 'axios';
import { CommentsContainer } from './comments.container';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('CommentsContainer', () => {
  it('should display comments for a post', async () => {
    mockAxios.get.mockResolvedValue({
      data: [
        { id: '1', content: 'Great post!', author: 'user1' },
      ],
    });

    render(<CommentsContainer postId="post-123" />);

    await waitFor(() => {
      expect(screen.getByText('Great post!')).toBeInTheDocument();
    });
  });

  it('should show empty state when no comments', async () => {
    mockAxios.get.mockResolvedValue({ data: [] });

    render(<CommentsContainer postId="post-123" />);

    await waitFor(() => {
      expect(screen.getByText(/no comments/i)).toBeInTheDocument();
    });
  });
});
```

## Common Customizations

### Adding Authentication Guard

```typescript
// In the controller
import { AuthGuardAdapter } from '../../shared/adapters/auth';

@Post()
@UseGuards(AuthGuardAdapter)  // ← Add this (see ADR-005 for hexagonal architecture)
@ApiOperation({ summary: 'Create a comment' })
create(@Body() dto: CreateCommentDto, @Req() req: Request) {
  return this.service.create(dto, req.user.id);
}
```

### Adding Validation

```typescript
// src/server/modules/comments/dto/create-comment.dto.ts
import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  postId: string;

  @IsString()
  @MinLength(1)
  content: string;
}
```

### Adding Event-Driven Features

When a feature needs to emit or consume events:

1. **Create an events file** with event name constants:

```typescript
// src/server/modules/comments/events.ts
export const CommentEvents = {
  CREATED: 'comment.created',
  DELETED: 'comment.deleted',
} as const;
```

2. **Emit events from the service** (even if no listeners exist yet):

```typescript
// src/server/modules/comments/comments.service.ts
import { EventEmitter2 } from '@nestjs/event-emitter';
import { COMMENT_EVENTS } from './events';

@Injectable()
export class CommentsService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async create(dto: CreateCommentDto): Promise<Comment> {
    const comment = await this.repository.save(dto);
    this.eventEmitter.emit(COMMENT_EVENTS.CREATED, comment);
    return comment;
  }
}
```

3. **Consume events via SSE** (for real-time updates):

```typescript
// src/server/modules/comments/comments.controller.ts
import { fromEvent } from 'rxjs';
import { COMMENT_EVENTS } from './events';

@Sse('stream')
streamComments(): Observable<MessageEvent> {
  // Note: Do NOT use explicit type parameters with fromEvent (deprecated in RxJS v8)
  // Instead, use type assertions in the callback
  return fromEvent(this.eventEmitter, COMMENT_EVENTS.CREATED).pipe(
    map((comment) => ({ data: comment as Comment })),
  );
}
```

### Using the Logger Service

**NEVER use `console.log/warn/error`** in server code. Instead, inject `LoggerService`:

```typescript
// src/server/modules/comments/comments.service.ts
import { LoggerService } from '../../shared/adapters/logger';

@Injectable()
export class CommentsService {
  readonly #logger: LoggerService;

  constructor(logger: LoggerService) {
    this.#logger = logger;
    this.#logger.setContext(CommentsService.name);
  }

  async create(dto: CreateCommentDto): Promise<Comment> {
    this.#logger.log(`Creating comment for post ${dto.postId}`);
    // ...
  }
}
```

### Styling with CSS Tokens

**ALWAYS use CSS variables from `src/ui/shared/styles/tokens.css`** when writing styles. Never use hardcoded color values, spacing, or other design tokens.

#### Available Token Categories

| Category            | Examples                                                     | Usage                      |
| ------------------- | ------------------------------------------------------------ | -------------------------- |
| **Colors (Slate)**  | `--color-slate-50` to `--color-slate-950`                    | Raw palette values         |
| **Colors (Indigo)** | `--color-indigo-50` to `--color-indigo-950`                  | Primary accent palette     |
| **Semantic BG**     | `--bg-app`, `--bg-surface`, `--bg-surface-hover`             | Use these for backgrounds  |
| **Semantic Text**   | `--text-primary`, `--text-secondary`, `--text-tertiary`      | Use these for text colors  |
| **Borders**         | `--border-default`, `--border-hover`                         | Use for all borders        |
| **Primary**         | `--primary-default`, `--primary-hover`, `--primary-active`   | Buttons, links, accents    |
| **Spacing**         | `--space-1` (0.25rem) to `--space-16` (4rem)                 | Margins, padding, gaps     |
| **Radius**          | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full` | Border radius              |
| **Shadows**         | `--shadow-sm`, `--shadow-md`, `--shadow-lg`                  | Box shadows                |
| **Transitions**     | `--transition-base`                                          | Standard transition timing |
| **Layout**          | `--content-width`                                            | Max content width          |

#### Example SCSS Module

```scss
// src/ui/containers/comments/comments.module.scss
.container {
  max-width: var(--content-width);
  padding: var(--space-4);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}

.title {
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.subtitle {
  color: var(--text-secondary);
}

.button {
  background: var(--primary-default);
  color: var(--text-inverse);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  transition: var(--transition-base);

  &:hover {
    background: var(--primary-hover);
  }

  &:active {
    background: var(--primary-active);
  }
}

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);

  &:hover {
    border-color: var(--border-hover);
    box-shadow: var(--shadow-md);
  }
}
```

#### ❌ Don't Do This

```scss
// BAD - hardcoded values
.container {
  background: #ffffff; // ❌ Use var(--bg-surface)
  color: #1e293b; // ❌ Use var(--text-primary)
  padding: 16px; // ❌ Use var(--space-4)
  border-radius: 8px; // ❌ Use var(--radius-lg)
  border: 1px solid #e2e8f0; // ❌ Use var(--border-default)
}
```

#### ✅ Do This

```scss
// GOOD - using tokens
.container {
  background: var(--bg-surface);
  color: var(--text-primary);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
}
```

#### Dark Mode Support

Tokens automatically switch values for dark mode via `[data-theme='dark']`. Using semantic tokens (like `--bg-surface` instead of `--color-slate-50`) ensures your component works in both modes without additional CSS.
