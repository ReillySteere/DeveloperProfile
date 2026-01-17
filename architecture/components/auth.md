# Authentication Architecture

## Overview

The Authentication feature provides user registration, login, and route protection using JWT (JSON Web Tokens). It follows a split architecture where the backend handles credential verification and token generation, while the frontend manages token storage and automatic injection.

## Key Design Decision

**Centralized Token Injection**: The frontend uses a global Axios interceptor to automatically attach JWT tokens to all outgoing requests. This means individual hooks and components **should never manually add Authorization headers**.

See [ADR-003-centralized-axios-interceptors.md](../decisions/ADR-003-centralized-axios-interceptors.md) for the rationale.

## Data Flow

```
┌─────────────┐     POST /api/auth/login     ┌─────────────┐
│   Frontend  │ ───────────────────────────► │   Backend   │
│  (React)    │                              │  (NestJS)   │
│             │ ◄─────────────────────────── │             │
│             │     { access_token: JWT }    │             │
└─────────────┘                              └─────────────┘
      │                                            │
      │ Store in Zustand                           │ Verify with
      │ (persisted to localStorage)                │ Passport JWT
      ▼                                            ▼
┌─────────────┐                              ┌─────────────┐
│ AuthStore   │                              │ JwtStrategy │
│ useAuthStore│                              │ JwtAuthGuard│
└─────────────┘                              └─────────────┘
      │
      │ Inject token via
      │ Axios interceptor
      ▼
┌─────────────────────────────────────────────────────────┐
│                   AuthInterceptor                        │
│  • Request: Adds Authorization header automatically      │
│  • Response: Handles 401 → logout + show modal          │
└─────────────────────────────────────────────────────────┘
```

## Backend (`src/server/shared/modules/auth/`)

### Module Structure

| File                 | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `auth.module.ts`     | NestJS module registration                 |
| `auth.controller.ts` | API endpoints (`/api/auth/*`)              |
| `auth.service.ts`    | Business logic (register, login, validate) |
| `user.entity.ts`     | TypeORM entity for users                   |
| `jwt.strategy.ts`    | Passport JWT strategy                      |
| `jwt-auth.guard.ts`  | Guard for protected routes                 |
| `auth.dto.ts`        | DTOs for login/register requests           |
| `tokens.ts`          | Injection tokens                           |

### API Endpoints

| Method | Endpoint             | Purpose               | Auth Required |
| ------ | -------------------- | --------------------- | ------------- |
| POST   | `/api/auth/register` | Create new user       | No            |
| POST   | `/api/auth/login`    | Authenticate, get JWT | No            |

### Protecting Routes

Use the `JwtAuthGuard` to protect routes:

```typescript
import { JwtAuthGuard } from '../../shared/modules/auth/jwt-auth.guard';

@Controller('api/blog')
export class BlogController {
  @Post()
  @UseGuards(JwtAuthGuard) // ← Requires valid JWT
  create(@Body() dto: CreateBlogPostDto) {
    return this.service.create(dto);
  }
}
```

### Configuration

Requires environment variable:

```bash
JWT_AUTH_SECRET=your-secret-key
```

## Frontend (`src/ui/shared/`)

### Components & Hooks

| File                          | Purpose                           |
| ----------------------------- | --------------------------------- |
| `hooks/useAuthStore.ts`       | Zustand store for auth state      |
| `hooks/useAuth.ts`            | Convenience hook for auth actions |
| `components/AuthInterceptor/` | Global Axios interceptor setup    |
| `components/SignIn/`          | Login modal and button components |

### AuthStore (Zustand)

The `useAuthStore` manages:

- `isAuthenticated`: Boolean login state
- `token`: JWT string (persisted to localStorage)
- `user`: User object with username
- `isLoginModalOpen`: Modal visibility state
- `login()`: Set authenticated state
- `logout()`: Clear auth state
- `openLoginModal()`: Show login modal with optional message

### AuthInterceptor

**Request Interceptor**: Automatically adds `Authorization: Bearer <token>` to all Axios requests if a token exists.

**Response Interceptor**: Catches 401 responses, logs the user out, and shows the login modal with an expiration message.

**Usage**: Mounted once at the app root level.

```tsx
// In app root
<AuthInterceptor />
```

### Important: Don't Add Headers Manually

❌ **Wrong:**

```typescript
const response = await axios.get('/api/blog', {
  headers: { Authorization: `Bearer ${token}` }, // Don't do this!
});
```

✅ **Correct:**

```typescript
const response = await axios.get('/api/blog'); // Token added automatically
```

## Testing

### Backend Tests

- Integration tests: `auth.integration.test.ts`, `auth-failure.integration.test.ts`
- Test protected endpoints with and without valid tokens

### Frontend Tests

- Mock `useAuthStore` to control authentication state
- Don't mock the `AuthInterceptor` in tests - mock `axios` instead

```typescript
jest.mock('ui/shared/hooks/useAuthStore');
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

mockUseAuthStore.mockReturnValue({
  isAuthenticated: true,
  token: 'mock-token',
  // ...
});
```

## Related Files

- Backend: `src/server/shared/modules/auth/`
- Frontend Store: `src/ui/shared/hooks/useAuthStore.ts`
- Frontend Interceptor: `src/ui/shared/components/AuthInterceptor/`
- SignIn Components: `src/ui/shared/components/SignIn/`
