import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: { username: string } | null;
  isLoginModalOpen: boolean;
  authError: string | null;
  login: (token: string, username: string) => void;
  logout: () => void;
  openLoginModal: (message?: string) => void;
  closeLoginModal: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      isLoginModalOpen: false,
      authError: null,
      login: (token, username) =>
        set({
          isAuthenticated: true,
          token,
          user: { username },
          isLoginModalOpen: false,
          authError: null,
        }),
      logout: () => set({ isAuthenticated: false, token: null, user: null }),
      openLoginModal: (message) =>
        set({ isLoginModalOpen: true, authError: message || null }),
      closeLoginModal: () => set({ isLoginModalOpen: false, authError: null }),
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
