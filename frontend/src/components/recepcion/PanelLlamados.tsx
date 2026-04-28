import React from 'react'
import { Clock, Volume2, ChevronRight, XCircle, RefreshCw, CheckCircle, Phone } from 'lucide-react'
import type { Ticket } from '../../types'
import { Button } from '../ui/Button'

interface PanelLlamadosProps {
  waitingTickets: Ticket[]
  calledTickets: Ticket[]
  handleCallTicket: (id: number) => void
  handleAttendTicket: (id: number) => void
  handleCancelTicket: (id: number) => void
  handleRecallTicket: (id: number) => void
}

const ticketBg: Record<string, string> = {
  ANALYSIS: 'bg-primary text-white',
  RESULTS:  'bg-success text-white',
  BUDGET:   'bg-border-2 text-text',
}

const serviceName: Record<string, string> = {
  ANALYSIS: 'Realizar Análisis',
  RESULTS:  'Retirar Resultados',
  BUDGET:   'Solicitar Presupuesto',
}

const badgeColor: Record<string, string> = {
  RESULTS:  'text-success bg-success/10 border-success/30',
  ANALYSIS: 'text-primary bg-primary/10 border-primary/30',
  BUDGET:   'text-text-muted bg-surface-2 border-border',
}

export const PanelLlamados: React.FC<PanelLlamadosProps> = ({
  waitingTickets,
  calledTickets,
  handleCallTicket,
  handleAttendTicket,
  handleCancelTicket,
  handleRecallTicket,
}) => {
  return (
    <section className="space-y-3 mb-6">
      <h2 className="text-xs font-bold tracking-widest text-text-muted uppercase">Panel de Control de Filas</h2>

      <div className="grid grid-cols-2 gap-6 h-[400px]">

        {/* ── Fila de Espera ── */}
        <div className="flex flex-col rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-warning/20">
                <Clock className="w-5 h-5 text-warning" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-text text-sm">Fila de Espera</h3>
            </div>
            <span className="text-xs font-bold text-text-muted bg-surface border border-border px-3 py-1.5 rounded-full">
              {waitingTickets.length} turnos
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface">
            {waitingTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <Clock className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No hay turnos en espera</p>
              </div>
            ) : (
              waitingTickets.map((ticket, index) => {
                const svc = ticket.service_type ?? 'BUDGET'
                const isNext = index === 0
                const styling = ticketBg[svc] ?? 'bg-surface-2 text-text border-border'
                return (
                  <div
                    key={ticket.id}
                    className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${
                      isNext
                        ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20 shadow-sm'
                        : 'bg-surface border-border hover:border-primary/30 hover:shadow-sm'
                    }`}
                  >
                    {/* Número */}
                    <div className={`flex items-center justify-center w-14 h-14 rounded-xl font-extrabold text-xl shrink-0 shadow-sm ${styling}`}>
                      {ticket.ticket_number}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isNext && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider">
                            Siguiente
                          </span>
                        )}
                        <span className="text-sm font-bold text-text truncate">
                          {ticket.service_type_display ?? serviceName[svc]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(ticket.created_at).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    </div>

                    {/* Botón llamar */}
                    <Button
                      variant={isNext ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handleCallTicket(ticket.id)}
                    >
                      <Phone className="w-4 h-4" />
                      Llamar
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Atención Activa ── */}
        <div className="flex flex-col rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <Volume2 className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-text text-sm">Atención Activa</h3>
            </div>
            <span className="text-xs font-bold text-text-muted bg-surface border border-border px-3 py-1.5 rounded-full">
              {calledTickets.length} llamando
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface">
            {calledTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <div className="p-4 rounded-full bg-surface-2 border border-border mb-4">
                  <Volume2 className="w-8 h-8 opacity-40" />
                </div>
                <p className="text-sm font-bold mb-1">Sin atención activa</p>
                <p className="text-xs opacity-70">Llama al siguiente turno para comenzar</p>
              </div>
            ) : (
              calledTickets.map((ticket) => {
                const svc = ticket.service_type ?? 'BUDGET'
                const styling = ticketBg[svc] ?? 'bg-surface-2 text-text border-border'
                return (
                  <div key={ticket.id} className="flex flex-col p-4 rounded-2xl border border-border bg-surface shadow-sm gap-4 transition-all duration-200 hover:border-primary/30">
                    {/* Ticket display */}
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-16 h-16 rounded-xl font-extrabold text-2xl shrink-0 shadow-sm ${styling}`}>
                        {ticket.ticket_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded uppercase tracking-wider">
                            Atendiendo
                          </span>
                          {ticket.service_type_display && (
                            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded uppercase tracking-wider ${badgeColor[svc] ?? ''}`}>
                              {ticket.service_type_display}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-text truncate">
                          {ticket.service_type_display ?? serviceName[svc]}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          Llamado a las {ticket.called_at && new Date(ticket.called_at).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="grid grid-cols-3 gap-3">
                      <Button variant="danger" size="sm" onClick={() => handleCancelTicket(ticket.id)}>
                        <XCircle className="w-4 h-4" />
                        Ausente
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleRecallTicket(ticket.id)}>
                        <RefreshCw className="w-4 h-4" />
                        Re-llamar
                      </Button>
                      <Button variant="success" size="sm" onClick={() => handleAttendTicket(ticket.id)}>
                        <CheckCircle className="w-4 h-4" />
                        Finalizar
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
    </section>
  )
}
