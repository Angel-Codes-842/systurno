import { useEffect, useState, useCallback, useRef } from 'react'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { API_URL, resolveMediaUrl } from '../../config/api'
import { Monitor } from 'lucide-react'

interface DisplayInfo {
  ticketNumber: string
  calledAt: Date
}

interface Slider {
  id: number
  title: string
  media_type: 'IMAGE' | 'VIDEO'
  image?: string | null
  image_url: string | null
  video?: string | null
  video_url: string | null
  duration: number
  order: number
}

// UTILIDAD DE SONIDO (Ding-Dong Sintetizado para ambiente clínico)
const playChime = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  
  const playNote = (freq: number, startTime: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.05); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Decay/Release
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  playNote(659.25, ctx.currentTime, 1.0);
  playNote(523.25, ctx.currentTime + 0.4, 1.5);
};

export default function SalaEsperaPage() {
  const { connect, lastCalledTicket, clearLastCalledTicket, isConnected, sliderUpdateTrigger } = useWebSocket()
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [recentCalls, setRecentCalls] = useState<DisplayInfo[]>([])
  const [sliders, setSliders] = useState<Slider[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadSliders = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/sliders/active/`)
      if (!response.ok) throw new Error('Error cargando sliders')
      const data = await response.json()
      
      if (data && typeof data === 'object' && 'results' in data) {
        setSliders(Array.isArray(data.results) ? data.results : [])
      } else if (Array.isArray(data)) {
        setSliders(data)
      } else {
        setSliders([])
      }
    } catch (err) {
      console.error('Error cargando sliders:', err)
      setSliders([])
    }
  }, [])

  useEffect(() => {
    connect('checkins').catch(console.error)
    loadSliders()
    const sliderInterval = setInterval(loadSliders, 2 * 60 * 1000)
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
    
    return () => clearInterval(sliderInterval)
  }, [connect, loadSliders])

  useEffect(() => {
    if (sliderUpdateTrigger > 0) loadSliders()
  }, [sliderUpdateTrigger, loadSliders])

  useEffect(() => {
    if (sliders.length <= 1) return
    const currentSlider = sliders[currentSlideIndex]
    if (!currentSlider) return
    
    const duration = currentSlider.media_type === 'VIDEO' ? 30000 : currentSlider.duration * 1000
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % sliders.length)
    }, duration)
    
    return () => clearInterval(interval)
  }, [sliders, currentSlideIndex])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const speakAnnouncement = useCallback((ticketNumber: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      
      const speak = () => {
        const message = `Turno ${ticketNumber}, por favor pase a recepción`
        const utterance = new SpeechSynthesisUtterance(message)
        utterance.lang = 'es-MX'
        utterance.rate = 0.85
        utterance.pitch = 1
        utterance.volume = 1
        
        const voices = window.speechSynthesis.getVoices()
        // Prefiere voces femeninas limpias
        const sabinaVoice = voices.find(v => v.name.toLowerCase().includes('sabina'))
        const mexicanVoice = voices.find(v => v.lang === 'es-MX')
        const spanishVoice = voices.find(v => v.lang.startsWith('es'))
        utterance.voice = sabinaVoice || mexicanVoice || spanishVoice || null
        
        window.speechSynthesis.speak(utterance)
      }
      
      setTimeout(() => {
        if (window.speechSynthesis.getVoices().length > 0) {
          speak()
        } else {
          window.speechSynthesis.onvoiceschanged = () => speak()
          setTimeout(speak, 100)
        }
      }, 1200)
    }
  }, [])

  useEffect(() => {
    if (lastCalledTicket) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      const info: DisplayInfo = {
        ticketNumber: lastCalledTicket.ticket.ticket_number,
        calledAt: new Date(),
      }

      try {
        playChime()
      } catch (e) {
        console.warn("AudioContext bloqueado o no soportado.")
      }
      
      setIsAnimating(true)
      speakAnnouncement(info.ticketNumber)

      setRecentCalls(prev => {
        const updated = [info, ...prev.filter(p => p.ticketNumber !== info.ticketNumber)]
        return updated.slice(0, 10) // Mantener últimos 10
      })

      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false)
        clearLastCalledTicket()
      }, 8000)
    }
  }, [lastCalledTicket, speakAnnouncement, clearLastCalledTicket])

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  const lastCalled = recentCalls[0] || null
  const previousCalls = recentCalls.slice(1, 9) // Mostrar maximo 8 históricos en grid

  return (
    <div className="h-screen w-full bg-surface-2 flex flex-col font-sans overflow-hidden select-none">

      {/* Header Corporativo Limpio */}
      <header className="bg-surface px-12 py-6 flex justify-between items-center z-10 border-b border-border shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-48">
            <img src="/logo.jpg" alt="Biogenic Laboratorio" className="w-full h-auto object-contain" />
          </div>
        </div>
        
        <div className="flex items-center gap-12">
          <div className="text-right border-r border-border pr-12">
            <p className="text-text-muted font-bold tracking-widest text-xs uppercase mb-1">
              Hora Central
            </p>
            <p className="text-5xl font-extrabold text-primary tabular-nums tracking-tight leading-none">
              {currentTime.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-text-muted font-bold tracking-widest text-xs uppercase mb-1">
              Fecha
            </p>
            <p className="text-2xl font-bold text-text tracking-wide leading-none capitalize">
              {currentTime.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden z-10">
        
        {/* Lado Izquierdo: Area de Turnos (70%) */}
        <div className="w-[70%] flex flex-col p-10 gap-8 bg-surface-2">
          
          {/* Main Display Area */}
          <div className={`flex-1 flex flex-col justify-center items-center rounded-3xl p-12 transition-all duration-500 ease-out border-2 ${
            isAnimating 
              ? 'bg-surface border-primary shadow-lg scale-[1.02]' 
              : 'bg-surface border-border shadow-sm scale-100'
          }`}>
            
            {lastCalled ? (
              <div className="text-center w-full animate-fade-in flex flex-col items-center justify-center">
                <p className={`text-3xl uppercase tracking-widest font-extrabold mb-8 transition-colors duration-500 ${
                  isAnimating ? 'text-primary' : 'text-text-muted'
                }`}>
                  {isAnimating ? 'TURNO LLAMADO AHORA' : 'ÚLTIMO TURNO LLAMADO'}
                </p>
                
                <div className={`w-full max-w-4xl py-24 px-12 rounded-[3rem] mb-12 flex justify-center items-center transition-colors duration-500 ${
                  isAnimating 
                    ? 'bg-primary text-white shadow-xl' 
                    : 'bg-surface-2 text-text border border-border shadow-inner'
                }`}>
                  <p className="text-[18rem] font-bold leading-none tracking-tighter tabular-nums drop-shadow-sm">
                    {lastCalled.ticketNumber}
                  </p>
                </div>

                <div className={`px-16 py-6 inline-flex rounded-2xl border transition-colors duration-500 ${
                  isAnimating 
                    ? 'bg-success/10 border-success/30 text-success' 
                    : 'bg-surface text-text-muted border-border'
                }`}>
                  <p className="text-4xl font-extrabold flex items-center justify-center gap-6 uppercase tracking-wider">
                    Pase a Recepción
                  </p>
                </div>
              </div>
            ) : (
              // Modo Reposo
              <div className="flex-1 flex flex-col justify-center items-center animate-fade-in text-center">
                 <Monitor className="w-32 h-32 text-border-2 mb-10" strokeWidth={1} />
                 <h2 className="text-5xl font-extrabold text-text-muted tracking-tight mb-4">
                   Sistema de Turnos Activo
                 </h2>
                 <p className="text-2xl font-medium text-text-muted">
                   Aguarde su turno en la sala, será llamado en breve.
                 </p>
              </div>
            )}
          </div>

          {/* Historial Inferior Organizado */}
          <div className="h-[28%] bg-surface rounded-3xl border border-border p-8 shadow-sm flex flex-col">
            <div className="flex items-center gap-6 mb-6">
               <p className="text-text font-bold text-lg uppercase tracking-widest">Historial de Turnos</p>
               <div className="h-px bg-border flex-1"></div>
            </div>
            
            {previousCalls.length > 0 ? (
              <div className="flex-1 grid grid-cols-4 lg:grid-cols-8 gap-4 items-center">
                {previousCalls.map((call, index) => (
                  <div
                    key={`${call.ticketNumber}-${index}`}
                    className="bg-surface-2 border border-border rounded-xl p-4 flex flex-col items-center justify-center shadow-sm"
                  >
                    <span className="text-3xl font-bold text-text mb-1 tabular-nums">
                      {call.ticketNumber}
                    </span>
                    <span className="text-text-muted font-semibold text-xs tracking-wider">
                      {call.calledAt.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-surface-2 rounded-2xl border border-dashed border-border">
                <p className="text-text-muted text-lg font-bold uppercase tracking-widest">Sin turnos en el historial</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Derecho: Contenido Multimedia Institucional (30%) */}
        <div className="w-[30%] bg-surface relative border-l border-border overflow-hidden z-20">
          {sliders.length > 0 ? (
            <div className="absolute inset-0">
              {sliders.map((slider, index) => (
                <div
                  key={slider.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
                    {slider.media_type === 'IMAGE' && (slider.image_url || slider.image) ? (
                      <img
                        src={resolveMediaUrl(slider.image_url || slider.image)}
                        alt={slider.title}
                        className="w-full h-full object-cover"
                      />
                    ) : slider.media_type === 'VIDEO' && (slider.video_url || slider.video) ? (
                      <video
                        src={resolveMediaUrl(slider.video_url || slider.video)}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-surface-2 text-center p-12">
               <img src="/logo.jpg" alt="Logo" className="w-48 h-auto opacity-30 grayscale mb-6" />
               <p className="text-xl font-bold text-text-muted uppercase tracking-widest max-w-[200px]">Información Institucional</p>
            </div>
          )}
        </div>
      </main>

      {/* Corporate Minimal Footer */}
      <footer className="bg-surface py-3 px-8 flex justify-between items-center z-30 border-t border-border">
        <div className="flex items-center gap-6">
          <p className="text-text-muted text-xs font-semibold tracking-widest uppercase">
            Biogenic - Todos los derechos reservados
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-3 bg-surface-2 px-4 py-1.5 rounded-full border border-border">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`}></span>
            <span className="text-text text-xs font-bold uppercase tracking-wider">{isConnected ? 'Conectado al Servidor' : 'Desconectado'}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
