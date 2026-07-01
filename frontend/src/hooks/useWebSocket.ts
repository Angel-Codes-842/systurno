import { useEffect, useRef, useState, useCallback } from 'react';
import type { Ticket } from '@/types';

export interface UseWebSocketOptions {
  onTicketCalled?: (ticket: Ticket) => void;
  onNewTicket?: (ticket: Ticket) => void;
  onSliderUpdate?: () => void;
}

/** Pure function: delay(n) = min(1000 * 2^n, 30000) */
export function calcReconnectDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30000);
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Keep options stable via ref to avoid re-connecting on every render
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    // Construct absolute WebSocket URL if a relative path is provided
    let wsUrl = url;
    if (url.startsWith('/')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let host = window.location.host;
      
      // Si el frontend corre en el puerto 3000 (Vite), redirigir directamente al puerto 8000 (Django Channels)
      if (host.includes(':3000')) {
        host = host.replace(':3000', ':8000');
      }
      
      wsUrl = `${protocol}//${host}${url}`;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      setIsConnected(true);
      attemptRef.current = 0;
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!isMountedRef.current) return;
      try {
        const data = JSON.parse(event.data as string) as {
          type: string;
          ticket?: Ticket;
        };
        switch (data.type) {
          case 'ticket_called':
            if (data.ticket) optionsRef.current.onTicketCalled?.(data.ticket);
            break;
          case 'new_ticket':
            if (data.ticket) optionsRef.current.onNewTicket?.(data.ticket);
            break;
          case 'slider_update':
            optionsRef.current.onSliderUpdate?.();
            break;
          default:
            break;
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = (event: CloseEvent) => {
      if (!isMountedRef.current) return;
      setIsConnected(false);
      wsRef.current = null;

      // Only reconnect if not a clean close (code 1000)
      if (event.code !== 1000 && isMountedRef.current) {
        const delay = calcReconnectDelay(attemptRef.current);
        attemptRef.current += 1;
        timeoutRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      // onclose will fire after onerror — let it handle reconnection
    };
  }, [url]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000);
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected };
}
