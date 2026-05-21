import React from 'react'

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
  tvLive?: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  setActiveSection,
  menuItems,
  currentTime,
  isConnected,
  tvLive = false,
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
    <header className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 xl:gap-8 px-6 xl:px-10 py-5 bg-surface sticky top-0 z-50 shadow-sm border-b border-border-2">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-10 w-full xl:w-auto">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg shrink-0 shadow-sm">
            B
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-text tracking-widest leading-none uppercase">BIOGENIC</p>
            <p className="text-[10px] text-attended font-bold tracking-widest mt-0.5 uppercase">DASHBOARD</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-1 bg-surface-2 p-1 rounded-lg border border-border w-full lg:w-auto">
          {menuItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-md text-[13px] font-bold transition-all duration-200 cursor-pointer select-none border
                  ${isActive 
                    ? 'bg-surface text-primary shadow-sm border-border' 
                    : 'bg-transparent text-text-muted hover:text-text hover:bg-surface border-transparent hover:border-border'
                  }
                `}
              >
                <span className={isActive ? 'opacity-100' : 'opacity-70'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full xl:w-auto justify-between xl:justify-end">
        <div className="text-right">
          <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
            {dayName} {dayNumber}
          </div>
          <p className="text-xl font-black text-text tabular-nums tracking-tighter leading-none">
            {timeStr}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {tvLive && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-called/10 text-called border border-called/20 text-[11px] font-black uppercase tracking-widest">
              <span className="w-2.5 h-2.5 rounded-full bg-called animate-pulse" />
              TV en vivo
            </span>
          )}

          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest border ${isConnected ? 'bg-attended/10 text-attended border-attended/20' : 'bg-canceled/10 text-canceled border-canceled/20'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-attended' : 'bg-canceled'}`} />
            {isConnected ? 'EN RED' : 'SIN RED'}
          </span>
        </div>
      </div>
    </header>
  )
}
