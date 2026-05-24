import { useEffect, useRef } from 'react';
import { authStore } from '../store/authStore';
import type { Notification } from '../types';

export function useSSE(onNotification: (n: Notification) => void): void {
  const esRef = useRef<EventSource | null>(null);
  const token = authStore.getToken();

  useEffect(() => {
    if (!token) return;

    // We pass the token via a query param since EventSource doesn't support headers
    const es = new EventSource(`/api/notifications/stream?_token=${token}`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as { type: string; data: Notification };
        if (parsed.type === 'new_notification') {
          onNotification(parsed.data);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects; we don't need to do anything
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
}
