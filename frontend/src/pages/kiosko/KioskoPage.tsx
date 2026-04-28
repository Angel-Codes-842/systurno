import { useState, useEffect } from 'react'
import { API_URL } from '../../config/api'
import { toast } from 'sonner'
import { FileText, ClipboardList, Calculator, CheckCircle2, Loader2, Play } from 'lucide-react'

interface Ticket {
  number: string
  time: Date
  serviceType: 'ANALYSIS' | 'RESULTS' | 'BUDGET'
}

export default function KioskoPage() {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  // Smooth progress bar simulation
  useEffect(() => {
    let interval: number;
    if (isGenerating) {
      setProgress(0);
      interval = window.setInterval(() => {
        setProgress(prev => Math.min(prev + Math.floor(Math.random() * 10) + 2, 95))
      }, 100)
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
            body { font-family: 'Courier New', Courier, monospace; text-align: center; padding: 15px; width: 80mm; color: #000; }
            .header { font-size: 16px; font-weight: bold; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dotted #000; }
            .label { font-size: 12px; margin-top: 15px; text-transform: uppercase; }
            .ticket-number { font-size: 52px; font-weight: bold; margin: 15px 0; letter-spacing: -2px; }
            .time { font-size: 13px; margin: 15px 0; }
            .footer { font-size: 11px; margin-top: 15px; padding-top: 10px; border-top: 1px dotted #000; word-break: break-word; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">BIOGENIC</div>
          <p class="label">Su número de turno:</p>
          <div class="ticket-number">${ticketNumber}</div>
          <p class="time">${ticketTime.toLocaleDateString('es-PY')} &nbsp; ${ticketTime.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}</p>
          <p class="footer">Por favor, aguarde en sala de espera a ser llamado por su número.</p>
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

      if (!response.ok) throw new Error('Error de conexión o validación')

      const data = await response.json()
      const ticketTime = new Date()

      await new Promise(resolve => setTimeout(resolve, 600)) // Suave transición

      printTicket(data.ticket_number, ticketTime)
      setTicket({ number: data.ticket_number, time: ticketTime, serviceType })
      
      // Volver automáticamente al inicio
      setTimeout(() => setTicket(null), 8000)

    } catch (err) {
      console.error('Error:', err)
      toast.error('No se pudo generar el turno. Por favor, intente nuevamente o avise a recepción.', {
        position: 'top-center',
        style: { background: 'var(--color-danger)', color: 'white', border: 'none' }
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // --- Corporate Minimalist Service Card ---
  const ServiceCard = ({ 
    type, title, subtitle, icon: Icon, styling
  }: { 
    type: 'ANALYSIS' | 'RESULTS' | 'BUDGET', 
    title: string, 
    subtitle: string, 
    icon: any,
    styling: { lightBg: string, mainColor: string }
  }) => (
    <button
      onClick={() => generateTicket(type)}
      disabled={isGenerating}
      className={`relative flex flex-col items-center justify-center w-full max-w-[380px] h-[460px] 
                 bg-surface border-2 border-border/60 rounded-[3rem] p-10 
                 shadow-[0_8px_30px_rgb(0,0,0,0.06)] 
                 active:scale-[0.95] active:shadow-inner active:bg-surface-2 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
                 focus-visible:ring-4 disabled:opacity-60 disabled:cursor-not-allowed`}
      aria-label={`Solicitar turno para ${title}`}
    >
      <div className={`w-36 h-36 mb-12 rounded-[2.5rem] flex items-center justify-center ${styling.lightBg} shadow-inner`}>
        <Icon className={`w-16 h-16 ${styling.mainColor} drop-shadow-sm`} strokeWidth={2} />
      </div>
      
      <div className="flex flex-col items-center text-center gap-3">
        <span className="text-[2.2rem] font-extrabold tracking-tight text-text leading-none">{title}</span>
        <span className="text-base font-bold text-text-muted opacity-90">{subtitle}</span>
      </div>

      <div className={`absolute bottom-8 flex items-center gap-2 ${styling.mainColor} font-bold opacity-80`}>
        <span className="uppercase tracking-widest text-xs">Tocar para imprimir</span>
      </div>
    </button>
  )

  const styles = {
    ANALYSIS: { lightBg: 'bg-primary/10', mainColor: 'text-primary' },
    RESULTS: { lightBg: 'bg-success/10', mainColor: 'text-success' },
    BUDGET: { lightBg: 'bg-text-muted/10', mainColor: 'text-text-muted' }
  }

  return (
    <div className="min-h-screen bg-bg bg-gradient-to-br from-bg to-surface-2 flex flex-col relative overflow-hidden font-sans">
      
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary opacity-[0.03] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-success opacity-[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* Corporate Header */}
      <header className="w-full flex justify-center py-12 bg-surface/80 backdrop-blur-md border-b border-border/50 z-10 shadow-sm">
        <img src="/logo.jpg" alt="Biogenic Laboratorio" className="h-[120px] w-auto object-contain opacity-100 drop-shadow-md" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-10 z-10 w-full max-w-[1400px] mx-auto">
        
        {isGenerating ? (
          // --- ESTADO DE CARGA (Minimalist Corporate Spinner) ---
          <div className="flex flex-col items-center justify-center w-full max-w-sm" aria-live="polite">
             <div className="w-24 h-24 bg-surface rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-border/50">
               <Loader2 className="w-12 h-12 text-primary animate-spin" strokeWidth={2.5} />
             </div>
             
             <h2 className="text-3xl font-extrabold text-text tracking-tight mb-3 text-center">
               Imprimiendo ticket
             </h2>
             <p className="text-text-muted font-medium text-lg mb-10 text-center">
               Por favor aguarde un momento...
             </p>
             
             {/* Smooth thick progress bar */}
             <div className="w-full bg-border/50 h-3 rounded-full overflow-hidden shadow-inner" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
               <div 
                 className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                 style={{ width: `${progress}%` }}
               />
             </div>
          </div>
        ) : !ticket ? (
          // --- OPCIONES ---
          <div className="flex flex-col w-full items-center animate-fade-in relative">
            <h1 className="text-5xl md:text-[4rem] font-extrabold text-text tracking-tighter mb-4 text-center leading-none">
              Bienvenido a <span className="text-primary">Biogenic</span>
            </h1>
            <p className="text-xl text-text-muted font-bold mb-16 text-center max-w-3xl">
              Toque el servicio que necesita en la pantalla para imprimir su turno.
            </p>

            <div className="flex flex-col lg:flex-row justify-center items-center gap-8 w-full">
              <ServiceCard 
                type="ANALYSIS"
                title="Laboratorio"
                subtitle="Recepción y Toma de Muestras"
                icon={FileText}
                styling={styles.ANALYSIS}
              />
              <ServiceCard 
                type="RESULTS"
                title="Resultados"
                subtitle="Retiro de Estudios Finalizados"
                icon={ClipboardList}
                styling={styles.RESULTS}
              />
              <ServiceCard 
                type="BUDGET"
                title="Presupuestos"
                subtitle="Consultas y Precios"
                icon={Calculator}
                styling={styles.BUDGET}
              />
            </div>
          </div>
        ) : (
          // --- TICKET GENERADO ---
          <div className="w-full max-w-lg animate-fade-in flex flex-col items-center">
            
            <div className="w-full bg-surface border-2 border-border/50 rounded-[3rem] shadow-[0_20px_40px_rgb(0,0,0,0.08)] overflow-hidden">
               <div className="p-14 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-success/10 rounded-[2rem] flex items-center justify-center mb-10 border border-success/20">
                    <CheckCircle2 className="w-12 h-12 text-success" strokeWidth={2.5} />
                  </div>

                  <p className="text-base font-extrabold text-text-muted uppercase tracking-widest mb-4">
                    Su Número de Turno
                  </p>

                  <h2 className="text-[6rem] font-extrabold text-text tracking-tighter mb-10 tabular-nums leading-none">
                    {ticket.number}
                  </h2>

                  <div className="bg-surface-2 rounded-2xl py-4 px-8 w-full text-center border-2 border-border/60">
                    <p className="text-text font-bold text-lg">
                      {ticket.serviceType === 'RESULTS' ? 'Retiro de Resultados' : ticket.serviceType === 'ANALYSIS' ? 'Laboratorio Clínico' : 'Presupuestos e Informes'}
                    </p>
                  </div>
               </div>

               {/* Footer of ticket preview */}
               <div className="bg-surface-2 px-10 py-6 flex justify-between items-center text-base font-bold text-text-muted">
                 <span>{ticket.time.toLocaleDateString('es-PY')}</span>
                 <span>{ticket.time.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
            </div>

            <div className="mt-12 text-center animate-pulse flex flex-col items-center gap-3">
              <Play className="w-10 h-10 text-primary rotate-90" strokeWidth={2.5} />
              <p className="text-3xl font-extrabold text-text">Retire su ticket aquí abajo</p>
              <p className="text-text-muted font-bold text-xl">Aguarde a ser llamado en la sala de espera.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
