import { create } from 'zustand';
import type { ReactNode } from 'react';

/**
 * Global modal store — the AdminUI.open/close pattern from the prototype
 * (impl spec §6). One modal node at a time; ModalRoot (modal-provider.tsx)
 * renders it over a scrim and closes on Esc / scrim mousedown.
 */
interface ModalState {
  node: ReactNode | null;
  open: (node: ReactNode) => void;
  close: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  node: null,
  open: (node) => set({ node }),
  close: () => set({ node: null }),
}));
