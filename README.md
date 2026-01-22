# Developer Profile

A full-stack developer profile application built with a modern React frontend and a robust NestJS backend.

## Core Technologies

### Frontend

- **Presentation Library:** React 19
- **Routing:** TanStack Router
- **Data Fetching:** TanStack Query
- **State Management:** Zustand
- **Authentication:** Axios Interceptors (JWT)
- **Styling:** SCSS Modules with CSS Variables
- **Build Tool:** Webpack

### Backend

- **Framework:** NestJS
- **Database:** SQLite (via `better-sqlite3`)
- **ORM:** TypeORM
- **Authentication:** Passport JWT

### Testing

- **Unit/Integration:** Jest (configured for both Node and Browser environments)
- **E2E:** Playwright (Chromium) for end-to-end testing
- **Quality Gates:** Husky `pre-push` hooks enforce strict testing, linting, and dependency validation before code can be pushed.

## Project Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd profile
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Editor Setup (Recommended):**

   Open the project in **VS Code** and accept the prompt to install the recommended extensions (ESLint, Prettier, Jest, Dependency Cruiser).

4. **Build the project:**

   ```bash
   npm run build
   ```

5. **Run the application:**
   - **Development mode (UI + Server):**

     ```bash
     npm start
     ```

   - **Production mode:**

     ```bash
     npm run start:server:prod
     ```

6. **Run tests:**
   - **All Unit/Integration Tests:**

     ```bash
     npm test
     ```

   - **E2E Tests (requires dev server running):**

     ```bash
     npm run test:e2e
     ```

7. **Docker:**
   - **Build:**

     ```bash
     docker build -t profile-app .
     ```

   - **Run:**

     ```bash
     docker run -p 3000:3000 profile-app
     ```

   - **Docker Compose (recommended):**

     ```bash
     # Production mode
     docker compose up

     # Development mode (with hot-reload)
     docker compose up --build
     ```

     The app will be available at `http://localhost:3000`

## Environment Variables

Copy the example file and configure your environment:

```bash
cp .env.example .env
# Edit .env with your values
```

See [.env.example](.env.example) for all available variables. Key variables:

| Variable          | Required | Description                                                          |
| ----------------- | -------- | -------------------------------------------------------------------- |
| `JWT_AUTH_SECRET` | Yes      | Secret key for signing JWTs. Generate with `openssl rand -base64 32` |
| `SENTRY_DSN`      | No       | Sentry DSN for error tracking                                        |
| `PORT`            | No       | Server port (default: 3000)                                          |

## Architecture

This project follows a **Modular Monolith** architecture with a **Backend for Frontend (BFF)** pattern.

### Core Principles

1.  **Modular Monolith:** The application is structured as a single deployable unit but organized into distinct modules. Each feature in the UI (e.g., Experience) has a corresponding module in the backend.
2.  **Backend for Frontend (BFF):** The UI is responsible purely for presentational concerns. All data manipulation, formatting, and business logic are handled in the NestJS layer. The backend exposes endpoints specifically tailored to the needs of the frontend containers.
3.  **Domain Layer:** Domain objects are the primary vehicle for realizing intended business value.
    - **Controllers:** Must call Services (cannot call Repositories directly).
    - **Services:** Perform business interactions on data.
    - **Repositories:** Handle persistence.
    - All three layers may import and use Domain Objects.
4.  **Data Flow:**
    - **Containers:** React containers (`src/ui/*/**.container.tsx`) are the entry points for features.
    - **Data Fetching:** Data is retrieved using **TanStack Query**, which interfaces with the backend API.
    - **Backend Modules:** Dedicated NestJS modules surface data via controllers.

### Architecture Diagram

```mermaid
graph TD
    subgraph Frontend ["Frontend (React 19)"]
        Container[Feature Container]
        Hook["Custom Hook (useExperience)"]
        RQ[TanStack Query]
        Shared[Shared Components]
    end

    subgraph Backend ["Backend (NestJS)"]
        Controller["Controller (BFF)"]
        Service["Service (Business Logic)"]
        Repo[Repository]
        Domain["Domain Objects"]
    end

    DB[(SQLite Database)]

    Container -->|Uses| Shared
    Container -->|Calls| Hook
    Hook -->|Uses| RQ
    RQ -->|HTTP GET /api/experience| Controller

    Controller -->|Calls| Service
    Service -->|Queries| Repo
    Repo -->|SQL| DB

    Controller -.->|Imports| Domain
    Service -.->|Imports| Domain
    Repo -.->|Imports| Domain
```

### Shared Modules (Hexagonal Architecture)

