# Rise of the AI Assistants

Tower defense style game where you build progressively more powerful AIs to take over and eliminate increasingly more complex forms of human labour.

## Purpose

This project aims to develop a polished, browser-based tower defense game as a portfolio piece. The game is designed for desktop browsers (Chrome, Firefox, Safari, Edge) and will begin as a single-player experience—with a future potential for multiplayer expansion. The core goals are:

- **Clean, Modular Architecture:** Establish a maintainable codebase with a clear separation of game logic, UI, and backend services.
- **Rapid Prototyping:** Use placeholder graphics to focus on gameplay mechanics before integrating final art assets.
- **Showcase of Modern Technologies:** Demonstrate proficiency with current web development tools and best practices through incremental milestones and thorough testing.

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

- **Game Engine:** Phaser 3 for rendering and game loop management.
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

The project will be developed in incremental milestones, starting with the basic setup and a blank game loop, and progressing toward a fully playable tower defense game. Key focus areas include:

- **Modular Architecture:** Separating concerns across game logic, UI components, and backend services to facilitate ease of maintenance and future extensions.
- **Testing:** Implementing unit tests (with Jest) and integration tests (with Cypress) early in the development process to maintain high code quality.
- **Scalability:** Designing the game with forward-thinking principles, enabling future multiplayer functionality and performance optimizations.

## Future Considerations

- **Asset Integration:** Placeholder graphics will be used initially, with the architecture designed to easily swap in high-quality assets as they become available.
- **Multiplayer Expansion:** Although the initial focus is on single-player, the codebase will be structured to support multiplayer features with minimal refactoring.
- **Performance Optimization:** Continuous profiling and optimization (e.g., efficient asset management and object pooling) will be employed to ensure smooth gameplay across all targeted browsers.
