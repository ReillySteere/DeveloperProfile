import { useState, useCallback } from 'react';
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    login: storeLogin,
    logout: storeLogout,
    isAuthenticated,
    user,
  } = useAuthStore();

  const login = useCallback(
    (username: string, password: string) => {
      setIsLoading(true);
      setError(null);

      return fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((data) => {
              throw new Error(data.message || 'Invalid credentials');
            });
          }
          return response.json();
        })
        .then((data) => {
          if (data.access_token) {
            storeLogin(data.access_token, username);
            return true;
          } else {
            throw new Error('Invalid response from server');
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'An error occurred');
          return false;
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [storeLogin],
  );

  const logout = useCallback(() => {
    storeLogout();
  }, [storeLogout]);

  return {
    login,
    logout,
    isLoading,
    error,
    isAuthenticated,
    user,
  };
};
