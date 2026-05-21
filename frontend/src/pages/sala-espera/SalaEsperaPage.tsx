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

// --- SISTEMA DE SONIDO ADAPTATIVO PARA TV ---

// AudioContext compartido y reutilizable (requerido por políticas de autoplay en Android TV)
let sharedAudioContext: AudioContext | null = null

const getAudioContext = (): AudioContext | null => {
  try {
    if (!sharedAudioContext) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx = window.AudioContext || (window as any).webkitAudioContext
      if (!Ctx) return null
      sharedAudioContext = new Ctx()
    }
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {})
    }
    return sharedAudioContext
  } catch {
    return null
  }
}

const playChime = () => {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.start(startTime)
      osc.stop(startTime + duration)
    }
    playNote(659.25, ctx.currentTime, 1.0)
    playNote(523.25, ctx.currentTime + 0.4, 1.5)
  } catch (e) {
    console.warn('Error reproduciendo tono:', e)
  }
}

// Componente de video con manejo de errores para TV
function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    const tryPlay = () => {
      el.play().catch(() => {
        // Autoplay bloqueado en TV - intentar de nuevo con muted
        el.muted = true
        el.play().catch(() => {
          // Algunas TV bloquean todo autoplay
        })
      })
    }

    el.addEventListener('loadeddata', tryPlay, { once: true })
    // Si el video ya está cargado, intentar reproducir
    if (el.readyState >= 2) tryPlay()

    return () => {
      el.removeEventListener('loadeddata', tryPlay)
    }
  }, [])

  return (
    <video
      ref={videoRef}
      src={src}
      className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
      muted
      loop
      playsInline
      preload="auto"
    />
  )
}

