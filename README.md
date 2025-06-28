# Developer Profile

## Purpose

## Project Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd towerdefense
   ```

2. **Install dependencies:**

   ```bash
   yarn install
   ```

3. **Build the project:**

   ```bash
   yarn build
   ```

4. **Run the application:**

   - **Development mode (UI + Server):**

     ```bash
     yarn start
     ```

   - **Production mode:**

     ```bash
     yarn start:server:prod
     ```

5. **Run tests:**

   - **Unit Tests:**

     ```bash
     yarn test:ui && yarn test:server
     ```

   - **Cypress Integration Tests:**

     ```bash
     yarn cy:open
     ```

## Tooling and Stack Overview

- **User Interface:** React coupled with modern CSS/SCSS for responsive design.
- **Backend:** NestJS API Gateway with TypeORM integration using SQLite.
- **Testing:** Jest for unit tests and Cypress for integration tests.
- **Error Monitoring:** Sentry integrated for capturing runtime errors.
- **Language:** TypeScript for type safety and maintainability.
- **Bundling:** Webpack for building both client and server assets.

## API Endpoint Documentation

The API endpoints are documented using Swagger. Once the backend is running, you can access the API docs at:  
[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Initial Architecture Diagram

Below is a simple diagram outlining the interactions between the frontend and backend:

```mermaid
graph TD;
    A[Browser/Client] --> B[React UI + Phaser 3];
    B --> C[NestJS API Gateway];
    C --> D[SQLite Database];
    C --> E[Sentry (Observability)];
```

## Development Overview

## Future Considerations
