import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { Ticket } from '../../types'

interface TurnosCompletadosProps {
  attendedTickets: Ticket[]
}

const badgeClasses: Record<string, string> = {
  RESULTS:  'text-[#22c55e] border border-[#22c55e]/30 bg-[#22c55e]/10',
  ANALYSIS: 'text-[#d97706] border border-[#d97706]/30 bg-[#d97706]/10',
  BUDGET:   'text-[#00b4d8] border border-[#00b4d8]/30 bg-[#00b4d8]/10',
}

const numberColor: Record<string, string> = {
  ANALYSIS: 'text-[#d97706]',
  RESULTS:  'text-[#22c55e]',
  BUDGET:   'text-[#00b4d8]',
}

export const TurnosCompletados: React.FC<TurnosCompletadosProps> = ({ attendedTickets }) => {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#131B2C] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b] bg-[#0f1c2e]/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#22c55e]/20">
            <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
          </div>
          <div>
            <h3 className="font-black text-white uppercase tracking-widest text-sm">Historial de Atención</h3>
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest">Completados hoy</p>
          </div>
        </div>
        <span className="bg-[#0f1c2e] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
          {attendedTickets.length} pacientes
        </span>
      </div>

      <div className="p-4">
        {attendedTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#94a3b8]/20 mb-3" />
            <p className="text-sm text-[#94a3b8]">No hay atenciones completadas hoy</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {attendedTickets.slice().reverse().map((ticket) => {
              const svcKey = ticket.service_type ?? 'BUDGET'
              return (
                <div
                  key={ticket.id}
                  className={`flex flex-col items-center justify-center px-4 py-3 rounded-lg border transition-all hover:scale-105 ${badgeClasses[svcKey] ?? badgeClasses.BUDGET}`}
                >
                  <span className={`text-lg font-black ${numberColor[svcKey] ?? 'text-white'}`}>
                    {ticket.ticket_number}
                  </span>
                  {ticket.service_type_display && (
                    <span className="text-[9px] uppercase tracking-wider opacity-80 mt-0.5">
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