export default function SalaEsperaPage() {
  const { connect, lastCalledTicket, clearLastCalledTicket, sliderUpdateTrigger } = useWebSocket()
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
    try {
      if (!('speechSynthesis' in window) || !window.speechSynthesis) return
      window.speechSynthesis.cancel()

      const message = `Turno ${ticketNumber}, por favor pase a recepción`
      const utterance = new SpeechSynthesisUtterance(message)
      utterance.lang = 'es-MX'
      utterance.rate = 0.85
      utterance.pitch = 1
      utterance.volume = 1

      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        const sabinaVoice = voices.find(v => v.name.toLowerCase().includes('sabina'))
        const mexicanVoice = voices.find(v => v.lang === 'es-MX')
        const spanishVoice = voices.find(v => v.lang.startsWith('es'))
        utterance.voice = sabinaVoice || mexicanVoice || spanishVoice || null
      }

      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance)
        } catch (e) {
          console.warn('Error en speechSynthesis.speak:', e)
        }
      }, 1200)
    } catch (e) {
      console.warn('SpeechSynthesis no disponible en este dispositivo:', e)
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
      } catch {
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

      {/* Header Corporativo Minimalista - Texto Ajustado para TV */}
      <header className="bg-surface px-8 py-2 flex justify-between items-center z-10 border-b border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-28">
            <img src="/logo.jpg" alt="Biogenic Laboratorio" className="w-full h-auto object-contain" />
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="text-right border-r border-border pr-8">
            <p className="text-4xl font-black text-primary tabular-nums tracking-tighter leading-none">
              {currentTime.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-text tracking-tight leading-none capitalize">
              {currentTime.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden z-10">
        
        {/* Lado Izquierdo: Area de Turnos (55%) */}
        <div className="w-[55%] flex flex-col p-8 gap-8 bg-surface-2 border-r border-border">
          
          {/* Main Display Area */}
          <div className={`flex-1 flex flex-col justify-center items-center rounded-3xl p-10 transition-all duration-500 ease-out border-2 ${
            isAnimating 
              ? 'bg-surface border-primary shadow-lg scale-[1.01]' 
              : 'bg-surface border-border shadow-sm scale-100'
          }`}>
            
            {lastCalled ? (
              <div className="text-center w-full animate-fade-in flex flex-col items-center justify-center">
                <p className={`text-2xl uppercase tracking-[0.25em] font-extrabold mb-8 transition-colors duration-500 ${
                  isAnimating ? 'text-primary' : 'text-text-muted'
                }`}>
                  {isAnimating ? 'LLAMANDO TURNO' : 'ÚLTIMO LLAMADO'}
                </p>
                
                <div className={`w-full py-20 px-8 rounded-[3rem] mb-10 flex justify-center items-center transition-colors duration-500 ${
                  isAnimating 
                    ? 'bg-primary text-white shadow-xl' 
                    : 'bg-surface-2 text-text border border-border shadow-inner'
                }`}>
                  <p className="text-[14rem] font-bold leading-none tracking-tighter tabular-nums drop-shadow-md">
                    {lastCalled.ticketNumber}
                  </p>
                </div>

                <div className={`px-12 py-5 inline-flex rounded-2xl border transition-colors duration-500 ${
                  isAnimating 
                    ? 'bg-success/10 border-success/30 text-success' 
                    : 'bg-surface text-text-muted border-border'
                }`}>
                  <p className="text-3xl font-extrabold flex items-center justify-center gap-5 uppercase tracking-wider">
                    Pase a Recepción
                  </p>
                </div>
              </div>
            ) : (
              // Modo Reposo
              <div className="flex-1 flex flex-col justify-center items-center animate-fade-in text-center p-8">
                 <Monitor className="w-24 h-24 text-border-2 mb-10" strokeWidth={1} />
                 <h2 className="text-4xl font-extrabold text-text-muted tracking-tight mb-4">
                   Sistema Activo
                 </h2>
                 <p className="text-xl font-medium text-text-muted">
                   Aguarde su turno, será llamado en breve.
                 </p>
              </div>
            )}
          </div>

          {/* Historial Inferior Organizado */}
          <div className="h-[30%] bg-surface rounded-3xl border border-border p-8 shadow-sm flex flex-col">
            <div className="flex items-center gap-5 mb-6">
               <p className="text-text font-bold text-base uppercase tracking-widest">Historial</p>
               <div className="h-px bg-border flex-1"></div>
            </div>
            
            {previousCalls.length > 0 ? (
              <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                {previousCalls.slice(0, 8).map((call, index) => (
                  <div
                    key={`${call.ticketNumber}-${index}`}
                    className="bg-surface-2 border border-border rounded-xl p-4 flex flex-col items-center justify-center shadow-sm"
                  >
                    <span className="text-3xl font-bold text-text mb-1 tabular-nums">
                      {call.ticketNumber}
                    </span>
                    <span className="text-text-muted font-semibold text-[11px] tracking-wider">
                      {call.calledAt.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-surface-2 rounded-2xl border border-dashed border-border">
                <p className="text-text-muted text-sm font-bold uppercase tracking-widest">Sin historial</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Derecho: Contenido Multimedia Institucional (45%) */}
        <div className="w-[45%] bg-surface-2 relative overflow-hidden z-20">
          {sliders.length > 0 ? (
            <div className="absolute inset-0">
              {sliders.map((slider, index) => (
                <div
                  key={slider.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  {/* Fondo con Blur para rellenar espacios estéticamente */}
                  <div className="absolute inset-0 overflow-hidden">
                    {slider.media_type === 'IMAGE' && (slider.image_url || slider.image) && (
                      <img
                        src={resolveMediaUrl(slider.image_url || slider.image)}
                        alt=""
                        className="w-full h-full object-cover blur-2xl opacity-20 scale-110"
                      />
                    )}
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    {slider.media_type === 'IMAGE' && (slider.image_url || slider.image) ? (
                      <img
                        src={resolveMediaUrl(slider.image_url || slider.image)}
                        alt={slider.title}
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                      />
                    ) : slider.media_type === 'VIDEO' && (slider.video_url || slider.video) ? (
                      <VideoPlayer
                        src={resolveMediaUrl(slider.video_url || slider.video)}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-surface-2 text-center p-12">
               <img src="/logo.jpg" alt="Logo" className="w-64 h-auto opacity-30 grayscale mb-8" />
               <p className="text-2xl font-bold text-text-muted uppercase tracking-[0.2em]">Biogenic</p>
               <p className="text-lg text-text-muted mt-2 uppercase tracking-widest">Información Institucional</p>
            </div>
          )}
        </div>
      </main>

      {/* Corporate Minimal Footer - Ultra Slim */}
      <footer className="bg-surface py-1 px-8 flex justify-between items-center z-30 border-t border-border">
        <div className="flex items-center gap-6">
          <p className="text-text-muted text-[10px] font-semibold tracking-widest uppercase">
            Biogenic
          </p>
        </div>
        
      </footer>
    </div>
  )
}
