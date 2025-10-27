import { create } from 'zustand';
import type { Resource } from '../types/resource';

type ViewMode = 'sphere' | 'galaxy' | 'grid';
type Category = 'UX' | 'Brand' | 'Art' | 'Code' | null;

interface AppState {
  viewMode: ViewMode;
  activeCategory: Category;
  selectedResource: string | null;
  isTransitioning: boolean;
  resources: Resource[];

  setViewMode: (mode: ViewMode) => void;
  setCategory: (category: Category) => void;
  setSelectedResource: (id: string | null) => void;
  setTransitioning: (transitioning: boolean) => void;
  setResources: (resources: Resource[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  viewMode: 'sphere',
  activeCategory: null,
  selectedResource: null,
  isTransitioning: false,
  resources: [],

  setViewMode: (mode) => set({ viewMode: mode }),
  setCategory: (category) => set({ activeCategory: category }),
  setSelectedResource: (id) => set({ selectedResource: id }),
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
  setResources: (resources) => set({ resources }),
}));
