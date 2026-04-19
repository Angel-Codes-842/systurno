import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { Ticket } from '../../types'

interface TurnosCompletadosProps {
  attendedTickets: Ticket[]
}

export const TurnosCompletados: React.FC<TurnosCompletadosProps> = ({ attendedTickets }) => {
  if (attendedTickets.length === 0) return null

  return (
    <div className="mt-10 bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#6b9b37]/5 rounded-full blur-2xl"></div>

      <div className="flex items-center gap-3 mb-5 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-[#6b9b37]/10 flex items-center justify-center border border-[#6b9b37]/20 shadow-inner">
          <CheckCircle2 className="w-5 h-5 text-[#6b9b37]" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Historial de Atención Hoy
          </h3>
          <p className="text-sm font-medium text-[#6b9b37]">
            {attendedTickets.length} pacientes completados exitosamente
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 relative z-10 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
        {attendedTickets.map((ticket) => (
          <div 
            key={ticket.id} 
            className="flex flex-col gap-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 shadow-sm hover:bg-white hover:border-[#6b9b37] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6b9b37]"></span>
              {ticket.ticket_number}
            </span>
            {ticket.service_type_display && (
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-3">
                {ticket.service_type_display}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
