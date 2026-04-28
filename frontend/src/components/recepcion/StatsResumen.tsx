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
    { label: 'Total Hoy',  value: total,    Icon: Users,       color: 'text-primary', border: 'border-primary/20', bg: 'bg-primary/10' },
    { label: 'En Espera',  value: waiting,  Icon: Clock,       color: 'text-warning', border: 'border-warning/20', bg: 'bg-warning/10' },
    { label: 'Llamados',   value: called,   Icon: Volume2,     color: 'text-primary', border: 'border-primary/20', bg: 'bg-primary/10' },
    { label: 'Atendidos',  value: attended, Icon: CheckCircle2,color: 'text-success', border: 'border-success/20', bg: 'bg-success/10' },
  ]

  return (
    <section className="space-y-3 mb-6">
      <h2 className="text-xs font-bold tracking-widest text-text-muted uppercase">Resumen Operativo</h2>
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`flex items-center gap-4 p-4 rounded-2xl border ${s.border} ${s.bg} transition-all hover:scale-[1.02] shadow-sm`}
          >
            <div className={`p-3 rounded-lg bg-surface shadow-sm`}>
              <s.Icon className={`w-6 h-6 ${s.color}`} aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1 shadow-sm">{s.label}</p>
              <p className={`text-3xl font-extrabold ${s.color} leading-none`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
