import React from 'react'
import { Clock, Volume2, XCircle, RefreshCw, CheckCircle, Phone, ArrowRight } from 'lucide-react'
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
  ANALYSIS: 'bg-[#22c55e] text-white',
  RESULTS:  'bg-[#10b981] text-white',
  BUDGET:   'bg-[#8b5cf6] text-white',
}

const serviceName: Record<string, string> = {
  ANALYSIS: 'REALIZAR ANÁLISIS',
  RESULTS:  'RETIRAR RESULTADOS',
  BUDGET:   'SOLICITAR PRESUPUESTO',
}

const serviceBadge: Record<string, string> = {
  RESULTS:  'text-[#10b981] bg-[#d1fae5] border-[#a7f3d0]',
  ANALYSIS: 'text-[#22c55e] bg-[#dcfce7] border-[#bbf7d0]',
  BUDGET:   'text-[#8b5cf6] bg-[#ede9fe] border-[#ddd6fe]',
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
    <section className="space-y-5">
      <h2 className="text-xs font-black tracking-widest text-text-muted uppercase px-1">Panel de Control de Filas</h2>

      <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_1fr] gap-6">

        {/* ── Fila de Espera ── */}
        <div className="flex flex-col rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-7 py-5 border-b border-border bg-surface-2/70">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-waiting" aria-hidden="true" />
              <h3 className="font-black text-text-muted text-[11px] uppercase tracking-widest">
                FILA DE ESPERA
              </h3>
            </div>
            <span className="text-[10px] font-black text-waiting bg-waiting/10 border border-waiting/20 px-3 py-1.5 rounded-lg uppercase tracking-widest">
              {waitingTickets.length} turnos
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-surface">
            {waitingTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-text-muted/30">
                <Clock className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sin turnos en espera</p>
              </div>
            ) : (
              waitingTickets.map((ticket, index) => {
                const svc = ticket.service_type ?? 'BUDGET'
                const isNext = index === 0
                const styling = ticketBg[svc] ?? 'bg-surface-2 text-text'
                return (
                  <div
                    key={ticket.id}
                    className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                      isNext
                        ? 'bg-called/5 border-called/20 shadow-sm'
                        : 'bg-surface border-border hover:border-border-2 hover:shadow-sm'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-14 h-14 rounded-xl font-black text-xl shrink-0 shadow-sm ${styling}`}>
                      {ticket.ticket_number}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        {isNext && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-called bg-called/10 border border-called/20 px-2 py-0.5 rounded-md uppercase tracking-widest">
                            SIGUIENTE <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                        <span className="text-sm font-black text-text truncate uppercase tracking-tight">
                          {ticket.service_type_display ?? serviceName[svc]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-text-muted font-bold uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5 opacity-40" />
                        {new Date(ticket.created_at).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    </div>

                    <Button
                      variant={isNext ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handleCallTicket(ticket.id)}
                      className="h-11 px-5 shrink-0"
                    >
                      <Phone className="w-4 h-4" />
                      Llamar
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Atención Activa ── */}
        <div className="flex flex-col rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-7 py-5 border-b border-border bg-surface-2/70">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-called" aria-hidden="true" />
              <h3 className="font-black text-text text-[11px] uppercase tracking-widest">ATENCIÓN ACTIVA</h3>
            </div>
            <span className="text-[10px] font-black text-called bg-called/10 border border-called/20 px-3 py-1.5 rounded-lg uppercase tracking-widest">
              {calledTickets.length} llamando
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface">
            {calledTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-text-muted/30">
                <Volume2 className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sin atención activa</p>
              </div>
            ) : (
              calledTickets.map((ticket) => {
                const svc = ticket.service_type ?? 'BUDGET'
                const styling = ticketBg[svc] ?? 'bg-surface-2 text-text'
                return (
                  <div key={ticket.id} className="flex flex-col p-5 rounded-xl border border-border bg-surface shadow-sm gap-5 transition-all duration-200 hover:border-called/20">
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-16 h-16 rounded-xl font-black text-2xl shrink-0 shadow-sm ${styling}`}>
                        {ticket.ticket_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[9px] font-black text-attended bg-attended/10 border border-attended/20 px-2 py-0.5 rounded-md uppercase tracking-widest">
                            ATENDIENDO
                          </span>
                          {ticket.service_type_display && (
                            <span className={`text-[9px] font-black border px-2 py-0.5 rounded-md uppercase tracking-widest ${serviceBadge[svc] ?? ''}`}>
                              {ticket.service_type_display}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-black text-text truncate uppercase tracking-tight">
                          {ticket.service_type_display ?? serviceName[svc]}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-text-muted font-bold uppercase tracking-widest mt-1.5">
                          <Clock className="w-3.5 h-3.5 opacity-40" />
                          Llamado a las {ticket.called_at && new Date(ticket.called_at).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <Button variant="danger" size="sm" onClick={() => handleCancelTicket(ticket.id)} className="min-h-[42px]">
                        <XCircle className="w-4 h-4" />
                        Ausente
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleRecallTicket(ticket.id)} className="min-h-[42px]">
                        <RefreshCw className="w-4 h-4" />
                        Re-llamar
                      </Button>
                      <Button variant="success" size="sm" onClick={() => handleAttendTicket(ticket.id)} className="min-h-[42px]">
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
