import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ComponentMetadata,
  ViewportSize,
  CompositionTemplate,
} from 'shared/types';

interface PlaygroundStoreState {
  component: ComponentMetadata | null;
  props: Record<string, unknown>;
  viewport: ViewportSize;
  theme: 'light' | 'dark';
  showGrid: boolean;
  activeTab: 'components' | 'compositions';
  selectedTemplate: CompositionTemplate | null;
  slotProps: Record<string, Record<string, unknown>>;
  setComponent: (component: ComponentMetadata | null) => void;
  updateProp: (name: string, value: unknown) => void;
  resetProps: (defaults: Record<string, unknown>) => void;
  setViewport: (viewport: ViewportSize) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleGrid: () => void;
  setActiveTab: (tab: 'components' | 'compositions') => void;
  selectTemplate: (template: CompositionTemplate | null) => void;
  updateSlotProp: (slotId: string, name: string, value: unknown) => void;
  resetSlotProps: () => void;
}

export const usePlaygroundStore = create<PlaygroundStoreState>()(
  persist(
    (set) => ({
      component: null,
      props: {},
      viewport: 'full',
      theme: 'light',
      showGrid: false,
      activeTab: 'components',
      selectedTemplate: null,
      slotProps: {},
      setComponent: (component) => set({ component }),
      updateProp: (name, value) =>
        set((state) => ({
          props: { ...state.props, [name]: value },
        })),
      resetProps: (defaults) => set({ props: defaults }),
      setViewport: (viewport) => set({ viewport }),
      setTheme: (theme) => set({ theme }),
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      selectTemplate: (template) => {
        if (!template) {
          set({ selectedTemplate: null, slotProps: {} });
          return;
        }
        const initialSlotProps: Record<string, Record<string, unknown>> = {};
        for (const slot of template.slots) {
          initialSlotProps[slot.id] = { ...slot.props };
        }
        set({ selectedTemplate: template, slotProps: initialSlotProps });
      },
      updateSlotProp: (slotId, name, value) =>
        set((state) => ({
          slotProps: {
            ...state.slotProps,
            [slotId]: {
              ...(state.slotProps[slotId] || {}),
              [name]: value,
            },
          },
        })),
      resetSlotProps: () =>
        set((state) => {
          if (!state.selectedTemplate) return {};
          const initialSlotProps: Record<string, Record<string, unknown>> = {};
          for (const slot of state.selectedTemplate.slots) {
            initialSlotProps[slot.id] = { ...slot.props };
          }
          return { slotProps: initialSlotProps };
        }),
    }),
    {
      name: 'playground-preferences',
      partialize: (state) => ({
        viewport: state.viewport,
        theme: state.theme,
        showGrid: state.showGrid,
      }),
    },
  ),
);
