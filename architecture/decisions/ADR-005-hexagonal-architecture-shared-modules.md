# ADR-005: Hexagonal Architecture for Shared Modules

## Status

Accepted

## Context

Our application follows a Modular Monolith with Backend for Frontend (BFF) pattern. We have shared modules in `src/server/shared/modules/` that provide cross-cutting concerns (e.g., authentication, logging).

As the project evolves, we anticipate the need to:

1. **Reuse shared modules across multiple projects** - The backend functionality may be extracted into standalone packages.
2. **Maintain clean architectural boundaries** - Prevent tight coupling between business modules and shared module internals.
3. **Enable independent evolution** - Allow shared modules to change their internal implementation without breaking consumers.

Currently, business modules like `blog` directly import internal files from shared modules:

```typescript
// blog.controller.ts - Current (violates encapsulation)
import { JwtAuthGuard } from 'server/shared/modules/auth/jwt-auth.guard';
```

This creates tight coupling that would make future extraction difficult.

## Decision

We adopt **Hexagonal Architecture** (Ports and Adapters) for all shared modules. This introduces:

### 1. Anti-Corruption Layer (ACL)

Each shared module defines its public contract through:

- **DTOs**: Input/output data structures validated with `class-validator`
- **Ports**: Interfaces defining the operations the module exposes
- **Tokens**: Injection tokens for dependency injection

These are the **only** exports a shared module may expose to consumers.

### 2. Folder Structure

```
src/server/shared/
├── adapters/           # Adapters for each shared module
│   ├── auth/
│   │   ├── auth.adapter.ts
│   │   ├── auth.types.ts       # Business-layer types (not DTOs)
│   │   └── index.ts
│   └── logger/
│       ├── logger.adapter.ts
│       └── index.ts
├── ports/              # Port interfaces (contracts)
│   ├── auth.port.ts
│   ├── logger.port.ts
│   └── index.ts
└── modules/            # Internal implementations (encapsulated)
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.service.ts
    │   ├── auth.dto.ts         # ACL DTOs
    │   ├── user.entity.ts
    │   ├── jwt.strategy.ts
    │   ├── jwt-auth.guard.ts
    │   └── tokens.ts
    └── logger/
        ├── logger.module.ts
        └── logger.service.ts
```

### 3. Dependency Rules

| From                           | May Import                                         | Cannot Import                      |
| ------------------------------ | -------------------------------------------------- | ---------------------------------- |
| Business Module (e.g., `blog`) | Adapters, Ports                                    | Anything inside `shared/modules/*` |
| Adapter                        | Port interfaces, Module's ACL (DTOs, tokens)       | Other adapters                     |
| `app.module.ts`                | Shared modules directly (for registration)         | N/A                                |
| Shared Module A                | Shared Module B via its Adapter                    | Shared Module B internals          |
| Test files                     | Exempt (may access internals for thorough testing) | N/A                                |

### 4. Controller Extraction

Controllers that expose application-specific endpoints must be extracted from shared modules. The shared module provides only the core capability; the application decides how to expose it.

Example: `AuthController` moves from `shared/modules/auth/` to `modules/auth/` and consumes the auth adapter.

### 5. Type Layering

```
┌─────────────────────────────────────────────────────┐
│  Business Layer Types (src/server/shared/adapters/) │
│  e.g., AuthenticatedUser, LoginResult               │
├─────────────────────────────────────────────────────┤
│  ACL DTOs (src/server/shared/modules/*/dto/)        │
│  e.g., AuthCredentialsDto, UserDto                  │
├─────────────────────────────────────────────────────┤
│  Internal Types (src/server/shared/modules/*)       │
│  e.g., User entity, JWT payload                     │
└─────────────────────────────────────────────────────┘
```

Business modules depend on business-layer types. Adapters translate between business-layer types and ACL DTOs.

### 6. Token Exposure Pattern

Following NestJS best practices:

- Tokens are defined in a `tokens.ts` file within the shared module
- Tokens are exported as part of the module's public API (via barrel file)
- Adapters import tokens to facilitate DI wiring
- Tokens use `Symbol()` for uniqueness and type safety

```typescript
// shared/modules/auth/tokens.ts
export const AUTH_TOKENS = {
  AuthService: Symbol('AuthService'),
  JwtAuthGuard: Symbol('JwtAuthGuard'),
} as const;

// Exported via index.ts barrel
export { AUTH_TOKENS } from './tokens';
```

## Implementation

### Dependency-Cruiser Rules

New rules will enforce these boundaries:

```javascript
// No direct imports from shared modules (except adapters/ports)
{
  name: 'shared-module-encapsulation',
  severity: 'error',
  comment: 'Business modules must use adapters, not shared module internals.',
  from: {
    path: '^src/server/modules/',
    pathNot: '\\.test\\.ts$',
  },
  to: {
    path: '^src/server/shared/modules/',
  },
},

// Adapters may only import specific files from shared modules
{
  name: 'adapter-limited-imports',
  severity: 'error',
  comment: 'Adapters may only import ports, DTOs, and tokens from shared modules.',
  from: {
    path: '^src/server/shared/adapters/',
  },
  to: {
    path: '^src/server/shared/modules/',
    pathNot: '(tokens|dto|index)\\.ts$',
  },
},

// Shared modules cannot depend on business modules
{
  name: 'shared-no-business-deps',
  severity: 'error',
  comment: 'Shared modules cannot depend on business modules.',
  from: {
    path: '^src/server/shared/modules/',
  },
  to: {
    path: '^src/server/modules/',
  },
},
```

### Migration Steps

1. Create `src/server/shared/ports/` and define port interfaces
2. Create `src/server/shared/adapters/` with adapter implementations
3. Define business-layer types in adapters
4. Extract `AuthController` to `src/server/modules/auth/`
5. Update all consumers to use adapters instead of direct imports
6. Add dependency-cruiser rules
7. Update documentation

## Consequences

### Positive

- **Extractability**: Shared modules can be extracted to npm packages with minimal changes
- **Encapsulation**: Internal implementation details are hidden from consumers
- **Testability**: Adapters can be easily mocked for testing
- **Consistency**: Clear, enforceable patterns for module boundaries
- **Future-Proofing**: Cross-module dependencies follow the same pattern

### Negative

- **Indirection**: Additional adapter layer adds complexity
- **Boilerplate**: More files to maintain (ports, adapters, types)
- **Test Exceptions**: Tests accessing internals will need updates if module is extracted
- **Learning Curve**: Developers must understand the hexagonal pattern

### Neutral

- Logger module receives same treatment for consistency, even though simpler
- Existing integration tests remain valid (exempted from rules)

## Related Documents

- [Architecture Overview](../../.github/copilot-instructions.md)
- [Auth Component Documentation](../components/auth.md)
- [ADR-003: Centralized Axios Interceptors](./ADR-003-centralized-axios-interceptors.md)
