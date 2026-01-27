/**
 * UI Test Utilities
 *
 * This module provides all test utilities for UI tests:
 *
 * Core Testing:
 * - `render` - Wrapped render with QueryClientProvider
 * - `screen`, `waitFor`, `within` - From @testing-library/react
 * - `act`, `cleanup` - React testing utilities
 *
 * User Interactions:
 * - `userEvent` - Realistic user interaction simulation (preferred over fireEvent)
 *
 * API Mocking (MSW):
 * - `server` - MSW server instance (started automatically in jest-preloaded.ts)
 * - `createTraceHandlers()`, `createBlogHandlers()`, etc. - Handler factories
 *
 * Component Mocks:
 * - `MockEventSource` - For testing Server-Sent Events
 * - `mockRecharts` - For mocking Recharts components
 *
 * @example
 * ```typescript
 * import { render, screen, waitFor, userEvent } from 'ui/test-utils';
 * import { server, createBlogHandlers } from 'ui/test-utils/msw';
 *
 * it('should render posts', async () => {
 *   const user = userEvent.setup();
 *   render(<MyComponent />);
 *   await user.click(screen.getByRole('button'));
 *   await waitFor(() => expect(screen.getByText('Done')).toBeInTheDocument());
 * });
 * ```
 */
export * from './test-utils';
export * from './mockEventSource';
export * from './mockRecharts';
export * from './msw';

// Re-export userEvent for convenient access
export { default as userEvent } from '@testing-library/user-event';
