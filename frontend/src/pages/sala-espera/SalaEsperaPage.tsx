import { useEffect, useState, useCallback, useRef } from 'react'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { API_URL, resolveMediaUrl } from '../../config/api'

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

// UTILIDAD DE SONIDO (Ding-Dong Sintetizado)
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
        return updated.slice(0, 10)
      })

      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false)
        clearLastCalledTicket()
      }, 7000)
    }
  }, [lastCalledTicket, speakAnnouncement, clearLastCalledTicket])

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  const lastCalled = recentCalls[0] || null
  const previousCalls = recentCalls.slice(1, 9)

  return (
    <div className="h-screen w-full bg-[#0f1c2e] flex flex-col font-sans overflow-hidden select-none relative">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#2563eb]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-[#4b7522]/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header Profesional Aether Dark */}
      <header className="bg-[#1a3152]/80 backdrop-blur-2xl px-12 py-8 flex justify-between items-center z-10 border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-[#0f1c2e] rounded-2xl shadow-inner flex items-center justify-center p-3 border border-white/10">
            <img src="/logo.jpg" alt="Biogenic" className="w-full h-full object-contain opacity-100" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-4xl font-black text-[#ffffff] tracking-widest leading-none uppercase drop-shadow-lg">
              Biogenic
            </h1>
            <p className="text-[#6b9b37] text-sm font-black uppercase tracking-[0.4em] mt-2 drop-shadow-md">
              Diagnóstico Laboratorial
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-12">
          <div className="text-right border-r border-white/10 pr-12">
            <p className="text-[#94a3b8] font-black tracking-widest text-xs uppercase mb-2">
              Hora
            </p>
            <p className="text-5xl font-black text-[#ffffff] tabular-nums tracking-widest leading-none drop-shadow-md">
              {currentTime.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[#94a3b8] font-black tracking-widest text-xs uppercase mb-2">
              Fecha
            </p>
            <p className="text-2xl font-bold text-[#93c5fd] tracking-widest leading-none capitalize drop-shadow-sm">
              {currentTime.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden z-10">
        
        {/* Lado Izquierdo: Area de Turnos (65%) */}
        <div className="w-[65%] flex flex-col p-12 gap-10 relative">
          
          {lastCalled ? (
            <div className={`flex-1 flex flex-col justify-center items-center rounded-2xl p-12 transition-all duration-700 ease-out border-2 ${
              isAnimating 
                ? 'bg-[#1a3152]/90 backdrop-blur-3xl border-[#6b9b37] shadow-[0_0_100px_rgba(83,225,111,0.2)] scale-[1.02]' 
                : 'bg-[#1a3152]/60 backdrop-blur-xl border-white/5 scale-100'
            }`}>
              {isAnimating && (
                 <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-transparent via-[#6b9b37] to-transparent animate-scan-line pointer-events-none" />
              )}
              
              <div className="text-center w-full animate-in fade-in zoom-in duration-700">
                <p className={`text-4xl uppercase tracking-[0.5em] font-black mb-12 transition-colors duration-1000 ${
                  isAnimating ? 'text-[#6b9b37] drop-shadow-[0_0_10px_rgba(83,225,111,0.8)]' : 'text-[#94a3b8]'
                }`}>
                  {isAnimating ? 'Turno Llamado' : 'Último Turno'}
                </p>
                
                <div className={`relative rounded-2xl px-24 py-28 mb-12 flex justify-center items-center transition-all duration-700 overflow-hidden ${
                  isAnimating 
                    ? 'bg-[#0f1c2e] border border-[#6b9b37]/50 scale-105 shadow-2xl' 
                    : 'bg-[#0f1c2e] border border-white/5 shadow-inner'
                }`}>
                  {isAnimating && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#4b7522]/20 to-transparent pointer-events-none" />
                  )}
                  <p className={`text-[16rem] lg:text-[20rem] font-black leading-none tracking-tighter tabular-nums drop-shadow-2xl relative z-10 transition-colors duration-700 ${
                    isAnimating ? 'text-[#ffffff]' : 'text-[#e2e8f0]'
                  }`}>
                    {lastCalled.ticketNumber}
                  </p>
                </div>

                <div className={`px-20 py-10 inline-block rounded-2xl transition-all duration-700 ${
                  isAnimating 
                    ? 'bg-gradient-to-r from-[#4b7522] to-[#6b9b37] text-[#002107] scale-105 shadow-[0_0_40px_rgba(83,225,111,0.4)]' 
                    : 'bg-[#0f1c2e] text-[#94a3b8] border border-white/5 shadow-inner'
                }`}>
                  <p className="text-5xl lg:text-7xl font-black flex items-center justify-center gap-10 uppercase tracking-widest">
                    <span>
                      <svg className="w-16 h-16 lg:w-20 lg:h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </span>
                    Pase a Recepción
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Modo Reposo Profesional
            <div className="flex-1 flex flex-col justify-center items-center rounded-2xl bg-[#1a3152]/60 backdrop-blur-xl border border-white/5 shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-b from-[#93c5fd]/5 to-transparent opacity-50" />
               <div className="z-10 text-center flex flex-col items-center animate-fade-in relative pt-10">
                 <div className="mb-14 w-48 h-48 bg-[#0f1c2e] rounded-2xl shadow-inner flex items-center justify-center p-8 border border-white/10 relative">
                   <div className="absolute inset-0 rounded-2xl shadow-[0_0_80px_rgba(0,91,193,0.2)]" />
                   <img src="/logo.jpg" alt="Biogenic" className="w-full h-full object-contain relative z-10" />
                 </div>

                 <div className="text-7xl lg:text-9xl font-black text-[#ffffff] leading-none tracking-widest tabular-nums mb-8 drop-shadow-xl">
                   {currentTime.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                 </div>
                 
                 <div className="text-5xl lg:text-6xl text-[#93c5fd] font-bold mb-24 capitalize tracking-widest drop-shadow-md">
                   {currentTime.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' })}
                 </div>
                 
                 <div className="inline-flex items-center gap-8 px-16 py-8 bg-[#0f1c2e]/80 border border-[#6b9b37]/20 rounded-xl shadow-[0_0_30px_rgba(83,225,111,0.1)]">
                   <div className="w-5 h-5 rounded-full bg-[#6b9b37] shadow-[0_0_20px_rgba(83,225,111,0.8)] animate-bio-pulse"></div>
                   <span className="text-3xl lg:text-4xl font-black text-[#6b9b37] tracking-[0.4em] uppercase">Sistema Activo</span>
                 </div>
               </div>
            </div>
          )}

          {/* Historial Inferior Organizado */}
          <div className="mt-auto pt-10">
            <div className="flex items-center gap-8 mb-8">
               <p className="text-[#94a3b8] text-xl font-black uppercase tracking-[0.4em]">Historial Reciente</p>
               <div className="h-px bg-white/10 flex-1"></div>
            </div>
            
            {previousCalls.length > 0 ? (
              <div className="grid grid-cols-4 gap-8">
                {previousCalls.map((call, index) => (
                  <div
                    key={`${call.ticketNumber}-${index}`}
                    className="bg-[#1a3152]/60 backdrop-blur-xl border border-white/5 rounded-xl p-8 flex flex-col items-center justify-center shadow-lg transition-all duration-300"
                  >
                    <span className="text-5xl lg:text-6xl font-black text-[#ffffff] tracking-tighter mb-3 tabular-nums drop-shadow-md">
                      {call.ticketNumber}
                    </span>
                    <span className="text-[#94a3b8] font-black text-lg tracking-widest uppercase">
                      {call.calledAt.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-[#1a3152]/30 rounded-2xl border-2 border-dashed border-white/10 backdrop-blur-sm">
                <p className="text-[#94a3b8] text-2xl font-black uppercase tracking-widest">Esperando pacientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Derecho: Contenido Multimedia (35%) */}
        <div className="w-[35%] bg-black relative border-l border-white/10 overflow-hidden shadow-2xl z-20">
          {sliders.length > 0 ? (
            <div className="absolute inset-0">
              {sliders.map((slider, index) => (
                <div
                  key={slider.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {slider.media_type === 'IMAGE' && (slider.image_url || slider.image) ? (
                      <img
                        src={resolveMediaUrl(slider.image_url || slider.image)}
                        alt={slider.title}
                        className="w-full h-full object-contain"
                      />
                    ) : slider.media_type === 'VIDEO' && (slider.video_url || slider.video) ? (
                      <video
                        src={resolveMediaUrl(slider.video_url || slider.video)}
                        className="w-full h-full object-contain"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : null}
                  </div>
                </div>
              ))}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0f1c2e] via-[#0f1c2e]/60 to-transparent z-20" />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-[#0f1c2e]/80 backdrop-blur-xl">
               <div className="w-56 h-56 bg-[#1a3152] rounded-2xl flex items-center justify-center p-12 mb-10 border border-white/5 shadow-inner">
                 <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain opacity-50" />
               </div>
               <p className="text-4xl font-black text-[#94a3b8] tracking-[0.5em] uppercase text-center opacity-50">Biogenic<br/>Media</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Minimalista Aether */}
      <footer className="bg-[#1a3152]/90 backdrop-blur-2xl py-5 px-12 flex justify-end items-center z-30 border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 px-5 py-2 bg-[#0f1c2e] rounded-full border border-white/10 shadow-inner">
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-[#6b9b37] shadow-[0_0_10px_rgba(83,225,111,0.8)] animate-pulse' : 'bg-[#ffb4ab]'}`}></span>
            <span className="text-[#e2e8f0] text-[10px] font-black tracking-[0.3em] uppercase">{isConnected ? 'En Línea' : 'Desconectado'}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
