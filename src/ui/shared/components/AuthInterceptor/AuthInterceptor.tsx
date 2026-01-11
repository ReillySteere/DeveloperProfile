import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';

/**
 * Sets up a global Axios interceptor to handle 401 Unauthorized responses.
 * When a 401 is received, it logs the user out.
 */
export const AuthInterceptor = () => {
  const logout = useAuthStore((state) => state.logout);
  const openLoginModal = useAuthStore((state) => state.openLoginModal);
  const responseInterceptorId = useRef<number | null>(null);
  const requestInterceptorId = useRef<number | null>(null);

  useEffect(() => {
    // Response Interceptor (Handle 401s)
    responseInterceptorId.current = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          logout();
          openLoginModal(
            'Your session has expired. Please log in again to continue.',
          );
        }
        return Promise.reject(error);
      },
    );

    // Request Interceptor (Inject Token)
    requestInterceptorId.current = axios.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => {
      if (responseInterceptorId.current !== null) {
        axios.interceptors.response.eject(responseInterceptorId.current);
        responseInterceptorId.current = null;
      }
      if (requestInterceptorId.current !== null) {
        axios.interceptors.request.eject(requestInterceptorId.current);
        requestInterceptorId.current = null;
      }
    };
  }, [logout, openLoginModal]);

  return null;
};
