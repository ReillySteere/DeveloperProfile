import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NavStoreState {
  isExpanded: boolean;
  activeSection: string;
  theme: 'light' | 'dark';
  toggleExpand: () => void;
  setExpanded: (expanded: boolean) => void;
  setActiveSection: (section: string) => void;
  toggleTheme: () => void;
}

export const useNavStore = create<NavStoreState>()(
  persist(
    (set, get) => ({
      isExpanded: true,
      activeSection: '',
      theme: 'light',

      toggleExpand: () => set({ isExpanded: !get().isExpanded }),
      setExpanded: (expanded) => set({ isExpanded: expanded }),

      setActiveSection: (section) => set({ activeSection: section }),

      toggleTheme: () =>
        set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    {
      name: 'nav-store',
      partialize: (state) => ({
        isExpanded: state.isExpanded,
        theme: state.theme,
      }),
    },
  ),
);
