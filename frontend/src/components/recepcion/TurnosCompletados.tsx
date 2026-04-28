import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { Ticket } from '../../types'

interface TurnosCompletadosProps {
  attendedTickets: Ticket[]
}

const badgeClasses: Record<string, string> = {
  RESULTS:  'text-success border-success/30 bg-success/10',
  ANALYSIS: 'text-primary border-primary/30 bg-primary/10',
  BUDGET:   'text-text-muted border-border bg-surface-2',
}

const numberColor: Record<string, string> = {
  ANALYSIS: 'text-primary',
  RESULTS:  'text-success',
  BUDGET:   'text-text',
}

export const TurnosCompletados: React.FC<TurnosCompletadosProps> = ({ attendedTickets }) => {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm mt-8">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/20">
            <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-bold text-text uppercase tracking-widest text-sm">Historial de Atención</h3>
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mt-0.5">Completados hoy</p>
          </div>
        </div>
        <span className="bg-surface text-text-muted px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-border shadow-sm">
          {attendedTickets.length} pacientes
        </span>
      </div>

      <div className="p-5">
        {attendedTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-text-muted opacity-30 mb-3" />
            <p className="text-sm font-bold text-text-muted uppercase tracking-widest">No hay atenciones completadas hoy</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {attendedTickets.slice().reverse().map((ticket) => {
              const svcKey = ticket.service_type ?? 'BUDGET'
              return (
                <div
                  key={ticket.id}
                  className={`flex flex-col items-center justify-center px-4 py-3 rounded-xl border transition-transform hover:-translate-y-1 shadow-sm ${badgeClasses[svcKey] ?? badgeClasses.BUDGET}`}
                >
                  <span className={`text-xl font-extrabold ${numberColor[svcKey] ?? 'text-text'}`}>
                    {ticket.ticket_number}
                  </span>
                  {ticket.service_type_display && (
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 mt-1">
                      {ticket.service_type_display}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
