# ADR-020: Frontend Authentication Architecture

## Status

Accepted - February 1, 2026

## Context

The frontend needs to handle authentication state that may become invalid without the
client's knowledge (e.g., token expiration, server-side logout). This creates a
synchronization problem between browser-stored credentials and server-side session validity.

### Key Challenge

The frontend stores authentication state (JWT token) in localStorage via Zustand persist.
However, the frontend cannot know when:

- The token has expired
- The server has invalidated the session
- The user's permissions have changed

Without a mechanism to detect and handle these cases, users would see confusing errors
or broken functionality when their stored credentials become invalid.

### Requirements

1. **Automatic detection**: Identify when stored credentials are no longer valid
2. **Graceful handling**: Inform users and provide re-authentication opportunity
3. **Consistent UX**: Same behavior regardless of which request triggered the invalidation
4. **No manual headers**: Developers shouldn't need to add Authorization headers per-request

## Decision

Implement a **global AuthInterceptor component** that configures Axios interceptors for
automatic token injection and 401 response handling.

### 1. AuthInterceptor Component

```typescript
// src/ui/shared/components/AuthInterceptor/AuthInterceptor.tsx
export const AuthInterceptor = () => {
  const logout = useAuthStore((state) => state.logout);
  const openLoginModal = useAuthStore((state) => state.openLoginModal);
  const responseInterceptorId = useRef<number | null>(null);
  const requestInterceptorId = useRef<number | null>(null);

  useEffect(() => {
    // Request Interceptor: Inject token
    requestInterceptorId.current = axios.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response Interceptor: Handle 401
    responseInterceptorId.current = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          logout();
          openLoginModal('Your session has expired. Please sign in again.');
        }
        return Promise.reject(error);
      },
    );

    // Cleanup on unmount
    return () => {
      if (requestInterceptorId.current !== null) {
        axios.interceptors.request.eject(requestInterceptorId.current);
      }
      if (responseInterceptorId.current !== null) {
        axios.interceptors.response.eject(responseInterceptorId.current);
      }
    };
  }, [logout, openLoginModal]);

  return null; // Renders nothing, just sets up interceptors
};
```

### 2. Root-Level Mounting

```typescript
// src/ui/index.tsx
root.render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthInterceptor />      {/* Global interceptor setup */}
      <SignInModal />          {/* Modal for re-authentication */}
      <RouterProvider router={router} />
    </ThemeProvider>
  </QueryClientProvider>
);
```

### 3. User Flow

```
User makes authenticated request
         │
         ▼
Request Interceptor
├─── Has token? ──► Inject Authorization header
│
         ▼
    Server Response
         │
    ┌────┴────┐
    │         │
  2xx       401
    │         │
    ▼         ▼
 Success   Response Interceptor
             ├─── logout() (clear store)
             ├─── openLoginModal(message)
             └─── reject(error)
                       │
                       ▼
              SignInModal appears
                       │
                       ▼
              User re-authenticates
                       │
                       ▼
              User can retry action
```

### 4. Store Access Outside React

The interceptor uses `useAuthStore.getState()` to access the token:

```typescript
// Inside request interceptor
const token = useAuthStore.getState().token;
```

This pattern works because:

- Zustand stores are plain JavaScript objects
- `getState()` returns current state synchronously
- No React hooks rules violated (not inside a component render)

### 5. SignInModal Integration

The modal is controlled by Zustand state:

```typescript
// useAuthStore state
isLoginModalOpen: boolean;
authError: string | null;

// useAuthStore actions
openLoginModal: (message?: string) => void;
closeLoginModal: () => void;
```

When opened by the interceptor:

1. Modal displays with the error message
2. User enters credentials
3. On successful login, modal closes automatically
4. User can retry their failed action

### 6. Token Storage

Tokens are stored in localStorage via Zustand persist:

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      /* ... */
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
      }),
    },
  ),
);
```

**Security considerations**:

- localStorage is vulnerable to XSS attacks
- For this portfolio project, the trade-off is acceptable
- Production applications might consider httpOnly cookies instead

## Consequences

### Positive

- **Automatic handling**: No per-request authentication code needed
- **Consistent UX**: All 401s handled the same way
- **Clean codebase**: Data-fetching hooks don't manage auth
- **Immediate feedback**: Users notified immediately of session expiry

### Negative

- **Global side effect**: Interceptor affects all Axios requests
- **Testing complexity**: Must mock interceptors in tests
- **localStorage security**: Tokens accessible to XSS attacks

### Trade-offs Accepted

| Trade-off               | Rationale                                  |
| ----------------------- | ------------------------------------------ |
| Global interceptor      | Cleaner than per-request handling          |
| localStorage for tokens | Acceptable for portfolio, would reconsider |
| No silent refresh       | Complexity not warranted for this project  |

### Future Considerations

1. **Token refresh**: Implement silent refresh before expiry
2. **httpOnly cookies**: Move tokens to cookies for XSS protection
3. **Retry queue**: Queue failed requests and retry after re-auth

## Related Documentation

- [ADR-003: Centralized Axios Interceptors](ADR-003-centralized-axios-interceptors.md)
- [Auth Component Documentation](../components/auth.md)
- [Security Skill](../../.github/skills/security/SKILL.md)
