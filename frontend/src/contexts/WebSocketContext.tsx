import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import type { WSEvent, WSTicketCalledEvent, WSNewTicketEvent, Ticket } from '../types'
import { WS_URL } from '../config/api'

// Información de ticket llamado (sistema simple)
interface CalledTicketInfo {
  ticket: Ticket
  calledAt: Date
}

interface WebSocketContextType {
  isConnected: boolean
  lastCalledTicket: CalledTicketInfo | null
  lastNewTicket: Ticket | null
  sliderUpdateTrigger: number
  connect: (channel?: string) => Promise<void>
  disconnect: () => void
  clearLastCalledTicket: () => void
  clearLastNewTicket: () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

// Clase simple para manejar WebSocket
class WebSocketManager {
  private ws: WebSocket | null = null
  private messageHandlers: Set<(event: WSEvent) => void> = new Set()
  private stateHandlers: Set<(connected: boolean) => void> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 50
  private reconnectDelay = 2000
  private currentChannel: string | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  connect(channel: string = 'checkins'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      this.currentChannel = channel
      const url = `${WS_URL}/${channel}/`

      try {
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          console.log('WebSocket conectado')
          this.reconnectAttempts = 0
          this.stateHandlers.forEach(h => h(true))
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WSEvent
            this.messageHandlers.forEach(handler => handler(data))
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        this.ws.onclose = () => {
          console.log('WebSocket desconectado')
          this.stateHandlers.forEach(h => h(false))
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private attemptReconnect() {
    if (this.currentChannel) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.reconnectAttempts = Math.floor(this.maxReconnectAttempts / 2)
      }
      this.reconnectAttempts++
      const backoff = Math.min(30000, this.reconnectDelay * Math.pow(1.3, this.reconnectAttempts))
      console.log(`Reconectando (intento ${this.reconnectAttempts}, espera ${Math.round(backoff)}ms)...`)
      this.reconnectTimer = setTimeout(() => {
        if (this.currentChannel) {
          this.connect(this.currentChannel).catch(console.error)
        }
      }, backoff)
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.currentChannel = null
    this.reconnectAttempts = 0
  }

  addStateHandler(handler: (connected: boolean) => void) {
    this.stateHandlers.add(handler)
  }

  removeStateHandler(handler: (connected: boolean) => void) {
    this.stateHandlers.delete(handler)
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  addMessageHandler(handler: (event: WSEvent) => void) {
    this.messageHandlers.add(handler)
  }

  removeMessageHandler(handler: (event: WSEvent) => void) {
    this.messageHandlers.delete(handler)
  }
}

const wsManager = new WebSocketManager()

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastCalledTicket, setLastCalledTicket] = useState<CalledTicketInfo | null>(null)
  const [lastNewTicket, setLastNewTicket] = useState<Ticket | null>(null)
  const [sliderUpdateTrigger, setSliderUpdateTrigger] = useState(0)
  const handlerRef = useRef<((event: WSEvent) => void) | null>(null)
  const stateHandlerRef = useRef<((connected: boolean) => void) | null>(null)

  const handleWSMessage = useCallback((event: WSEvent) => {
    if (event.type === 'ticket_called') {
      const ticketEvent = event as WSTicketCalledEvent
      setLastCalledTicket({
        ticket: ticketEvent.ticket,
        calledAt: new Date(),
      })
    } else if (event.type === 'new_ticket') {
      const ticketEvent = event as WSNewTicketEvent
      setLastNewTicket(ticketEvent.ticket)
    } else if (event.type === 'slider_update') {
      // Incrementar trigger para que los componentes recarguen sliders
      setSliderUpdateTrigger(prev => prev + 1)
    }
  }, [])

  const connect = useCallback(async (channel: string = 'checkins'): Promise<void> => {
    try {
      if (handlerRef.current) {
        wsManager.removeMessageHandler(handlerRef.current)
      }
      if (stateHandlerRef.current) {
        wsManager.removeStateHandler(stateHandlerRef.current)
      }

      handlerRef.current = handleWSMessage
      wsManager.addMessageHandler(handleWSMessage)

      stateHandlerRef.current = (connected: boolean) => setIsConnected(connected)
      wsManager.addStateHandler(stateHandlerRef.current)

      await wsManager.connect(channel)
    } catch (error) {
      console.error('Error conectando WebSocket:', error)
      setIsConnected(false)
    }
  }, [handleWSMessage])

  const disconnect = useCallback(() => {
    if (handlerRef.current) {
      wsManager.removeMessageHandler(handlerRef.current)
      handlerRef.current = null
    }
    if (stateHandlerRef.current) {
      wsManager.removeStateHandler(stateHandlerRef.current)
      stateHandlerRef.current = null
    }
    wsManager.disconnect()
    setIsConnected(false)
  }, [])

  const clearLastCalledTicket = useCallback(() => {
    setLastCalledTicket(null)
  }, [])

  const clearLastNewTicket = useCallback(() => {
    setLastNewTicket(null)
  }, [])

  const value: WebSocketContextType = {
    isConnected,
    lastCalledTicket,
    lastNewTicket,
    sliderUpdateTrigger,
    connect,
    disconnect,
    clearLastCalledTicket,
    clearLastNewTicket,
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket debe usarse dentro de un WebSocketProvider')
  }
  return context
}

export default WebSocketContext
