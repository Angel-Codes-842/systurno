import React from 'react'
import { Monitor, Calendar } from 'lucide-react'
import { Button } from '../ui/Button'

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
    <header className="flex items-center justify-between px-6 py-3 border-b border-[#1e293b] bg-[#0f1c2e]/95 backdrop-blur-sm sticky top-0 z-50">
      {/* Izquierda: logo + tabs */}
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => window.location.reload()}
        >
          <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide leading-none">BIOGENIC</p>
            <p className="text-[10px] text-[#00b4d8] font-semibold tracking-widest">DASHBOARD</p>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1 p-1 rounded-xl bg-[#131B2C] border border-[#1e293b]">
          {menuItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <Button
                key={item.id}
                variant={isActive ? 'primary' : 'ghost'}
                size="md"
                onClick={() => setActiveSection(item.id)}
                className={isActive ? 'shadow-lg shadow-[#00b4d8]/25' : ''}
              >
                <span>{item.icon}</span>
                {item.label}
              </Button>
            )
          })}
        </nav>
      </div>

      {/* Derecha: monitor + fecha/hora + estado */}
      <div className="flex items-center gap-5">
        <button
          onClick={loadTickets}
          className="p-2 rounded-lg hover:bg-[#1e293b] transition-colors"
          title="Sincronizar"
        >
          <Monitor className="w-5 h-5 text-[#94a3b8]" />
        </button>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
              <Calendar className="w-3.5 h-3.5" />
              <span>{dayName} {dayNumber}</span>
            </div>
            <p className="text-xl font-semibold font-mono tracking-wider text-white leading-tight">
              {timeStr}
            </p>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
            isConnected
              ? 'bg-[#22c55e]/20 border-[#22c55e]/30 text-[#22c55e]'
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22c55e] animate-pulse' : 'bg-red-500'}`} />
            {isConnected ? 'EN RED' : 'ERROR'}
          </div>
        </div>
      </div>
    </header>
  )
}
