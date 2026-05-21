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
    { label: 'TOTAL HOY',  value: total,    Icon: Users,       color: 'text-text',       bg: 'bg-surface-2' },
    { label: 'EN ESPERA',  value: waiting,  Icon: Clock,       color: 'text-waiting',    bg: 'bg-waiting/10' },
    { label: 'LLAMADOS',   value: called,   Icon: Volume2,     color: 'text-called',     bg: 'bg-called/10' },
    { label: 'ATENDIDOS',  value: attended, Icon: CheckCircle2,color: 'text-attended',   bg: 'bg-attended/10' },
  ]

  return (
    <section className="mb-8">
      <div className="grid grid-cols-4 gap-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-5 p-6 rounded-xl bg-surface border border-border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${s.bg}`}>
              <s.Icon className={`w-7 h-7 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.25em] leading-none mb-1">{s.label}</p>
              <p className={`text-3xl font-black ${s.color} leading-none tabular-nums`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
