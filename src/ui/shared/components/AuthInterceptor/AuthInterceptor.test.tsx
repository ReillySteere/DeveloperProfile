import React from 'react';
import { render } from 'ui/test-utils';
import { AuthInterceptor } from './AuthInterceptor';
import axios from 'axios';
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthInterceptor', () => {
  let responseErrorCallback: (error: any) => Promise<any>;
  let responseSuccessCallback: (response: any) => any;
  let requestSuccessCallback: (config: any) => any;
  let ejectResponseMock: jest.Mock;
  let ejectRequestMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the interceptors.response object structure
    ejectResponseMock = jest.fn();
    ejectRequestMock = jest.fn();

    mockedAxios.interceptors = {
      response: {
        use: jest.fn((successCb, errorCb) => {
          responseSuccessCallback = successCb;
          responseErrorCallback = errorCb;
          return 123; // Return an interceptor ID
        }),
        eject: ejectResponseMock,
      } as any,
      request: {
        use: jest.fn((successCb) => {
          requestSuccessCallback = successCb;
          return 456;
        }),
        eject: ejectRequestMock,
      } as any,
    } as any;

    // Reset store
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'test-token',
      user: { username: 'test' },
      isLoginModalOpen: false,
      authError: null,
    });
  });

  it('registers interceptors on mount', () => {
    render(<AuthInterceptor />);
    expect(mockedAxios.interceptors.response.use).toHaveBeenCalled();
    expect(mockedAxios.interceptors.request.use).toHaveBeenCalled();
  });

  it('ejects interceptors on unmount', () => {
    const { unmount } = render(<AuthInterceptor />);
    unmount();
    expect(ejectResponseMock).toHaveBeenCalledWith(123);
    expect(ejectRequestMock).toHaveBeenCalledWith(456);
  });

  it('injects Authorization header when token exists', () => {
    render(<AuthInterceptor />);
    const config = { headers: {} };
    const result = requestSuccessCallback(config);
    expect(result.headers.Authorization).toBe('Bearer test-token');
  });

  it('does not inject Authorization header when token is missing', () => {
    useAuthStore.setState({ token: null });
    render(<AuthInterceptor />);
    const config = { headers: {} };
    const result = requestSuccessCallback(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('passes through successful responses', () => {
    render(<AuthInterceptor />);

    const response = { data: 'ok', status: 200 };
    const result = responseSuccessCallback(response);

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
      await responseErrorCallback(error);
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
      await responseErrorCallback(error);
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
      await responseErrorCallback(error);
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
      await responseErrorCallback(error);
    } catch (e) {
      expect(e).toBe(error);
    }

    const state = useAuthStore.getState();
    expect(state.isLoginModalOpen).toBe(false);
  });

  it('ejects interceptors on unmount', () => {
    const { unmount } = render(<AuthInterceptor />);

    unmount();

    expect(ejectResponseMock).toHaveBeenCalledWith(123);
    expect(ejectRequestMock).toHaveBeenCalledWith(456);
  });

  it('handles interceptor setup failure gracefully during cleanup', () => {
    mockedAxios.interceptors.response.use = jest.fn(() => null as any);
    mockedAxios.interceptors.request.use = jest.fn(() => null as any);

    const { unmount } = render(<AuthInterceptor />);
    unmount();

    // Expect eject NOT to be called because refs are null
    expect(ejectResponseMock).not.toHaveBeenCalled();
    expect(ejectRequestMock).not.toHaveBeenCalled();
  });
});
