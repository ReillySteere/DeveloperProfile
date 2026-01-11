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
  const interceptorId = useRef<number | null>(null);

  useEffect(() => {
    interceptorId.current = axios.interceptors.response.use(
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

    return () => {
      if (interceptorId.current !== null) {
        axios.interceptors.response.eject(interceptorId.current);
        interceptorId.current = null;
      }
    };
  }, [logout, openLoginModal]);

  return null;
};
