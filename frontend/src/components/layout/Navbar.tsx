import React from 'react'
import { RefreshCw } from 'lucide-react'
import './Navbar.css'

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
  loadTickets
}) => {
  return (
    <nav className="bg-[#010409] border-b border-[#30363d] sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[72px]">
          
          {/* Logo y Menú Principal (Izquierda) */}
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0 flex items-center gap-4">
              <img src="/logo.jpg" alt="Biogenic" className="w-10 h-10 rounded-md border border-[#30363d] shadow-sm" />
              <span className="font-bold text-xl text-white tracking-tight">Biogenic</span>
            </div>
            
            {/* Menu Tabs usando el estilo exacto de Uiverse.io */}
            <div className="hidden md:flex">
              <div className="custom-input">
                {menuItems.map((item) => {
                  const isActive = activeSection === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`custom-value ${isActive ? 'active' : ''}`}
                    >
                      <div className={`transition-colors duration-200 ${isActive ? 'text-[#2f81f7]' : 'text-[#7D8590]'}`}>
                        {item.icon}
                      </div>
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Panel de Utilidades (Derecha) */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Reloj */}
            <div className="hidden sm:block text-right">
               <p className="text-[10px] text-[#7D8590] font-bold uppercase tracking-wider mb-0.5">
                 {currentTime.toLocaleDateString('es-PY', { weekday: 'short', day: 'numeric', month: 'short' })}
               </p>
               <p className="text-sm font-black text-[#c9d1d9] leading-none">
                 {currentTime.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
               </p>
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-full" title={isConnected ? 'Conectado al servidor' : 'Desconectado'}>
              <span className="relative flex h-2.5 w-2.5">
                {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ea043] opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-[#2ea043]' : 'bg-red-500'}`}></span>
              </span>
              <span className="text-xs font-semibold text-[#c9d1d9] hidden md:block tracking-wide">
                {isConnected ? 'Sistema en red' : 'Error conexión'}
              </span>
            </div>
            
            <div className="w-px h-6 bg-[#30363d] hidden sm:block"></div>
            
            <button
              onClick={loadTickets}
              className="flex items-center justify-center p-2.5 text-[#7D8590] hover:text-[#2f81f7] hover:bg-[#21262c] rounded-full transition-colors"
              title="Actualizar datos manualmente"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </nav>
  )
}
