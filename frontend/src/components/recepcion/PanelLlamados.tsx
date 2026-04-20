import React from 'react'
import { Clock, Volume2, ChevronRight, CheckCircle2, XCircle, RefreshCw, CheckCircle, Phone } from 'lucide-react'
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
  ANALYSIS: 'bg-[#d97706]',
  RESULTS:  'bg-[#00b4d8]',
  BUDGET:   'bg-[#6b9b37]',
}

const serviceName: Record<string, string> = {
  ANALYSIS: 'Realizar Análisis',
  RESULTS:  'Retirar Resultados',
  BUDGET:   'Solicitar Presupuesto',
}

const badgeColor: Record<string, string> = {
  RESULTS:  'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/30',
  ANALYSIS: 'text-[#93c5fd] bg-[#2563eb]/10 border-[#2563eb]/30',
  BUDGET:   'text-[#94a3b8] bg-white/5 border-white/10',
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
      <h2 className="text-xs font-semibold tracking-widest text-[#64748b] uppercase">Panel de Control de Filas</h2>

      <div className="grid grid-cols-2 gap-6 h-[360px]">

        {/* ── Fila de Espera ── */}
        <div className="flex flex-col rounded-xl border border-[#1e293b] bg-[#131B2C] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e293b] bg-[#0f1c2e]/40">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#d97706]/20">
                <Clock className="w-4 h-4 text-[#d97706]" />
              </div>
              <h3 className="font-semibold text-white text-sm">Fila de Espera</h3>
            </div>
            <span className="text-xs font-medium text-[#94a3b8] bg-[#1e293b] px-2.5 py-1 rounded-full">
              {waitingTickets.length} turnos
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {waitingTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#64748b]">
                <Clock className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">No hay turnos en espera</p>
              </div>
            ) : (
              waitingTickets.map((ticket, index) => {
                const svc = ticket.service_type ?? 'BUDGET'
                const isNext = index === 0
                const bg = ticketBg[svc] ?? 'bg-[#334155]'
                return (
                  <div
                    key={ticket.id}
                    className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      isNext
                        ? 'bg-[#00b4d8]/10 border-[#00b4d8]/30 ring-1 ring-[#00b4d8]/20'
                        : 'bg-[#1e293b]/40 border-[#1e293b] hover:bg-[#1e293b]/70 hover:border-[#00b4d8]/20'
                    }`}
                  >
                    {/* Número */}
                    <div className={`flex items-center justify-center w-14 h-14 rounded-xl font-bold text-lg text-[#0f1c2e] shrink-0 ${bg}`}>
                      {ticket.ticket_number}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {isNext && (
                          <span className="text-[10px] font-semibold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/30 px-1.5 py-0.5 rounded">
                            Siguiente
                          </span>
                        )}
                        <span className="text-sm font-medium text-white truncate">
                          {ticket.service_type_display ?? serviceName[svc]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#64748b]">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.created_at).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    </div>

                    {/* Botón llamar */}
                    <Button
                      variant={isNext ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handleCallTicket(ticket.id)}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Llamar
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Atención Activa ── */}
        <div className="flex flex-col rounded-xl border border-[#1e293b] bg-[#131B2C] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e293b] bg-[#0f1c2e]/40">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#0ea5e9]/20">
                <Volume2 className="w-4 h-4 text-[#0ea5e9]" />
              </div>
              <h3 className="font-semibold text-white text-sm">Atención Activa</h3>
            </div>
            <span className="text-xs font-medium text-[#94a3b8] bg-[#1e293b] px-2.5 py-1 rounded-full">
              {calledTickets.length} llamando
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {calledTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#64748b]">
                <div className="p-3 rounded-full bg-[#1e293b]/50 mb-3">
                  <Volume2 className="w-8 h-8 opacity-30" />
                </div>
                <p className="text-sm mb-1">Sin atención activa</p>
                <p className="text-xs opacity-70">Llama al siguiente turno para comenzar</p>
              </div>
            ) : (
              calledTickets.map((ticket, index) => {
                const svc = ticket.service_type ?? 'BUDGET'
                const bg = ticketBg[svc] ?? 'bg-[#334155]'
                return (
                  <div key={ticket.id} className="flex flex-col p-3 rounded-xl border border-[#1e293b] bg-[#0f1c2e]/40 gap-3">
                    {/* Ticket display */}
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-16 h-16 rounded-xl font-bold text-2xl text-white shrink-0 ${bg}`}>
                        {ticket.ticket_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-semibold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Atendiendo
                          </span>
                          {ticket.service_type_display && (
                            <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded uppercase tracking-wider ${badgeColor[svc] ?? ''}`}>
                              {ticket.service_type_display}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-white truncate">
                          {ticket.service_type_display ?? serviceName[svc]}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-[#64748b] mt-0.5">
                          <Clock className="w-3 h-3" />
                          Llamado a las {ticket.called_at && new Date(ticket.called_at).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="grid grid-cols-3 gap-2">
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
