import { useState, useEffect } from 'react'
import { API_URL } from '../../config/api'
import { toast } from 'sonner'
import { Ticket as TicketIcon, CheckCircle2, Activity, Settings } from 'lucide-react'

interface Ticket {
  number: string
  time: Date
  serviceType: 'ANALYSIS' | 'RESULTS' | 'BUDGET'
}

export default function KioskoPage() {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  // Simular progreso numérico durante la carga
  useEffect(() => {
    let interval: number;
    if (isGenerating) {
      setProgress(0);
      interval = window.setInterval(() => {
        setProgress(prev => Math.min(prev + Math.floor(Math.random() * 15) + 5, 99))
      }, 200)
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const printTicket = (ticketNumber: string, ticketTime: Date) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Turno</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              text-align: center;
              padding: 10px;
              width: 80mm;
            }
            .header {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
              padding-bottom: 8px;
              border-bottom: 1px dashed #000;
            }
            .label { font-size: 12px; margin-top: 10px; }
            .ticket-number {
              font-size: 48px;
              font-weight: bold;
              margin: 15px 0;
              padding: 10px;
              border: 3px solid #000;
            }
            .time { font-size: 12px; margin: 10px 0; }
            .footer {
              font-size: 11px;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px dashed #000;
            }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">BIOGENIC - LABORATORIO</div>
          <p class="label">Su turno es:</p>
          <div class="ticket-number">${ticketNumber}</div>
          <p class="time">${ticketTime.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })} - ${ticketTime.toLocaleDateString('es-PY')}</p>
          <p class="footer">Espere a ser llamado en la pantalla</p>
        </body>
      </html>
    `

    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
    iframe.setAttribute('aria-hidden', 'true')
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(printContent)
      doc.close()

      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }
  }

  const generateTicket = async (serviceType: 'ANALYSIS' | 'RESULTS' | 'BUDGET') => {
    setIsGenerating(true)

    try {
      const response = await fetch(`${API_URL}/tickets/generate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_type: serviceType })
      })

      if (!response.ok) throw new Error('Error al generar ticket')

      const data = await response.json()
      const ticketTime = new Date()

      // Small delay para apreciar la nueva animación de carga
      await new Promise(resolve => setTimeout(resolve, 800))

      toast.success(`Turno ${data.ticket_number} generado correctamente`, {
        duration: 3000,
        position: 'top-center'
      })

      printTicket(data.ticket_number, ticketTime)
      setTicket({ number: data.ticket_number, time: ticketTime, serviceType })
      setTimeout(() => setTicket(null), 7000)

    } catch (err) {
      console.error('Error:', err)
      toast.error('Error al generar el ticket. Por favor, asegúrese de que el sistema esté conectado.', {
        duration: 5000,
        position: 'top-center'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Componente de botón de servicio tipo Aether Clinical (Stitch Design)
  const ServiceCard = ({ 
    type, title, subtitle, icon: Icon, iconNode, colorClass, gradientClass, ringClass 
  }: { 
    type: 'ANALYSIS' | 'RESULTS' | 'BUDGET', 
    title: string, 
    subtitle: string, 
    icon?: any,
    iconNode?: React.ReactNode,
    colorClass: string,
    gradientClass: string,
    ringClass: string
  }) => (
    <button
      onClick={() => generateTicket(type)}
      disabled={isGenerating}
      className={`relative flex flex-col items-center justify-center w-full max-w-[400px] h-[450px] 
                 bg-[#1a3152]/80 backdrop-blur-xl border-2 ${ringClass} rounded-3xl p-10 
                 active:bg-[#24436e] active:scale-[0.96] transition-all duration-300 ease-out shadow-[0_0_40px_rgba(30,58,95,0.3)] disabled:opacity-50 overflow-hidden touch-manipulation`}
    >
      <div className={`absolute inset-0 opacity-30 bg-gradient-to-br ${gradientClass} mix-blend-overlay`} />
      
      <div className={`relative bg-black/30 w-32 h-32 rounded-2xl flex items-center justify-center mb-10 border border-white/20 shadow-inner`}>
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradientClass} opacity-30 blur-xl`} />
        {iconNode
          ? <span className={`text-7xl font-black ${colorClass} leading-none`}>{iconNode}</span>
          : Icon && <Icon className={`w-16 h-16 ${colorClass} drop-shadow-md`} strokeWidth={2} />
        }
      </div>
      
      <span className="relative text-4xl font-black text-[#ffffff] tracking-tight leading-tight mb-3">
        {title}
      </span>
      <div className="relative mt-auto flex flex-col items-center gap-4">
        <span className={`text-sm font-bold ${colorClass} uppercase tracking-[0.25em] bg-black/40 px-6 py-2 rounded-full border border-white/10`}>
          {subtitle}
        </span>
        <span className="text-[#a8b8d0] text-xs uppercase font-bold tracking-widest animate-pulse mt-2">
          Toque para imprimir
        </span>
      </div>
    </button>
  )

  return (
    <div className="min-h-screen bg-[#0f1c2e] flex items-center justify-center px-8 md:px-16 py-8 font-sans overflow-hidden relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-[#2563eb]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-[#4b7522]/10 rounded-full blur-[100px] pointer-events-none" />

      {isGenerating ? (
        // --- ESTADO DE CARGA ---
        <div className="flex flex-col items-center justify-center animate-fade-in z-10 w-full max-w-md">
           <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
             <div className="absolute inset-0 border-2 border-[#1a3152] rounded-full" />
             <div className="absolute inset-0 border-2 border-t-[#6b9b37] border-r-transparent border-b-[#3b82f6] border-l-transparent rounded-full animate-spin" style={{ animationDuration: '3s' }} />
             <div className="absolute inset-2 border-2 border-dashed border-white/10 rounded-full animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }} />
             <Activity className="w-16 h-16 text-[#ffffff] animate-bio-pulse" strokeWidth={1} />
             
             {/* Scan line effect */}
             <div className="absolute inset-0 overflow-hidden rounded-full">
               <div className="absolute left-0 w-full h-1 bg-[#6b9b37] blur-[2px] animate-scan-line" />
             </div>
           </div>
           
           <h2 className="text-3xl font-black text-[#ffffff] tracking-tight mb-4 text-center">
             Procesando Solicitud
           </h2>
           
           <div className="w-full bg-[#1a3152] h-1.5 rounded-full overflow-hidden mb-6">
             <div 
               className="h-full bg-gradient-to-r from-[#3b82f6] to-[#6b9b37] transition-all duration-200 ease-out"
               style={{ width: `${progress}%` }}
             />
           </div>
           
           <p className="text-[#94a3b8] font-medium tracking-[0.2em] text-xs uppercase flex items-center gap-3">
             <Settings className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
             Sincronizando Sistema
           </p>
        </div>
      ) : !ticket ? (
        // --- OPCIONES ---
        <div className="text-center max-w-7xl mx-auto w-full z-10">
          <div className="mb-16 flex flex-col items-center animate-fade-in relative">
            <div className="bg-[#1a3152]/50 backdrop-blur-md p-6 rounded-xl border border-white/5 mb-8 shadow-2xl relative group">
              <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img src="/logo.jpg" alt="Biogenic" className="h-16 md:h-24 w-auto object-contain opacity-100" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-[#ffffff] tracking-tighter uppercase drop-shadow-2xl">
              BIOGENIC
            </h1>
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-[#93c5fd] to-transparent mt-6 opacity-30"></div>
          </div>

          <h2 className="text-xl md:text-2xl font-medium text-[#e2e8f0] mb-14 tracking-wide animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            Seleccione el servicio que requiere
          </h2>

          <div className="flex flex-col md:flex-row justify-center items-center gap-8 lg:gap-10 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <ServiceCard 
              type="RESULTS"
              title="Resultados"
              subtitle="Retiro Rápido"
              icon={CheckCircle2}
              colorClass="text-[#6b9b37]"
              gradientClass="from-[#4b7522] to-transparent"
              ringClass="ring-[#6b9b37]"
            />
            <ServiceCard 
              type="ANALYSIS"
              title="Análisis"
              subtitle="Atención Clínica"
              icon={TicketIcon}
              colorClass="text-[#93c5fd]"
              gradientClass="from-[#4b8eff] to-transparent"
              ringClass="ring-[#93c5fd]"
            />
            <ServiceCard 
              type="BUDGET"
              title="Informes"
              subtitle="Presupuestos"
              iconNode="₲"
              colorClass="text-[#b7c8e1]"
              gradientClass="from-[#8292aa] to-transparent"
              ringClass="ring-[#b7c8e1]"
            />
          </div>
        </div>
      ) : (
        // --- TICKET GENERADO ---
        <div className="w-full max-w-xl animate-fade-in z-10 animate-float">
          <div className="bg-[#1a3152] rounded-2xl shadow-[0_0_100px_-20px_rgba(173,198,255,0.15)] overflow-hidden relative border border-white/5 backdrop-blur-3xl">
            {/* Ambient Ticket Glow */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="p-16 flex flex-col items-center text-center relative z-10">
              <div className="w-20 h-20 bg-black/30 rounded-full flex items-center justify-center mb-8 border border-white/10 relative">
                <div className="absolute inset-0 bg-[#6b9b37]/20 rounded-full blur-md" />
                <CheckCircle2 className="w-10 h-10 text-[#6b9b37] relative z-10" />
              </div>

              <h2 className="text-xl font-black text-[#94a3b8] uppercase tracking-[0.4em] mb-4">
                Su Turno
              </h2>

              <div className="bg-black/40 rounded-2xl py-10 px-16 w-full border border-white/5 mb-8 shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb]/10 to-transparent opacity-50" />
                <p className="relative z-10 text-8xl md:text-9xl font-black text-[#ffffff] leading-none tabular-nums tracking-tighter drop-shadow-xl">
                  {ticket.number}
                </p>
              </div>

              <p className="text-[#93c5fd] font-bold uppercase tracking-[0.3em] text-xs mb-10 bg-[#00285c]/40 px-6 py-2.5 rounded-full border border-[#2563eb]/30">
                {ticket.serviceType === 'RESULTS' ? 'Retirar Resultados' : ticket.serviceType === 'ANALYSIS' ? 'Realizar Análisis' : 'Consultar Presupuesto'}
              </p>

              <div className="w-full flex justify-between items-center text-[#94a3b8] font-bold text-sm border-t border-white/10 pt-8 mt-2">
                <span className="tracking-widest">{ticket.time.toLocaleDateString('es-PY')}</span>
                <span className="tracking-widest">{ticket.time.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="mt-12 text-[#ffffff]">
                <p className="text-xl font-black uppercase tracking-widest mb-1">Retire el ticket impreso</p>
                <p className="text-[#94a3b8] font-medium text-sm">Aguarde a ser llamado en pantalla</p>
              </div>
            </div>

            <div className="h-2 w-full bg-gradient-to-r from-[#3b82f6] via-[#6b9b37] to-[#3b82f6] animate-scan-line" style={{ animationDirection: 'alternate' }}></div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(20px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  )
}
