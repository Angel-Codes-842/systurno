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
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private currentChannel: string | null = null

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
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.currentChannel) {
      this.reconnectAttempts++
      console.log(`Intentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      setTimeout(() => {
        if (this.currentChannel) {
          this.connect(this.currentChannel).catch(console.error)
        }
      }, this.reconnectDelay)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.currentChannel = null
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
      // Remover handler anterior si existe
      if (handlerRef.current) {
        wsManager.removeMessageHandler(handlerRef.current)
      }
      
      handlerRef.current = handleWSMessage
      wsManager.addMessageHandler(handleWSMessage)
      await wsManager.connect(channel)
      setIsConnected(true)
      
      // Verificar conexión periódicamente
      setInterval(() => {
        setIsConnected(wsManager.isConnected())
      }, 3000)
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
