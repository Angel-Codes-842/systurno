import { useState } from 'react'
import { API_URL } from '../../config/api'
import { toast } from 'sonner'
import { Ticket as TicketIcon, Loader2, CheckCircle2 } from 'lucide-react'

interface Ticket {
  number: string
  time: Date
  serviceType: 'ANALYSIS' | 'RESULTS' | 'BUDGET'
}

export default function KioskoPage() {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingType, setLoadingType] = useState<string | null>(null)

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
    setLoadingType(serviceType)

    try {
      const response = await fetch(`${API_URL}/tickets/generate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_type: serviceType })
      })

      if (!response.ok) throw new Error('Error al generar ticket')

      const data = await response.json()
      const ticketTime = new Date()

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
      setLoadingType(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1f2e] to-[#2d3748] flex items-center justify-center px-16 py-8">
      {!ticket ? (
        <div className="text-center max-w-7xl mx-auto w-full">
          {/* Logo Biogenic */}
          <div className="mb-12 flex justify-center">
            <img src="/logo.jpg" alt="Biogenic" className="h-24 lg:h-28 w-auto rounded-md shadow-2xl object-contain bg-white p-4" />
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-wide text-center">
            Seleccione el servicio que necesita
          </h1>

          <p className="text-base md:text-lg lg:text-xl text-gray-300 mb-12 font-normal text-center bg-white/5 py-4 px-10 rounded-md border border-white/10 shadow-lg inline-block max-w-3xl">
            Por favor, seleccione una opción para obtener su turno
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-8 lg:gap-12 mx-auto w-full px-4">
            {/* PRIORITY 1: Retirar Resultados */}
            <button
              onClick={() => generateTicket('RESULTS')}
              disabled={isGenerating}
              className="flex flex-col items-center justify-center w-[280px] h-[320px] lg:w-[340px] lg:h-[380px] 
                         bg-[#2c5282] rounded-lg border-2 border-[#4a5568] p-8 lg:p-10 gap-5
                         shadow-[0_4px_0_0_#1a365d,0_8px_20px_rgba(0,0,0,0.3)] 
                         hover:-translate-y-1 hover:shadow-[0_6px_0_0_#1a365d,0_12px_25px_rgba(0,0,0,0.4)]
                         active:translate-y-[4px] active:shadow-[0_0px_0_0_#1a365d,0_0px_0px_rgba(0,0,0,0.3)] 
                         transition-all duration-100 ease-out select-none
                         disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loadingType === 'RESULTS' ? (
                <Loader2 className="animate-spin w-16 h-16 lg:w-20 lg:h-20 text-white mb-2" />
              ) : (
                <div className="bg-white/10 w-20 h-20 lg:w-24 lg:h-24 flex items-center justify-center rounded-md group-hover:bg-white/15 transition-all duration-200 shadow-inner mb-2 border border-white/20">
                  <CheckCircle2 className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
                </div>
              )}
              <div className="flex flex-col gap-2 items-center w-full">
                <span className="text-[1.6rem] lg:text-[2rem] font-bold text-white leading-tight tracking-wide text-center">Retirar<br />Resultados</span>
                <span className="text-[0.85rem] lg:text-[0.95rem] font-normal text-gray-300 text-center leading-snug px-2 mt-1">Servicio rápido</span>
              </div>
            </button>

            {/* PRIORITY 2: Realizar Análisis */}
            <button
              onClick={() => generateTicket('ANALYSIS')}
              disabled={isGenerating}
              className="flex flex-col items-center justify-center w-[280px] h-[320px] lg:w-[340px] lg:h-[380px] 
                         bg-[#2d3748] rounded-lg border-2 border-[#4a5568] p-8 lg:p-10 gap-5
                         shadow-[0_4px_0_0_#1a202c,0_8px_20px_rgba(0,0,0,0.3)] 
                         hover:-translate-y-1 hover:shadow-[0_6px_0_0_#1a202c,0_12px_25px_rgba(0,0,0,0.4)]
                         active:translate-y-[4px] active:shadow-[0_0px_0_0_#1a202c,0_0px_0px_rgba(0,0,0,0.3)] 
                         transition-all duration-100 ease-out select-none
                         disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loadingType === 'ANALYSIS' ? (
                <Loader2 className="animate-spin w-16 h-16 lg:w-20 lg:h-20 text-white mb-2" />
              ) : (
                <div className="bg-white/10 w-20 h-20 lg:w-24 lg:h-24 flex items-center justify-center rounded-md group-hover:bg-white/15 transition-all duration-200 shadow-inner mb-2 border border-white/20">
                  <TicketIcon className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
                </div>
              )}
              <div className="flex flex-col gap-2 items-center w-full">
                <span className="text-[1.6rem] lg:text-[2rem] font-bold text-white leading-tight tracking-wide text-center">Realizar<br />Análisis</span>
                <span className="text-[0.85rem] lg:text-[0.95rem] font-normal text-gray-300 text-center leading-snug px-2 mt-1">Servicio principal</span>
              </div>
            </button>

            {/* PRIORITY 3: Solicitar Presupuesto */}
            <button
              onClick={() => generateTicket('BUDGET')}
              disabled={isGenerating}
              className="flex flex-col items-center justify-center w-[280px] h-[320px] lg:w-[340px] lg:h-[380px] 
                         bg-[#4a5568] rounded-lg border-2 border-[#718096] p-8 lg:p-10 gap-5
                         shadow-[0_4px_0_0_#2d3748,0_8px_20px_rgba(0,0,0,0.3)] 
                         hover:-translate-y-1 hover:shadow-[0_6px_0_0_#2d3748,0_12px_25px_rgba(0,0,0,0.4)]
                         active:translate-y-[4px] active:shadow-[0_0px_0_0_#2d3748,0_0px_0px_rgba(0,0,0,0.3)] 
                         transition-all duration-100 ease-out select-none
                         disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loadingType === 'BUDGET' ? (
                <Loader2 className="animate-spin w-16 h-16 lg:w-20 lg:h-20 text-white mb-2" />
              ) : (
                <div className="bg-white/10 w-20 h-20 lg:w-24 lg:h-24 flex items-center justify-center rounded-md group-hover:bg-white/15 transition-all duration-200 shadow-inner mb-2 border border-white/20">
                  <span className="font-serif text-[3.5rem] lg:text-[4.5rem] font-bold text-white leading-none mt-1">$</span>
                </div>
              )}
              <div className="flex flex-col gap-2 items-center w-full">
                <span className="text-[1.6rem] lg:text-[2rem] font-bold text-white leading-tight tracking-wide text-center">Consultar<br />Presupuesto</span>
                <span className="text-[0.85rem] lg:text-[0.95rem] font-normal text-gray-300 text-center leading-snug px-2 mt-1">Información de costos</span>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl animate-fade-in flex flex-col items-center">

          {/* VIRTUAL TICKET PAPER - Estilo Profesional */}
          <div className="bg-white rounded-sm w-full relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.4)] border border-gray-200">
            {/* Top edge */}
            <div className="h-2 w-full bg-[#2d3748]"></div>

            <div className="p-10 md:p-14 flex flex-col items-center text-center">

              <div className="w-16 h-16 mb-6 mx-auto bg-gray-100 rounded-sm flex items-center justify-center border-2 border-gray-300">
                <CheckCircle2 className="w-10 h-10 text-[#2c5282]" />
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 uppercase tracking-wider">
                Turno Generado
              </h2>

              <div className="w-full border-b border-gray-300 my-6"></div>

              <p className="text-gray-600 font-semibold tracking-wider uppercase text-sm md:text-md mb-2">
                {ticket.serviceType === 'RESULTS' ? 'Retirar Resultados' : ticket.serviceType === 'ANALYSIS' ? 'Realizar Análisis' : 'Consultar Presupuesto'}
              </p>

              <div className="bg-gray-50 rounded-sm py-8 px-16 my-4 w-full border-2 border-gray-300 shadow-sm">
                <p className="text-[6rem] md:text-[8rem] font-black text-[#2d3748] leading-none tabular-nums tracking-tight">
                  {ticket.number}
                </p>
              </div>

              <div className="w-full flex justify-between items-center text-gray-500 font-mono mt-4 text-sm md:text-base">
                <span>{ticket.time.toLocaleDateString('es-PY')}</span>
                <span>{ticket.time.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="w-full border-b border-gray-300 my-6"></div>

              <p className="text-xl md:text-2xl font-bold text-[#2d3748]">
                Retire su ticket impreso
              </p>
              <p className="text-gray-600 mt-2">
                Aguarde a ser llamado en la sala de espera
              </p>

            </div>

            {/* Bottom edge */}
            <div className="h-2 w-full bg-[#2d3748]"></div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(50px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  )
}
