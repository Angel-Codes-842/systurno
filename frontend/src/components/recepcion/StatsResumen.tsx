import React from 'react'
import { Users, Clock, Volume2, CheckCircle2 } from 'lucide-react'

interface StatsResumenProps {
  total: number
  waiting: number
  called: number
  attended: number
}

export const StatsResumen: React.FC<StatsResumenProps> = ({ total, waiting, called, attended }) => {
  const stats = [
    { label: 'Total Hoy',  value: total,    Icon: Users,       color: 'text-[#00b4d8]', border: 'border-[#00b4d8]/20', bg: 'bg-[#00b4d8]/10' },
    { label: 'En Espera',  value: waiting,  Icon: Clock,       color: 'text-[#d97706]', border: 'border-[#d97706]/20', bg: 'bg-[#d97706]/10' },
    { label: 'Llamados',   value: called,   Icon: Volume2,     color: 'text-[#0ea5e9]', border: 'border-[#0ea5e9]/20', bg: 'bg-[#0ea5e9]/10' },
    { label: 'Atendidos',  value: attended, Icon: CheckCircle2,color: 'text-[#22c55e]', border: 'border-[#22c55e]/20', bg: 'bg-[#22c55e]/10' },
  ]

  return (
    <section className="space-y-3 mb-6">
      <h2 className="text-xs font-semibold tracking-widest text-[#64748b] uppercase">Resumen Operativo</h2>
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`flex items-center gap-4 p-4 rounded-xl border ${s.border} ${s.bg} transition-all hover:scale-[1.02]`}
          >
            <div className={`p-3 rounded-lg ${s.bg}`}>
              <s.Icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
