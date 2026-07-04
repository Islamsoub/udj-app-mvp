'use client';

import { useToastContext, type ToastIcon } from '@/components/providers/toast-provider';

/** `const { toast } = useToast(); toast('Étudiant créé', 'check');` */
export function useToast(): { toast: (message: string, icon?: ToastIcon) => void } {
  return useToastContext();
}
