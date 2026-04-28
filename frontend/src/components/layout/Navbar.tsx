import React from 'react'
import { Monitor, Calendar } from 'lucide-react'

export interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
}

export interface NavbarProps {
  activeSection: string
  setActiveSection: (id: any) => void
  menuItems: MenuItem[]
  currentTime: Date
  isConnected: boolean
  loadTickets: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  setActiveSection,
  menuItems,
  currentTime,
  isConnected,
  loadTickets,
}) => {
  const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
  const dayName = dayNames[currentTime.getDay()]
  const dayNumber = currentTime.getDate()
  const timeStr = currentTime.toLocaleTimeString('es-PY', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-border bg-surface sticky top-0 z-50">
      {/* Izquierda: logo + tabs */}
      <div className="flex items-center gap-8">
        {/* Logo */}
        <button
          type="button"
          className="flex items-center gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-transform active:scale-95"
          onClick={() => window.location.reload()}
          aria-label="Recargar página"
        >
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border shadow-sm">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="text-left">
            <p className="text-lg font-extrabold text-text tracking-wide leading-none">BIOGENIC</p>
            <p className="text-[11px] text-primary font-bold tracking-widest mt-1">DASHBOARD</p>
          </div>
        </button>

        {/* Segmented Control / Tabs */}
        <nav className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface-2 border border-border/80 shadow-inner">
          {menuItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`
                  relative flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-[13px] font-extrabold uppercase tracking-wide transition-all duration-300
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2
                  ${isActive 
                    ? 'bg-surface text-primary border border-border/50 shadow-[0_4px_12px_rgb(0,0,0,0.05)] scale-100' 
                    : 'bg-transparent text-text-muted hover:text-text hover:bg-surface/50 active:scale-95'
                  }
                `}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-xl ring-1 ring-primary/20 pointer-events-none" />
                )}
                <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100 opacity-70'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Derecha: monitor + fecha/hora + estado */}
      <div className="flex items-center gap-6">
        <button
          onClick={loadTickets}
          className="p-3 rounded-xl text-text-muted hover:bg-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Sincronizar datos"
        >
          <Monitor className="w-6 h-6" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-8">
          <div className="text-right border-r border-border pr-8">
            <div className="flex items-center justify-end gap-2 text-sm text-text-muted font-bold mb-1">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>{dayName} {dayNumber}</span>
            </div>
            <p className="text-[1.75rem] font-black font-mono tracking-wider text-text leading-none tabular-nums">
              {timeStr}
            </p>
          </div>

          <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-xs font-black tracking-widest ${
            isConnected
              ? 'bg-success/10 border-success/30 text-success shadow-sm'
              : 'bg-danger/10 border-danger/30 text-danger shadow-sm'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`} />
            {isConnected ? 'EN RED' : 'ERROR'}
          </div>
        </div>
      </div>
    </header>
  )
}
