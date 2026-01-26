import { create } from 'zustand';

export type ViewMode = 'sphere' | 'galaxy' | 'grid';

interface AppState {
  viewMode: ViewMode;
  isTransitioning: boolean;

  setViewMode: (mode: ViewMode) => void;
  setTransitioning: (transitioning: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  viewMode: 'sphere',
  isTransitioning: false,

  setViewMode: (mode) => set({ viewMode: mode }),
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
}));
