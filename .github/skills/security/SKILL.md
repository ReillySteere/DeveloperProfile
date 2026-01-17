---
name: security
description: Guide secure coding practices including authentication, input validation, and common vulnerability prevention.
---

# Security

Use this skill when implementing authentication, handling user input, or reviewing code for security issues.

## 1. Authentication & Authorization

### JWT Token Handling

This project uses Passport JWT for authentication. Key patterns:

```typescript
// ✅ Correct: Use JwtAuthGuard decorator
@UseGuards(JwtAuthGuard)
@Get('protected-endpoint')
async getProtectedData() { ... }

// ❌ Wrong: Manual token parsing
const token = request.headers.authorization?.split(' ')[1];
```

**Token Storage Best Practices:**

| Storage Method  | Security Level | Use Case                     |
| --------------- | -------------- | ---------------------------- |
| HttpOnly Cookie | ✅ Most Secure | Production apps              |
| Memory (state)  | ✅ Secure      | SPA session                  |
| localStorage    | ❌ Insecure    | Never store sensitive tokens |

**This Project's Pattern:**

- Frontend: `AuthInterceptor` handles token injection automatically
- Backend: `JwtAuthGuard` validates tokens
- Never manually add Authorization headers in hooks

### Guard Usage

```typescript
// Single endpoint protection
@UseGuards(JwtAuthGuard)
@Post()
create(@Body() dto: CreateDto) { ... }

// Controller-level protection
@UseGuards(JwtAuthGuard)
@Controller('api/admin')
export class AdminController { ... }
```

**Check User Ownership:**

```typescript
// Verify user owns the resource before modifying
@UseGuards(JwtAuthGuard)
@Delete(':id')
async delete(@Param('id') id: string, @Req() request) {
  const userId = request.user.sub;
  const resource = await this.service.findOne(id);

  if (resource.userId !== userId) {
    throw new ForbiddenException('Not authorized to delete this resource');
  }

  return this.service.delete(id);
}
```

## 2. Input Validation

### Backend (NestJS)

**Always use class-validator DTOs:**

```typescript
// ✅ Correct: DTO with validation decorators
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateBlogPostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  slug?: string;
}

// ❌ Wrong: No validation
async create(data: any) {
  return this.repository.save(data);
}
```

**Global ValidationPipe (already configured):**

```typescript
// main.ts - DO NOT REMOVE
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Strip unknown properties
    forbidNonWhitelisted: true, // Throw on unknown properties
    transform: true, // Transform payloads to DTO instances
  }),
);
```

### Frontend (React)

- Validate on client for UX, but NEVER trust client validation
- React automatically escapes strings (XSS protection by default)
- Use controlled inputs to prevent unexpected values

```typescript
// ✅ Client validation for UX
const handleSubmit = (e: FormEvent) => {
  e.preventDefault();

  if (title.length < 3) {
    setError('Title must be at least 3 characters');
    return;
  }

  // Server will validate again
  mutation.mutate({ title, content });
};
```

## 3. Common Vulnerabilities

### SQL Injection

**TypeORM Protection (Already in Place):**

```typescript
// ✅ Safe: TypeORM parameterizes automatically
const user = await this.repository.findOne({ where: { email } });

// ✅ Safe: Query builder with parameters
const posts = await this.repository
  .createQueryBuilder('post')
  .where('post.title LIKE :search', { search: `%${term}%` })
  .getMany();

// ❌ DANGEROUS: String concatenation
const result = await this.repository.query(
  `SELECT * FROM users WHERE email = '${email}'`, // SQL INJECTION!
);
```

### XSS (Cross-Site Scripting)

**React's Built-in Protection:**

```typescript
// ✅ Safe: React escapes by default
return <div>{userContent}</div>;

// ⚠️ Dangerous: Only use with sanitized content
return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;

// ✅ If you must render HTML, sanitize first:
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userHtml);
return <div dangerouslySetInnerHTML={{ __html: clean }} />;
```

**Markdown Rendering (Blog Feature):**
This project uses `react-markdown` which is safe by default:

```typescript
// ✅ Safe: react-markdown sanitizes HTML
import ReactMarkdown from 'react-markdown';
<ReactMarkdown>{content}</ReactMarkdown>
```

### CSRF (Cross-Site Request Forgery)

**Mitigation Strategies:**

1. **SameSite Cookies:** Set `SameSite=Strict` or `Lax`
2. **Origin Verification:** Check `Origin` header on mutations
3. **Token-based Auth:** JWTs in Authorization header (not cookies) are CSRF-immune

## 4. Dependency Security

### Regular Audits

```bash
# Check for vulnerabilities
npm audit

# Only high/critical (CI uses this)
npm audit --audit-level=high

# Auto-fix where possible
npm audit fix
```

### Dependabot (Already Configured)

This project has Dependabot enabled in `.github/dependabot.yml`. It will:

- Check for dependency updates weekly
- Create PRs for security patches
- Group minor updates to reduce noise

### Before Adding Dependencies

1. Check npm for last update date (avoid abandoned packages)
2. Review GitHub issues for security concerns
3. Check bundle size impact (`npx bundlephobia <package>`)
4. Prefer well-maintained alternatives

## 5. Environment & Secrets

### Never Commit Secrets

```bash
# .gitignore already includes:
.env
.env.local
*.pem
```

### Environment Variable Pattern

```typescript
// ✅ Correct: Access via process.env
const secret = process.env.JWT_AUTH_SECRET;

// ❌ Wrong: Hardcoded secrets
const secret = 'my-super-secret-key';
```

### Required Environment Variables

See `.env.example` for all required variables:

| Variable          | Required | Purpose                    |
| ----------------- | -------- | -------------------------- |
| `JWT_AUTH_SECRET` | Yes      | JWT signing key            |
| `SENTRY_DSN`      | No       | Error tracking (optional)  |
| `NODE_ENV`        | No       | Environment (default: dev) |

### Secret Rotation

- Rotate `JWT_AUTH_SECRET` periodically
- On rotation, expect brief auth failures as tokens become invalid
- Consider using short-lived tokens with refresh token pattern for production

## 6. Security ESLint Rules

This project has `eslint-plugin-security` configured with these rules:

| Rule                                    | Level | Purpose                    |
| --------------------------------------- | ----- | -------------------------- |
| `detect-object-injection`               | warn  | Bracket notation security  |
| `detect-non-literal-regexp`             | warn  | Dynamic regex (ReDoS)      |
| `detect-unsafe-regex`                   | error | Catastrophic backtracking  |
| `detect-buffer-noassert`                | error | Buffer bounds checking     |
| `detect-eval-with-expression`           | error | Dynamic eval() calls       |
| `detect-no-csrf-before-method-override` | error | Express CSRF vulnerability |
| `detect-possible-timing-attacks`        | warn  | Constant-time comparisons  |

**Suppressing False Positives:**

```typescript
// When you're certain the code is safe:
// eslint-disable-next-line security/detect-object-injection
const value = obj[key];
```

## 7. Security Checklist

Before deploying or reviewing PRs, verify:

- [ ] All user input validated with DTOs
- [ ] Protected endpoints use `@UseGuards(JwtAuthGuard)`
- [ ] No hardcoded secrets
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] No string concatenation in SQL queries
- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] Sensitive data not logged
