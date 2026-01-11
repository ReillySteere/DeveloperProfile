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
