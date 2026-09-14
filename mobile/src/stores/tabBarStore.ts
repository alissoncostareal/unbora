import { create } from 'zustand';

interface TabBarState {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  show: () => void;
  hide: () => void;
}

export const useTabBarStore = create<TabBarState>((set) => ({
  visible: true,
  setVisible: (visible) => set({ visible }),
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));