Shared modules follow a **Hexagonal Architecture** pattern with Ports and Adapters to enable clean boundaries and future extraction:

```mermaid
graph LR
    subgraph Business ["Business Modules"]
        BlogCtrl[Blog Controller]
        AuthCtrl[Auth Controller]
    end

    subgraph Adapters ["Adapters Layer"]
        AuthAdapter[AuthenticationAdapter]
        GuardAdapter[AuthGuardAdapter]
        LogAdapter[LoggingAdapter]
    end

    subgraph Ports ["Ports (Interfaces)"]
        IAuth[IAuthenticationPort]
        IGuard[IAuthGuardPort]
        ILog[ILoggingPort]
    end

    subgraph SharedModules ["Shared Modules (Encapsulated)"]
        AuthMod[Auth Module]
        LogMod[Logger Module]
        AuthSvc[AuthService]
        JwtGuard[JwtAuthGuard]
        LogSvc[AppLoggerService]
    end

    BlogCtrl -->|Uses| GuardAdapter
    AuthCtrl -->|Uses| AuthAdapter
    BlogCtrl -->|Uses| LogAdapter

    AuthAdapter -.->|Implements| IAuth
    GuardAdapter -.->|Implements| IGuard
    LogAdapter -.->|Implements| ILog

    AuthAdapter -->|Delegates to| AuthSvc
    GuardAdapter -->|Delegates to| JwtGuard
    LogAdapter -->|Delegates to| LogSvc

    AuthSvc --> AuthMod
    JwtGuard --> AuthMod
    LogSvc --> LogMod
```

**Key Principle:** Business modules only import from `adapters/` and `ports/`. They cannot access internal module implementations directly.

## Feature Architecture

Detailed architectural documentation for each feature can be found here:

- [About Feature](architecture/components/about.md)
- [Architecture Feature](architecture/components/architecture.md)
- [Auth Feature](architecture/components/auth.md)
- [Blog Feature](architecture/components/blog.md)
- [Experience Feature](architecture/components/experience.md)
- [Projects Feature](architecture/components/projects.md)
- [Shared UI](architecture/components/shared-ui.md)
- [Status (Mission Control)](architecture/components/status.md)

## Architectural Decisions

- [ADR-001: Persistent Storage for Blog](architecture/decisions/ADR-001-persistent-storage-for-blog.md)
- [ADR-002: SQLite & TypeORM](architecture/decisions/ADR-002-SQLite-TypeOrm-for-persistence.md)
- [ADR-003: Centralized Axios Interceptors](architecture/decisions/ADR-003-centralized-axios-interceptors.md)
- [ADR-004: Migrate to better-sqlite3](architecture/decisions/ADR-004-better-sqlite3-driver.md)
- [ADR-005: Hexagonal Architecture for Shared Modules](architecture/decisions/ADR-005-hexagonal-architecture-shared-modules.md)
- [ADR-006: Recharts for Telemetry Visualization](architecture/decisions/ADR-006-recharts-for-telemetry-visualization.md)
- [ADR-007: Simulated Chaos Mode](architecture/decisions/ADR-007-simulated-chaos-mode.md)
- [ADR-008: Build-Time Search Index](architecture/decisions/ADR-008-build-time-search-index.md) _(Superseded by ADR-009)_
- [ADR-009: Client-Side Search Architecture](architecture/decisions/ADR-009-client-side-search-architecture.md)

## Key Features

- **Experience Timeline:** A scrollable, animated timeline of professional experience.
- **Projects Showcase:** A detailed portfolio of technical projects with role, execution, and results.
- **About Section:** Detailed professional summary and skills.
- **Technical Blog:** A markdown-based blogging platform with syntax highlighting and diagram support.
- **Architecture Explorer:** ADR browser, component documentation, and interactive dependency graph visualization.
- **Mission Control:** Real-time telemetry dashboard with event loop monitoring, memory metrics, and simulated chaos mode.
- **Responsive Design:** Optimized for various screen sizes with a custom Navigation Rail.
- **Dark/Light Mode:** Theming support via CSS variables.

## Tooling and Stack Overview

- **User Interface:** React coupled with modern CSS/SCSS for responsive design.
- **Backend:** NestJS API Gateway with TypeORM integration using SQLite.
- **Testing:** Jest for unit and integration tests.
- **Error Monitoring:** Sentry integrated for capturing runtime errors.
- **Language:** TypeScript for type safety and maintainability.
- **Bundling:** Webpack for building both client and server assets.

## API Endpoint Documentation

The API endpoints are documented using Swagger. Once the backend is running, you can access the API docs at:  
[http://localhost:3000/api/docs](http://localhost:3000/api/docs)
