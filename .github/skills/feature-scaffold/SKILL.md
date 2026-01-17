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

    **UI**: `src/ui/<feature>`
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
@Post()
@UseGuards(JwtAuthGuard)  // ← Add this
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
