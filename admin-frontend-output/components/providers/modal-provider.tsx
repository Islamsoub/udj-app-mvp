'use client';

import { useEffect } from 'react';
import { useModalStore } from '@/stores/modal-store';

/**
 * ModalRoot (impl spec §6): fixed full-screen scrim rgba(16,22,20,.45) +
 * blur(2px), z-60, padding 24, fadeIn .16s. Centers the modal node; closes on
 * scrim mousedown and on Escape.
 */
export function ModalProvider() {
  const node = useModalStore((s) => s.node);
  const close = useModalStore((s) => s.close);

  useEffect(() => {
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [node, close]);

  if (!node) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center p-6"
      style={{ background: 'var(--scrim)', backdropFilter: 'blur(2px)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      {node}
    </div>
  );
}
