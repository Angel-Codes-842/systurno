import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { Ticket } from '../../types'

interface TurnosCompletadosProps {
  attendedTickets: Ticket[]
}

const badgeClasses: Record<string, string> = {
  RESULTS:  'text-[#10b981] bg-[#d1fae5] border-[#a7f3d0]',
  ANALYSIS: 'text-[#22c55e] bg-[#dcfce7] border-[#bbf7d0]',
  BUDGET:   'text-[#8b5cf6] bg-[#ede9fe] border-[#ddd6fe]',
}

const numberColor: Record<string, string> = {
  ANALYSIS: 'text-[#22c55e]',
  RESULTS:  'text-[#10b981]',
  BUDGET:   'text-[#8b5cf6]',
}

export const TurnosCompletados: React.FC<TurnosCompletadosProps> = ({ attendedTickets }) => {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm mt-10">
      <div className="flex items-center justify-between px-7 py-5 border-b border-border bg-surface-2/70">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-attended/10 text-attended">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-text uppercase tracking-wider text-sm">HISTORIAL DE ATENCIÓN</h3>
            <p className="text-[10px] text-text-muted uppercase font-black tracking-[0.15em] mt-0.5">COMPLETADOS HOY</p>
          </div>
        </div>
        <span className="bg-surface-2 text-text-muted px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border border-border shadow-sm">
          {attendedTickets.length} pacientes
        </span>
      </div>

      <div className="p-7">
        {attendedTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <CheckCircle2 className="w-16 h-16 text-border-2 mb-4" />
            <p className="text-xs font-black text-text-muted/40 uppercase tracking-[0.2em]">No hay atenciones completadas hoy</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {attendedTickets.slice().reverse().map((ticket) => {
              const svcKey = ticket.service_type ?? 'BUDGET'
              return (
                <div
                  key={ticket.id}
                  className={`flex flex-col items-center justify-center px-6 py-4 rounded-xl border-2 transition-all hover:scale-105 shadow-sm ${badgeClasses[svcKey] ?? badgeClasses.BUDGET}`}
                >
                  <span className={`text-xl font-black ${numberColor[svcKey] ?? 'text-text'}`}>
                    {ticket.ticket_number}
                  </span>
                  {ticket.service_type_display && (
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] opacity-80 mt-1">
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
