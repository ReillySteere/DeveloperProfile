# Auth Module

This module handles user authentication and registration using JWT (JSON Web Tokens) and Passport.js. It provides endpoints for creating users, logging in, and protecting routes.

## Purpose

The Auth Module is responsible for:

- User registration (creating new accounts).
- User authentication (verifying credentials).
- Token generation (issuing JWTs).
- Route protection (guarding endpoints against unauthorized access).

## Configuration

The module requires the following environment variable to be set:

- `JWT_AUTH_SECRET`: The secret key used to sign and verify JWTs.

## API Endpoints

Base URL: `/api/auth`

### Register

Creates a new user account.

- **URL**: `/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "your_username",
    "password": "your_password"
  }
  ```
- **Response**: Returns the created user object (excluding password).

### Login

Authenticates a user and returns an access token.

- **URL**: `/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "your_username",
    "password": "your_password"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "jwt_token_string"
  }
  ```

### Protected Route Example

An example endpoint demonstrating how to protect a route.

- **URL**: `/protected`
- **Method**: `GET`
- **Headers**:
  - `Authorization`: `Bearer <your_access_token>`

## Usage

### Importing the Module

Import `AuthModule` into your application module (usually `AppModule`):

```typescript
import { AuthModule } from 'shared/modules/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### Protecting Routes

To protect a route in another controller, use the `JwtAuthGuard`:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'shared/modules/auth/jwt-auth.guard';

@Controller('some-resource')
export class SomeController {
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    // This endpoint is now protected
  }
}
```

## Architecture

- **AuthController**: Handles incoming HTTP requests.
- **AuthService**: Contains business logic for validation, registration, and login.
- **JwtStrategy**: Passport strategy for extracting and validating JWTs from the `Authorization` header.
- **User Entity**: TypeORM entity representing the user in the database.
