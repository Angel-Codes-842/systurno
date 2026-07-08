import { useEffect, useRef, useState } from 'react';
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

  // Keep options stable via ref to avoid re-connecting on every render
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    // ── Per-effect-instance flag ──────────────────────────────────────────
    // Using a local `wsActive` instead of a shared ref prevents the race
    // condition caused by React StrictMode's double-mount: when the first
    // effect cleans up and the second one mounts, the old WebSocket can
    // still receive messages while `isMountedRef` has already been set back
    // to true by the new mount.  A closure-scoped flag is immune to this.
    let wsActive = true;
    let ws: WebSocket | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    function connect() {
      if (!wsActive) return;

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

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!wsActive) return;
        setIsConnected(true);
        attempt = 0;
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!wsActive) return;   // ← flag local: esta conexión ya no es válida
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
        if (!wsActive) return;
        setIsConnected(false);
        ws = null;

        // Only reconnect if not a clean close (code 1000)
        if (event.code !== 1000) {
          const delay = calcReconnectDelay(attempt);
          attempt += 1;
          timeoutId = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        // onclose will fire after onerror — let it handle reconnection
      };
    }

    connect();

    return () => {
      wsActive = false;   // ← invalida esta instancia de conexión antes de cerrarla
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (ws) {
        ws.close(1000);
        ws = null;
      }
      setIsConnected(false);
    };
  }, [url]);   // solo se reconecta si cambia la URL

  return { isConnected };
}
