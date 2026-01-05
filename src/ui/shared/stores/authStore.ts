import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: { username: string } | null;
  login: (token: string, username: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      login: (token, username) =>
        set({ isAuthenticated: true, token, user: { username } }),
      logout: () => set({ isAuthenticated: false, token: null, user: null }),
    }),
    {
      name: 'auth-store',
    },
  ),
);
