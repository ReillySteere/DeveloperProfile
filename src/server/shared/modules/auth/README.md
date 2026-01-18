# Auth Shared Module

This shared module handles core authentication functionality using JWT (JSON Web Tokens) and Passport.js.

> **Important**: This module follows **Hexagonal Architecture** (Ports and Adapters).
> See [ADR-005](../../../../architecture/decisions/ADR-005-hexagonal-architecture-shared-modules.md).

## Purpose

The Auth Shared Module provides:

- User credential validation
- Password hashing (bcrypt)
- JWT token generation and verification
- Authentication guards

## Architecture

This is a **shared module** designed for potential extraction into a standalone package.

### What This Module Provides

- Core authentication services (internal)
- JWT guard (internal)
- DTOs for input/output (public API)
- Injection tokens (public API)

### What This Module Does NOT Provide

- API endpoints (moved to `src/server/modules/auth/`)
- Direct service access (use adapters)

## Public API

Only import from the barrel file (`index.ts`):

```typescript
// ✅ Correct - import from barrel
import {
  AuthModule,
  AUTH_TOKENS,
  AuthCredentialsDto,
} from 'server/shared/modules/auth';

// ❌ Wrong - import internal files
import { AuthService } from 'server/shared/modules/auth/auth.service';
```

### Exports

| Export               | Purpose                              |
| -------------------- | ------------------------------------ |
| `AuthModule`         | NestJS module for registration       |
| `AUTH_TOKENS`        | Injection tokens for DI              |
| `AuthCredentialsDto` | Input DTO for login/register         |
| `UserDto`            | Output DTO for user data             |
| `TokenResponseDto`   | Output DTO for token response        |
| `IAuthService`       | Service interface (for adapter only) |

## Configuration

Requires environment variable:

```bash
JWT_AUTH_SECRET=your-secret-key
```

## Usage

### For Business Modules (Recommended)

Use the adapter layer:

```typescript
import { AuthGuardAdapter } from 'server/shared/adapters/auth';

@Controller('api/blog')
export class BlogController {
  @UseGuards(AuthGuardAdapter)
  @Post()
  create(@Body() dto: CreateBlogPostDto) {
    // Protected endpoint
  }
}
```

### For app.module.ts

Import the shared module for DI registration:

```typescript
import { AuthModule } from 'server/shared/modules/auth';

@Module({
  imports: [AuthModule],
})
export class SomeModule {}
```

## Internal Architecture

- **AuthService**: Core business logic (validation, registration, login)
- **JwtStrategy**: Passport strategy for JWT extraction and validation
- **JwtAuthGuard**: NestJS guard wrapping Passport authentication
- **User Entity**: TypeORM entity for user persistence

## Related

- **Business Controller**: `src/server/modules/auth/`
- **Adapters**: `src/server/shared/adapters/auth/`
- **Ports**: `src/server/shared/ports/auth.port.ts`
