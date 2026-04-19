import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from '../../contexts/WebSocketContext'
import SliderManager from '../../components/SliderManager'
import type { Ticket } from '../../types'
import { API_URL } from '../../config/api'
import { toast } from 'sonner'
import { StatsResumen } from '../../components/recepcion/StatsResumen'
import { PanelLlamados } from '../../components/recepcion/PanelLlamados'
import { TurnosCompletados } from '../../components/recepcion/TurnosCompletados'
import { Users, MonitorPlay } from 'lucide-react'
import { Navbar } from '../../components/layout/Navbar'

type SectionType = 'turnos' | 'sliders'

export default function TicketsPage() {
  const { connect, isConnected, lastNewTicket, clearLastNewTicket } = useWebSocket()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeSection, setActiveSection] = useState<SectionType>('turnos')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadTickets = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/tickets/today/`)
      if (!response.ok) throw new Error('Error cargando tickets')
      const data = await response.json()
      setTickets(data)
    } catch (err) {
      console.error('Error cargando tickets:', err)
      toast.error('Error al cargar los tickets')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    connect('checkins')
    loadTickets()
    const interval = setInterval(loadTickets, 30000)
    return () => clearInterval(interval)
  }, [connect, loadTickets])

  useEffect(() => {
    if (lastNewTicket) {
      setTickets((prev) => {
        if (prev.some((t) => t.id === lastNewTicket.id)) return prev
        return [...prev, lastNewTicket]
      })
      clearLastNewTicket()
    }
  }, [lastNewTicket, clearLastNewTicket])

  const handleCallTicket = async (ticketId: number) => {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}/call/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Error llamando ticket')
      const updatedTicket = await response.json()
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updatedTicket : t)))
      toast.success(`Turno ${updatedTicket.ticket_number} llamado`)
    } catch (err) {
      console.error('Error llamando ticket:', err)
      toast.error('Error al llamar el ticket')
    }
  }

  const handleAttendTicket = async (ticketId: number) => {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}/attend/`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Error marcando ticket')
      const updatedTicket = await response.json()
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updatedTicket : t)))
      toast.success(`Turno ${updatedTicket.ticket_number} marcado como atendido`)
    } catch (err) {
      console.error('Error marcando ticket:', err)
      toast.error('Error al marcar el ticket')
    }
  }

  const handleCancelTicket = async (ticketId: number) => {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}/cancel/`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Error marcando como ausente')
      const updatedTicket = await response.json()
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updatedTicket : t)))
      toast.info(`Turno ${updatedTicket.ticket_number} marcado como AUSENTE`)
    } catch (err) {
      console.error('Error marcando como ausente:', err)
      toast.error('Error al cancelar el ticket')
    }
  }

  const handleRecallTicket = async (ticketId: number) => {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}/recall/`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Error al volver a llamar')
      toast.success('El campanazo y anuncio han sido repetidos en la TV.')
    } catch (err) {
      console.error('Error re-llamando:', err)
      toast.error('Error al re-llamar el ticket')
    }
  }

  // Orden de prioridades: 1. Resultados, 2. Análisis, 3. Presupuesto
  const getPriority = (serviceType: string | undefined) => {
    switch (serviceType) {
      case 'RESULTS': return 1;
      case 'ANALYSIS': return 2;
      case 'BUDGET': return 3;
      default: return 4;
    }
  };

  const waitingTickets = tickets
    .filter((t) => t.status === 'WAITING')
    .sort((a, b) => {
      const priorityA = getPriority(a.service_type);
      const priorityB = getPriority(b.service_type);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  const calledTickets = tickets.filter((t) => t.status === 'CALLED')
  const attendedTickets = tickets.filter((t) => t.status === 'ATTENDED')

  // Atajos de teclado Súper Velocidad 
  useEffect(() => {
    if (activeSection !== 'turnos') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo o en un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // ESPACIO = LLAMAR PRÓXIMO EN ESPERA
      if (e.code === 'Space') {
        e.preventDefault();
        if (waitingTickets.length > 0) {
          handleCallTicket(waitingTickets[0].id);
        } else {
          toast.info('No hay turnos en espera para llamar.');
        }
      } 
      // ENTER = MARCAR COMO ATENDIDO (El más antiguo llamado)
      else if (e.code === 'Enter') {
        e.preventDefault();
        if (calledTickets.length > 0) {
          handleAttendTicket(calledTickets[calledTickets.length - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [waitingTickets, calledTickets, activeSection]);

  const menuItems = [
    {
      id: 'turnos' as SectionType,
      label: 'Gestión de Turnos',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'sliders' as SectionType,
      label: 'Sliders Sala Espera',
      icon: <MonitorPlay className="w-5 h-5" />,
    },
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Navbar Superior - Estilo Red Social / App Moderna */}
      <Navbar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        menuItems={menuItems}
        currentTime={currentTime}
        isConnected={isConnected}
        loadTickets={loadTickets}
      />

      {/* Main Content Area */}

        {/* Content Area */}
        <main className="flex-1 px-8 lg:px-12 py-10 overflow-auto bg-[#f8fafc]">
          {activeSection === 'turnos' ? (
            <div className="max-w-7xl mx-auto">
              
              <StatsResumen 
                total={tickets.length} 
                waiting={waitingTickets.length} 
                called={calledTickets.length} 
                attended={attendedTickets.length} 
              />

              {isLoading ? (
                <div className="text-center py-20">
                  <svg className="animate-spin h-10 w-10 text-[#1e3a5f] mx-auto mb-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-gray-500 text-lg">Cargando turnos operacionales...</p>
                </div>
              ) : (
                <PanelLlamados 
                  waitingTickets={waitingTickets} 
                  calledTickets={calledTickets} 
                  handleCallTicket={handleCallTicket} 
                  handleAttendTicket={handleAttendTicket}
                  handleCancelTicket={handleCancelTicket}
                  handleRecallTicket={handleRecallTicket} 
                />
              )}

              <TurnosCompletados attendedTickets={attendedTickets} />
            </div>
          ) : (
            <SliderManager />
          )}
        </main>
      </div>
  )
}
