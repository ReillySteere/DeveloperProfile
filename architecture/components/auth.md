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

## Backend Architecture

The authentication system follows **Hexagonal Architecture** (Ports and Adapters) as defined in [ADR-005](../decisions/ADR-005-hexagonal-architecture-shared-modules.md).

### Structure Overview

```
src/server/
├── shared/
│   ├── ports/
│   │   └── auth.port.ts           # Interface contracts
│   ├── adapters/
│   │   └── auth/
│   │       ├── auth.adapter.ts    # Adapter implementations
│   │       ├── auth.types.ts      # Business-layer types
│   │       └── index.ts
│   └── modules/
│       └── auth/                  # Shared module (internal)
│           ├── auth.module.ts
│           ├── auth.service.ts
│           ├── auth.dto.ts        # ACL DTOs
│           ├── user.entity.ts
│           ├── jwt.strategy.ts
│           ├── jwt-auth.guard.ts
│           ├── tokens.ts
│           └── index.ts           # Public API
└── modules/
    └── auth/                      # Business module
        ├── auth.controller.ts     # API endpoints
        └── auth.module.ts
```

### Shared Module (`src/server/shared/modules/auth/`)

| File                | Purpose                                    | Public API |
| ------------------- | ------------------------------------------ | ---------- |
| `auth.module.ts`    | NestJS module registration                 | ✓          |
| `auth.service.ts`   | Business logic (register, login, validate) | ✗          |
| `auth.dto.ts`       | ACL DTOs for input/output                  | ✓          |
| `user.entity.ts`    | TypeORM entity for users                   | ✗          |
| `jwt.strategy.ts`   | Passport JWT strategy                      | ✗          |
| `jwt-auth.guard.ts` | Guard for protected routes                 | ✗          |
| `tokens.ts`         | Injection tokens (AUTH_TOKENS)             | ✓          |
| `index.ts`          | Public API barrel                          | ✓          |

### Business Module (`src/server/modules/auth/`)

| File                 | Purpose                        |
| -------------------- | ------------------------------ |
| `auth.controller.ts` | API endpoints (`/api/auth/*`)  |
| `auth.module.ts`     | Imports adapter and controller |

### API Endpoints

| Method | Endpoint             | Purpose               | Auth Required |
| ------ | -------------------- | --------------------- | ------------- |
| POST   | `/api/auth/register` | Create new user       | No            |
| POST   | `/api/auth/login`    | Authenticate, get JWT | No            |

### Protecting Routes (Using Adapters)

Use the `AuthGuardAdapter` to protect routes:

```typescript
import { AuthGuardAdapter } from 'server/shared/adapters/auth';

@Controller('api/blog')
export class BlogController {
  @Post()
  @UseGuards(AuthGuardAdapter) // ← Requires valid JWT
  create(@Body() dto: CreateBlogPostDto) {
    return this.service.create(dto);
  }
}
```

**Important:** Do NOT import from `shared/modules/auth/` directly. Always use adapters.

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

- Internal module tests: `src/server/shared/modules/auth/auth.integration.test.ts` (tests `AuthService`, `JwtStrategy`, config validation)
- Consumer API tests: `src/server/modules/auth/auth.integration.test.ts` (tests `AuthController`, guards, adapters)
- Tests cover both valid authentication flows and failure scenarios (invalid tokens, missing tokens)

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

### Backend

- **Shared Module:** `src/server/shared/modules/auth/`
- **Business Controller:** `src/server/modules/auth/`
- **Ports:** `src/server/shared/ports/auth.port.ts`
- **Adapters:** `src/server/shared/adapters/auth/`

### Frontend

- Store: `src/ui/shared/hooks/useAuthStore.ts`
- Interceptor: `src/ui/shared/components/AuthInterceptor/`
- SignIn Components: `src/ui/shared/components/SignIn/`

### ADRs

- [ADR-003: Centralized Axios Interceptors](../decisions/ADR-003-centralized-axios-interceptors.md)
- [ADR-005: Hexagonal Architecture for Shared Modules](../decisions/ADR-005-hexagonal-architecture-shared-modules.md)
