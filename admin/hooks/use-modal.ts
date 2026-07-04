'use client';

import type { ReactNode } from 'react';
import { useModalStore } from '@/stores/modal-store';

/** AdminUI.open / AdminUI.close pattern (impl spec §6). */
export function useModal(): { open: (node: ReactNode) => void; close: () => void } {
  const open = useModalStore((s) => s.open);
  const close = useModalStore((s) => s.close);
  return { open, close };
}
