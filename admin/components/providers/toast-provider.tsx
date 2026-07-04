'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { Check, Send, X } from 'lucide-react';

/**
 * Toast (impl spec §29): fixed bottom 28px, horizontally centered over the
 * content area — `left: calc(50% + 124px)` offsets the 248px sidebar. Dark
 * #1C2320 pill, 24px status circle (jade check / jade send / danger x),
 * auto-dismiss 2600ms, toastIn animation.
 */
export type ToastIcon = 'check' | 'send' | 'x';

interface ToastContextValue {
  toast: (message: string, icon?: ToastIcon) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

interface ToastState {
  id: number;
  message: string;
  icon: ToastIcon;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const inShell = pathname !== '/login';

  const toast = useCallback((message: string, icon: ToastIcon = 'check') => {
    if (timer.current) clearTimeout(timer.current);
    setCurrent({ id: Date.now(), message, icon });
    timer.current = setTimeout(() => setCurrent(null), 2600);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {current && (
        <div
          key={current.id}
          className="animate-toast-in fixed z-[80] flex items-center gap-[10px] rounded-full py-[9px] pl-[9px] pr-[18px] text-[13.5px] font-semibold text-white"
          style={{
            bottom: 28,
            left: inShell ? 'calc(50% + 124px)' : '50%',
            transform: 'translateX(-50%)',
            background: '#1C2320',
            boxShadow: 'var(--shadow-lg)',
          }}
          role="status"
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full"
            style={{ background: current.icon === 'x' ? 'var(--danger)' : 'var(--jade)' }}
          >
            {current.icon === 'check' && <Check size={14} strokeWidth={3} color="#fff" />}
            {current.icon === 'send' && <Send size={12} strokeWidth={2.4} color="#fff" />}
            {current.icon === 'x' && <X size={14} strokeWidth={3} color="#fff" />}
          </span>
          {current.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
