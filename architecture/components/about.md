# About Feature Architecture

## Overview

The About feature serves as the landing page and introduction for the profile application. It displays personal information, professional summary, core strengths, and provides functionality for users to download a PDF resume.

## Data Flow

### 1. Backend API (NestJS)

- **Module:** `AboutModule` (`src/server/modules/about/about.module.ts`)
- **Controller:** `AboutController` (`/api/about`)
  - `GET /resume`: Streams the resume PDF file to the client.
- **Service:** `AboutService`
  - **Responsibility:** Manages file system access.
  - **Implementation:** Uses `createReadStream` from `node:fs` to read the resume file located in `src/server/assets/`.
  - **Output:** Returns a `ResumeReadableStream` object containing the stream, filename, and content type.

### 2. Resume Download Workflow

The resume download is a specialized workflow that handles binary data streaming and browser-native download triggers.

**Server-Side Requirements:**

- **Streaming:** Must use `StreamableFile` to efficiently pipe data without loading the entire file into memory.
- **Headers:**
  - `Content-Type`: Must be set to `application/pdf`.
  - `Content-Disposition`: Must be set to `attachment; filename="<filename>"` to trigger a download prompt instead of inline viewing.

**Client-Side Requirements:**

- **Hook:** `useDownloadResume` (`src/ui/about/hooks/useDownloadResume.ts`)
  - Uses `axios` with `responseType: 'blob'` to correctly handle binary data.
  - **Filename Extraction:** Parses the `Content-Disposition` header to extract the server-provided filename. This ensures the downloaded file matches the server's versioning.
- **Browser Trigger:**
  - Creates a temporary Blob URL using `window.URL.createObjectURL`.
  - Creates a hidden `<a>` tag, sets the `download` attribute, and programmatically clicks it.
  - Revokes the object URL after the click to prevent memory leaks.

### 3. User Interface (React)

- **Container:** `AboutContainer` (`src/ui/about/about.container.tsx`)
  - Orchestrates the layout of the page sections.
- **Key Components:**
  - **HeroSection:** Displays the user's name, role, location, and hosts the `DownloadResumeButton`.
  - **DownloadResumeButton:**
    - **State Management:** Uses `useMutation` (via `useDownloadResume`) to track `isPending` state.
    - **Feedback:** Shows a `Loader2` spinner during the download process.
    - **Interaction:** Disables the button while a download is in progress to prevent multiple requests.
  - **ConnectSection:** Provides quick links to LinkedIn and Email.
  - **Content Sections:** `WhatIDoSection`, `RelevantBackgroundSection`, `CoreStrengthsSection` display static profile content.

## Key Dependencies

- **Backend:**
  - `@nestjs/common`: `StreamableFile`, `Res`, `Header` decorators.
  - `node:fs`, `node:path`: File system operations.
- **Frontend:**
  - `@tanstack/react-query`: Manages the mutation state for the download request.
  - `axios`: Handles the HTTP GET request with Blob response type.
  - `lucide-react`: Provides icons (`Download`, `Loader2`, `MapPin`, etc.).

## Testing Strategy

- **Backend Integration:** `src/server/modules/about/about.integration.test.ts`
  - Verifies that the `/resume` endpoint returns a `StreamableFile`.
  - Asserts that `Content-Type` and `Content-Disposition` headers are correctly set.
  - Validates that the `AboutService` can successfully locate and read the physical file from disk.

- **Frontend Integration:** `src/ui/about/about.container.test.ts`
  - **Mocking:**
    - Mocks `axios` to simulate binary responses and header variations.
    - Mocks `window.URL.createObjectURL` and `window.URL.revokeObjectURL`.
    - Spies on `HTMLAnchorElement.prototype.click` to verify the download trigger without causing JSDOM navigation errors.
  - **Coverage:**
    - Verifies the "Happy Path" (successful download and trigger).
    - Verifies error handling (e.g., missing filename in headers).
    - Ensures UI state changes (loading spinner, disabled button) occur correctly.
