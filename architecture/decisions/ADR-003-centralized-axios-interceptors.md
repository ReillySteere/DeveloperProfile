# ADR-003: Centralized Axios Interceptors for Authentication

## Status

Accepted

## Context

Our application uses JWT-based authentication. Previously, individual React hooks (e.g., `useBlog`) were responsible for:

1.  Checking if a token existed in the `authStore`.
2.  Manually injecting the `Authorization: Bearer <token>` header into Axios requests.
3.  Handling unrelated logic mixed with data fetching.

This approach led to:

- **Code Duplication:** Every protected API call needed the same header injection logic.
- **Inconsistency:** It was possible for a developer to forget to add the header in a new hook.
- **Redundant Testing:** Unit tests for hooks had to repeatedy verify that "headers were attached", which is infrastructure logic, not feature logic.

## Decision

We have implemented a **Centralized Axios Interceptor** strategy using a dedicated `AuthInterceptor` component.

1.  **Request Interceptor:**
    - Automatically attaches the `Authorization` header to _every_ outgoing request if a valid token exists in the `authStore`.
    - Removes the need for manual header injection in feature hooks.

2.  **Response Interceptor:**
    - Globally listens for `401 Unauthorized` responses.
    - Automatically triggers a `logout()` action (clearing state) if a 401 is detected.

3.  **Implementation:**
    - The `AuthInterceptor` is a "headless" component rendered at the root of the application (inside `App`).
    - It synchronizes the Axios instance with the Zustand `authStore`.

## Consequences

### Positive

- **Simplified Hooks:** Feature hooks now only care about the endpoint and the data. They do not need to know about auth implementation details.
- **Better Reliability:** It is now impossible to forget to add credentials to an API call; if you are logged in, _all_ calls are authenticated.
- **Cleaner Tests:** Integration tests (like `auth-flow.test.tsx` and container tests) implicitly test this behavior. We no longer need unit tests for hooks solely to check for header presence.

### Negative

- **Global State Dependency:** The network layer is now tightly coupled to the `AuthInterceptor` component being mounted.
- **Implicit Magic:** New developers might wonder where the auth header comes from since it's not in the hook. This ADR and documentation serve to mitigate that confusion.
