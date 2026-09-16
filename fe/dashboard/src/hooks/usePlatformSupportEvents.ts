import { useEffect } from 'react';
import { events } from 'aws-amplify/api';
import { useQueryClient } from '@tanstack/react-query';
import { EVENTS_ENDPOINT } from '@/lib/amplify';

/** Live hints make the local console responsive; persisted lists are re-read
 * after reconnect because AppSync channels do not buffer missed events. */
export function usePlatformSupportEvents(userId?: string) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!userId || !EVENTS_ENDPOINT || !import.meta.env.VITE_APPSYNC_EVENTS_URL) return;
    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let close: (() => void) | undefined;
    let attempts = 0;
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['platform-overview'] });
      void queryClient.invalidateQueries({ queryKey: ['platform-tickets'] });
      void queryClient.invalidateQueries({ queryKey: ['platform-ticket'] });
      void queryClient.invalidateQueries({ queryKey: ['platform-incidents'] });
    };
    const reconnect = () => {
      close?.(); close = undefined;
      if (disposed) return;
      retryTimer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** attempts++));
    };
    const connect = async () => {
      try {
        const channel = await events.connect(`/support/${userId}`);
        if (disposed) { channel.close(); return; }
        attempts = 0;
        refresh();
        const subscription = channel.subscribe({ next: refresh, error: reconnect });
        close = () => { subscription.unsubscribe(); channel.close(); };
      } catch { reconnect(); }
    };
    void connect();
    return () => { disposed = true; if (retryTimer) clearTimeout(retryTimer); close?.(); };
  }, [userId, queryClient]);
}
