import { useEffect, useState, useCallback, useRef } from 'react'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { API_URL } from '../../config/api'

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

// 1. UTILIDAD DE SONIDO (Ding-Dong Sintetizado)
// Esto evita tener que cargar un MP3 externo, garantizando que suene siempre.
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

  // Ding (Nota Mi 5) - Campanazo Alto
  playNote(659.25, ctx.currentTime, 1.0);
  // Dong (Nota Do 5) - Campanazo Bajo (0.4 seg despues)
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
        utterance.rate = 0.85 // Ligeramente mas lento para claridad en TV
        utterance.pitch = 1
        utterance.volume = 1
        
        const voices = window.speechSynthesis.getVoices()
        const sabinaVoice = voices.find(v => v.name.toLowerCase().includes('sabina'))
        const mexicanVoice = voices.find(v => v.lang === 'es-MX')
        const spanishVoice = voices.find(v => v.lang.startsWith('es'))
        utterance.voice = sabinaVoice || mexicanVoice || spanishVoice || null
        
        window.speechSynthesis.speak(utterance)
      }
      
      // Delay la voz 1.2 segundos para dejar que suene el "Ding-Dong" primero
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

      // 1. Tocar el timbre
      try {
        playChime()
      } catch (e) {
        console.warn("AudioContext bloqueado o no soportado, interactúa con la pantalla primero.")
      }
      
      // 2. Encender animacion Flash
      setIsAnimating(true)
      
      // 3. Hablar turno
      speakAnnouncement(info.ticketNumber)

      setRecentCalls(prev => {
        const updated = [info, ...prev.filter(p => p.ticketNumber !== info.ticketNumber)]
        return updated.slice(0, 10)
      })

      // Mantener el Flash intenso por 7 segundos
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
  // Extraemos hasta 8 turnos anteriores para hacer una grilla de 2 filas x 4 columnas
  const previousCalls = recentCalls.slice(1, 9)

  return (
    <div className="h-screen w-full bg-[#1a202c] flex flex-col font-sans overflow-hidden select-none">
      {/* Header Corporativo */}
      <header className="bg-[#2d3748] px-10 py-5 flex justify-between items-center shadow-lg z-10 border-b-2 border-[#4a5568]">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-sm shadow-lg flex items-center justify-center p-2 border-2 border-gray-300">
            <img src="/logo.jpg" alt="Biogenic" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-[2.5rem] font-bold text-white tracking-wide">
            Biogenic <span className="text-gray-400 font-normal mx-2">|</span> <span className="text-gray-300 font-normal">Sistema de Turnos</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-gray-400 font-medium tracking-wider text-sm uppercase mb-1">
              Hora
            </p>
            <p className="text-4xl font-bold text-white tabular-nums tracking-wide leading-none">
              {currentTime.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex bg-[#1a202c]">

        
        {/* Lado Izquierdo: Area de Turnos - 60% */}
        <div className="w-[60%] flex flex-col p-8 lg:p-12 gap-8 relative">
          
          {lastCalled ? (
            <div className={`flex-1 flex flex-col justify-center items-center rounded-md p-10 transition-all duration-500 ease-in-out border-2 shadow-2xl ${
              isAnimating 
                ? 'bg-[#2c5282] border-white shadow-[0_0_60px_rgba(44,82,130,0.6)] scale-[1.01]' 
                : 'bg-[#2d3748] border-[#4a5568] scale-100'
            }`}>
              
              <div className="text-center w-full">
                <p className={`text-2xl md:text-3xl lg:text-4xl uppercase tracking-widest font-bold mb-10 transition-colors duration-500 ${
                  isAnimating ? 'text-white' : 'text-gray-400'
                }`}>
                  {isAnimating ? 'Turno Llamado' : 'Último Turno'}
                </p>
                
                <div className={`rounded-md px-12 md:px-24 py-16 shadow-xl mb-12 flex justify-center items-center transition-all duration-500 ${
                  isAnimating 
                    ? 'bg-white text-[#2c5282] scale-105 border-4 border-white' 
                    : 'bg-[#1a202c] text-white border-2 border-[#4a5568]'
                }`}>
                  <p className="text-[12rem] lg:text-[16rem] font-black leading-none tracking-tight tabular-nums">
                    {lastCalled.ticketNumber}
                  </p>
                </div>

                <div className={`px-12 py-6 inline-block rounded-md shadow-xl transition-all duration-500 ${
                  isAnimating 
                    ? 'bg-[#1a365d] border-2 border-white text-white' 
                    : 'bg-[#2d3748] text-gray-300 border-2 border-[#4a5568]'
                }`}>
                  <p className="text-4xl lg:text-5xl font-bold flex items-center justify-center gap-6 uppercase tracking-wide">
                    <svg className="w-12 h-12 lg:w-14 lg:h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    Pase a Recepción
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Modo Reposo - Reloj Corporativo
            <div className="flex-1 flex flex-col justify-center items-center rounded-md bg-[#2d3748] border-2 border-[#4a5568] shadow-xl relative overflow-hidden">
               
               <div className="z-10 text-center flex flex-col items-center">
                 <div className="text-[12rem] lg:text-[14rem] font-bold text-white leading-none tracking-tight tabular-nums mb-4">
                   {currentTime.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                 </div>
                 <div className="text-4xl lg:text-5xl text-gray-400 font-normal mb-16 capitalize tracking-wide">
                   {currentTime.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' })}
                 </div>
                 
                 <div className="inline-flex items-center gap-6 px-10 py-5 bg-[#1a202c] border-2 border-[#4a5568] rounded-md shadow-lg">
                   <div className="w-3 h-3 rounded-full bg-[#2c5282] animate-pulse"></div>
                   <span className="text-xl lg:text-2xl font-semibold text-gray-300 tracking-wider uppercase">Esperando Próximo Turno</span>
                 </div>
               </div>
            </div>
          )}

          {/* Historial de Turnos */}
          <div className="mt-auto pt-6 border-t-2 border-[#4a5568]">
            <div className="flex items-center gap-6 mb-6">
               <p className="text-gray-400 text-lg lg:text-xl font-bold uppercase tracking-wider">Historial Reciente</p>
               <div className="h-[2px] bg-[#4a5568] flex-1"></div>
            </div>
            
            {previousCalls.length > 0 ? (
              <div className="grid grid-cols-4 gap-4 lg:gap-6">
                {previousCalls.map((call, index) => (
                  <div
                    key={`${call.ticketNumber}-${index}`}
                    className="bg-[#2d3748] border-2 border-[#4a5568] rounded-md p-4 lg:p-6 flex flex-col items-center justify-center shadow-lg hover:bg-[#374151] transition-colors"
                  >
                    <span className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-2">
                      {call.ticketNumber}
                    </span>
                    <span className="text-gray-400 font-semibold text-sm lg:text-md tracking-wide">
                      {call.calledAt.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-[#2d3748] rounded-md border-2 border-[#4a5568]">
                <p className="text-gray-400 text-xl font-medium tracking-wide">No hay turnos anteriores registrados</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Derecho: Sliders - 40% */}
        <div className="w-[40%] bg-black relative border-l-4 border-[#2d3748] overflow-hidden shadow-xl">
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
                      <div className="w-full h-full relative">
                        <div 
                           className="absolute inset-0 scale-110 blur-xl opacity-20"
                           style={{
                             backgroundImage: `url(${slider.image_url || slider.image})`,
                             backgroundSize: 'cover',
                             backgroundPosition: 'center'
                           }}
                        />
                        <img
                          src={slider.image_url || slider.image || ''}
                          alt={slider.title}
                          className="w-full h-full object-cover relative z-10"
                        />
                      </div>
                    ) : slider.media_type === 'VIDEO' && (slider.video_url || slider.video) ? (
                      <video
                        src={slider.video_url || slider.video || ''}
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
              
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-20 pointer-events-none" />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-[#2d3748]">
               <div className="text-center">
                 <div className="w-32 h-32 mx-auto border-4 border-[#4a5568] rounded-sm flex items-center justify-center mb-6 bg-white shadow-lg">
                   <img src="/logo.jpg" alt="Logo" className="w-24 h-24 object-contain" />
                 </div>
                 <p className="text-2xl lg:text-3xl text-gray-400 tracking-wider font-normal uppercase">Espacio<br/>Informativo</p>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#2d3748] py-3 px-10 flex justify-between items-center z-20 border-t-2 border-[#4a5568]">
        <p className="text-gray-400 text-sm font-mono tracking-wider">BIOGENIC - Sistema de Turnos v2.0</p>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-[#2c5282]' : 'bg-red-600'}`}></span>
          <span className="text-gray-400 text-sm font-mono tracking-wider">{isConnected ? 'CONECTADO' : 'DESCONECTADO'}</span>
        </div>
      </footer>
    </div>
  )
}
