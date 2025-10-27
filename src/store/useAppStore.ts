import { create } from 'zustand';

type ViewMode = 'sphere' | 'galaxy' | 'grid';
type Category = 'UX' | 'Brand' | 'Art' | 'Code' | null;

interface AppState {
  viewMode: ViewMode;
  activeCategory: Category;
  selectedResource: string | null;
  isTransitioning: boolean;

  setViewMode: (mode: ViewMode) => void;
  setCategory: (category: Category) => void;
  setSelectedResource: (id: string | null) => void;
  setTransitioning: (transitioning: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  viewMode: 'sphere',
  activeCategory: null,
  selectedResource: null,
  isTransitioning: false,

  setViewMode: (mode) => set({ viewMode: mode }),
  setCategory: (category) => set({ activeCategory: category }),
  setSelectedResource: (id) => set({ selectedResource: id }),
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
}));
