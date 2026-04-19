// Estados de ticket
export type TicketStatus = 'WAITING' | 'CALLED' | 'ATTENDED'

// Ticket simple
export interface Ticket {
  id: number
  ticket_number: string
  status: TicketStatus
  status_display?: string
  service_type?: 'ANALYSIS' | 'RESULTS' | 'BUDGET'
  service_type_display?: string
  created_at: string
  called_at?: string
  attended_at?: string
}

// Eventos WebSocket
export interface WSTicketCalledEvent {
  type: 'ticket_called'
  ticket: Ticket
}

export interface WSNewTicketEvent {
  type: 'new_ticket'
  ticket: Ticket
}

export interface WSSliderUpdateEvent {
  type: 'slider_update'
}

export type WSEvent = WSTicketCalledEvent | WSNewTicketEvent | WSSliderUpdateEvent
