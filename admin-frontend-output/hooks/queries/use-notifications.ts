'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { fmtNumber } from '@/lib/utils';
import type {
  NotificationHistoryItem,
  SendNotificationInput,
  SendNotificationResult,
} from '@/lib/types';

/** POST /admin/notifications/send */
export function useSendNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: SendNotificationInput) =>
      post<SendNotificationResult>('/admin/notifications/send', input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'history'] });
      toast(`Notification envoyée · ${fmtNumber(data.count)} destinataires`, 'send');
    },
  });
}

/** GET /admin/notifications/history */
export function useNotificationHistory() {
  return useQuery({
    queryKey: ['notifications', 'history'],
    queryFn: () => get<NotificationHistoryItem[]>('/admin/notifications/history'),
  });
}
