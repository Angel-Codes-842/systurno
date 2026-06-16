import { useEffect, useRef } from 'react';
import type { Ticket, TicketStats } from '@/types';
import { useWebSocket, type UseWebSocketOptions } from './useWebSocket';
import { getWaitingTickets, getTicketStats } from '@/services/api';

const POLLING_INTERVAL_MS = 10_000;

interface UseTicketEventsOptions extends UseWebSocketOptions {
  onWaitingTicketsUpdate?: (tickets: Ticket[]) => void;
  onStatsUpdate?: (stats: TicketStats) => void;
  wsUrl: string;
}

export function useTicketEvents(options: UseTicketEventsOptions) {
  const {
    wsUrl,
    onWaitingTicketsUpdate,
    onStatsUpdate,
    ...wsOptions
  } = options;

  const { isConnected } = useWebSocket(wsUrl, wsOptions);

  const isConnectedRef = useRef(isConnected);
  isConnectedRef.current = isConnected;

  const onWaitingTicketsUpdateRef = useRef(onWaitingTicketsUpdate);
  onWaitingTicketsUpdateRef.current = onWaitingTicketsUpdate;

  const onStatsUpdateRef = useRef(onStatsUpdate);
  onStatsUpdateRef.current = onStatsUpdate;

  useEffect(() => {
    const poll = async () => {
      if (isConnectedRef.current) return;
      try {
        const [tickets, stats] = await Promise.all([
          getWaitingTickets(),
          getTicketStats(),
        ]);
        onWaitingTicketsUpdateRef.current?.(tickets);
        onStatsUpdateRef.current?.(stats);
      } catch {
        // silent fail on poll
      }
    };

    const interval = setInterval(poll, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []); // run once, uses refs

  return { isConnected };
}
