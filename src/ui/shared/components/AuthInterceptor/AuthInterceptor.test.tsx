import React from 'react';
import { render } from 'ui/test-utils';
import { AuthInterceptor } from './AuthInterceptor';
import axios from 'axios';
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthInterceptor', () => {
  let interceptorCallback: (error: any) => Promise<any>;
  let successCallback: (response: any) => any;
  let ejectMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the interceptors.response object structure
    ejectMock = jest.fn();
    mockedAxios.interceptors = {
      response: {
        use: jest.fn((successCb, errorCb) => {
          successCallback = successCb;
          interceptorCallback = errorCb;
          return 123; // Return an interceptor ID
        }),
        eject: ejectMock,
      } as any,
    } as any;

    // Reset store
    useAuthStore.setState({
      isAuthenticated: true,
      user: { username: 'test' },
      isLoginModalOpen: false,
      authError: null,
    });
  });

  it('registers an interceptor on mount', () => {
    render(<AuthInterceptor />);
    expect(mockedAxios.interceptors.response.use).toHaveBeenCalled();
  });

  it('ejects the interceptor on unmount', () => {
    const { unmount } = render(<AuthInterceptor />);
    unmount();
    expect(ejectMock).toHaveBeenCalledWith(123);
  });

  it('passes through successful responses', () => {
    render(<AuthInterceptor />);

    const response = { data: 'ok', status: 200 };
    const result = successCallback(response);

    expect(result).toBe(response);
  });

  it('handles 401 error by logging out and opening modal', async () => {
    render(<AuthInterceptor />);

    const error = {
      isAxiosError: true,
      response: { status: 401 },
    };
    // Mock axios.isAxiosError
    mockedAxios.isAxiosError.mockReturnValue(true);

    try {
      await interceptorCallback(error);
    } catch (e) {
      expect(e).toBe(error);
    }

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.isLoginModalOpen).toBe(true);
    expect(state.authError).toContain('session has expired');
  });

  it('ignores non-401 errors', async () => {
    render(<AuthInterceptor />);

    const error = {
      isAxiosError: true,
      response: { status: 500 },
    };
    mockedAxios.isAxiosError.mockReturnValue(true);

    try {
      await interceptorCallback(error);
    } catch (e) {
      expect(e).toBe(error);
    }

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true); // Should remain authenticated
    expect(state.isLoginModalOpen).toBe(false);
  });

  it('ignores non-axios errors', async () => {
    render(<AuthInterceptor />);

    const error = new Error('Random error');
    mockedAxios.isAxiosError.mockReturnValue(false);

    try {
      await interceptorCallback(error);
    } catch (e) {
      expect(e).toBe(error);
    }

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
  });

  it('ignores axios errors without response (e.g. network error)', async () => {
    render(<AuthInterceptor />);

    const error = {
      isAxiosError: true,
      response: undefined,
    };
    mockedAxios.isAxiosError.mockReturnValue(true);

    try {
      await interceptorCallback(error);
    } catch (e) {
      expect(e).toBe(error);
    }

    const state = useAuthStore.getState();
    expect(state.isLoginModalOpen).toBe(false);
  });
});
