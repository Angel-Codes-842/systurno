/**
 * DisplayView — Pantalla de sala de espera (TV / monitor)
 *
 * Estructura:
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  [turnero.mp4 — fondo completo full-screen]                 │
 *  │  ┌──────────────────────────────────────────────────────┐   │
 *  │  │ HEADER (transparente)   fecha|hora pill  |  logo     │   │
 *  │  └──────────────────────────────────────────────────────┘   │
 *  │  ┌───────────────────┐   ┌──────────────────────────────┐   │
 *  │  │  PANEL IZQUIERDO  │   │    PANEL DERECHO (sliders)   │   │
 *  │  │  (semi-transp.)   │   │    Imágenes / videos admin   │   │
 *  │  │                   │   │    (vacío si no hay sliders)  │   │
 *  │  │  ÚLTIMO LLAMADO   │   │                              │   │
 *  │  │  ┌─────────────┐  │   │                              │   │
 *  │  │  │   R-02      │  │   │                              │   │
 *  │  │  └─────────────┘  │   │                              │   │
 *  │  │  PASE RECEPCIÓN   │   │                              │   │
 *  │  │  ─────────────    │   │                              │   │
 *  │  │  ANTERIORES       │   │                              │   │
 *  │  │  [A-03] [R-01]    │   │                              │   │
 *  │  └───────────────────┘   └──────────────────────────────┘   │
 *  └─────────────────────────────────────────────────────────────┘
 */

import { useEffect, useMemo, useState, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getActiveSliders, getCalledTickets, getTTS } from '@/services/api';
import { useClock } from '@/hooks/useClock';
import type { Slider, Ticket } from '@/types';

const WS_URL = '/ws/checkins/';

/* ── Configuración de anuncio — ajustar aquí ── */
const ANNOUNCE = {
  dingToSpeechMs:  450,   // ms entre el ding y el inicio de la voz (antes 900)
  betweenRepeatMs: 400,   // ms de pausa entre 1ª y 2ª repetición (antes 600)
  speechRate:      0.88,  // velocidad de la voz (0.88 = más pausada y clara, antes 1.0)
  repeatCount:     2,     // cuántas veces se repite el anuncio
};

/* ── Anuncio de turno: ding + TTS ── */
function playDing() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();

    const hit = (freq: number, start: number, dur: number, vol: number, type: 'sine' | 'triangle' = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(vol, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };

    // Chime premium digital: Dos acordes mayores brillantes en arpegio (A5 + C#6 -> C#6 + E6)
    // Combinación de onda triangular (armónicos brillantes para TV) + senoidal (cuerpo suave)
    hit(880.00,  0.0,  1.0, 0.25, 'triangle');
    hit(880.00,  0.0,  1.0, 0.25, 'sine');
    hit(1109.73, 0.0,  1.0, 0.20, 'triangle');
    hit(1109.73, 0.0,  1.0, 0.20, 'sine');

    hit(1109.73, 0.35, 1.4, 0.25, 'triangle');
    hit(1109.73, 0.35, 1.4, 0.25, 'sine');
    hit(1318.51, 0.35, 1.4, 0.20, 'triangle');
    hit(1318.51, 0.35, 1.4, 0.20, 'sine');
  } catch { /* ignore */ }
}

function speakTTS(text: string, getTTSUrl: (t: string) => string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(getTTSUrl(text));
    audio.volume = 1.0;
    audio.playbackRate = rate;
    audio.onended = () => resolve();
    audio.onerror  = () => {
      console.warn("La API de audio de Piper/gTTS falló. Usando SpeechSynthesis nativo del navegador...");
      fallbackSpeechSynthesis(text, rate, resolve);
    };
    audio.play().catch((err) => {
      console.warn("La reproducción del audio falló o fue bloqueada. Usando SpeechSynthesis nativo...", err);
      fallbackSpeechSynthesis(text, rate, resolve);
    });
  });
}

function fallbackSpeechSynthesis(text: string, rate: number, onComplete: () => void) {
  if ('speechSynthesis' in window) {
    // Si ya está hablando, cancelar para no encolar audios lagueados
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = rate;
    utterance.onend = () => onComplete();
    utterance.onerror = () => onComplete();
    window.speechSynthesis.speak(utterance);
  } else {
    onComplete();
  }
}

async function announceTicket(ticketNumber: string) {
  if (announceTicket._busy) return;       // ya hay un anuncio en curso
  announceTicket._busy = true;
  window.dispatchEvent(new CustomEvent('ticket-announcement-start'));
  try {
    const phrase = `Turno ${ticketNumber}, pase a recepción`;
    playDing();
    await new Promise(r => setTimeout(r, ANNOUNCE.dingToSpeechMs));
    for (let i = 0; i < ANNOUNCE.repeatCount; i++) {
      await speakTTS(phrase, getTTS, ANNOUNCE.speechRate);
      if (i < ANNOUNCE.repeatCount - 1) {
        await new Promise(r => setTimeout(r, ANNOUNCE.betweenRepeatMs));
      }
    }
  } finally {
    announceTicket._busy = false;
    window.dispatchEvent(new CustomEvent('ticket-announcement-end'));
  }
}
announceTicket._busy = false;


/* ════════════════════════════════════════════════════════════════ */
export function DisplayView() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [idx,     setIdx]     = useState(0);
  const { date, time } = useClock();
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const handleStart = () => setIsAnnouncing(true);
    const handleEnd = () => setIsAnnouncing(false);

    window.addEventListener('ticket-announcement-start', handleStart);
    window.addEventListener('ticket-announcement-end', handleEnd);

    return () => {
      window.removeEventListener('ticket-announcement-start', handleStart);
      window.removeEventListener('ticket-announcement-end', handleEnd);
    };
  }, []);

  // Controlar volumen del video dinámicamente al iniciar/finalizar el anuncio
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isAnnouncing ? 0.1 : 1.0;
    }
  }, [isAnnouncing]);

  const handleVideoLoad = (el: HTMLVideoElement | null) => {
    if (el) {
      videoRef.current = el;
      el.volume = isAnnouncing ? 0.1 : 1.0;
    }
  };

  /* WebSocket: escucha llamados y actualizaciones de slider */
  useWebSocket(WS_URL, {
    onTicketCalled: (t) => {
      setTickets(cur => {
        if (t.status === 'CALLED') {
          // Si está siendo llamado, se remueve de cualquier otra posición y se coloca al frente.
          return [t, ...cur.filter(x => x.id !== t.id)].slice(0, 6);
        } else if (t.status === 'ATTENDED' || t.status === 'CANCELED') {
          // Si fue atendido o cancelado, se remueve de la lista de llamados de la pantalla.
          return cur.filter(x => x.id !== t.id);
        } else {
          const exists = cur.some(x => x.id === t.id);
          if (exists) {
            return cur.map(x => x.id === t.id ? t : x);
          }
          return cur;
        }
      });
      if (t.status === 'CALLED') {
        announceTicket(t.ticket_number);
      }
    },
    onSliderUpdate: fetchSliders,
  });

  useEffect(() => {
    fetchSliders();
    fetchCalledTickets();
  }, []);

  /* Avanzar slider de imagen automáticamente */
  useEffect(() => {
    if (!sliders.length) return;
    const cur = sliders[idx];
    if (cur?.media_type !== 'IMAGE') return;
    const t = setTimeout(
      () => setIdx(p => (p + 1) % sliders.length),
      Math.max(3000, (cur.duration ?? 5) * 1000),
    );
    return () => clearTimeout(t);
  }, [idx, sliders]);

  const slide  = useMemo(() => sliders[idx] ?? null, [idx, sliders]);
  const latest = tickets[0] ?? null;
  const prev   = tickets.slice(1, 4);

  // Pausar video de fondo si el slider actual está reproduciendo un video (para evitar doble decodificación por hardware lagueada)
  useEffect(() => {
    if (bgVideoRef.current) {
      if (slide && slide.media_type === 'VIDEO') {
        bgVideoRef.current.pause();
      } else {
        bgVideoRef.current.play().catch(() => {});
      }
    }
  }, [slide]);

  async function fetchSliders() {
    try {
      const r = await getActiveSliders();
      setSliders(r);
      setIdx(0);
    } catch { setSliders([]); }
  }

  async function fetchCalledTickets() {
    try {
      const r = await getCalledTickets();
      // Ordenar más reciente primero, tomar los últimos 6
      const sorted = r
        .slice()
        .sort((a, b) => new Date(b.called_at ?? 0).getTime() - new Date(a.called_at ?? 0).getTime())
        .slice(0, 6);
      setTickets(sorted);
    } catch { /* silent */ }
  }

  /* ── RENDER ─────────────────────────────────────────────────── */
  return (
    <div style={{
      position: 'relative',
      height: '100dvh', width: '100vw',
      overflow: 'hidden',
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>

      {/* ════ VIDEO DE FONDO — turnero.mp4 full screen ════════════ */}
      <video
        ref={bgVideoRef}
        autoPlay loop muted playsInline
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload nofullscreen noremoteplayback"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          pointerEvents: 'none',
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
      >
        <source src="/sliders/turnero.mp4?v=2" type="video/mp4" />
      </video>

      {/* Overlay oscuro sutil para mejorar legibilidad */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.08)',
        zIndex: 1,
      }} />

      {/* ════ CONTENIDO sobre el video ════════════════════════════ */}
      <div style={{
        position: 'relative', zIndex: 2,
        height: '100%',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── HEADER TRANSPARENTE ─────────────────────────────── */}
        <header style={{
          flexShrink: 0, height: 96,
          background: 'transparent',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 36px',
        }}>
          {/* Píldora fecha | hora (estilo cápsulas superpuestas) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 9999,
            border: '2px solid #CBD5E1',
            padding: '5px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
          }}>
            {/* Cápsula de Fecha (Izquierda) */}
            <div style={{
              backgroundColor: '#1B2A4A',
              color: '#ffffff',
              borderRadius: 9999,
              padding: '10px 24px',
              fontSize: 22,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
            }}>
              {date}
            </div>
            {/* Texto de Hora (Derecha) */}
            <div style={{
              color: '#1B2A4A',
              padding: '0 24px 0 18px',
              fontSize: 26,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
            }}>
              {time}
            </div>
          </div>

          {/* Logo Biogenic */}
          <img src="/logo_biogenic.png" alt="Biogenic" style={{ height: 78, objectFit: 'contain', display: 'block', imageRendering: '-webkit-optimize-contrast' }} />
        </header>

        {/* ── CUERPO ──────────────────────────────────────────── */}
        <div style={{ flexGrow: 1, display: 'flex', overflow: 'hidden', padding: '0 0 20px 0' }}>

          {/* ── PANEL IZQUIERDO — Turnos ────────────────────── */}
          <div style={{
            width: '36%', flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            padding: '0 20px 0 36px',
            gap: 0,
          }}>

            {/* Tarjeta navy: ÚLTIMO LLAMADO */}
            <div style={{
              flexShrink: 0,
              backgroundColor: '#1B2A4A',
              borderRadius: 24,
              padding: '0 16px 16px 16px',
              display: 'flex', flexDirection: 'column', alignItems: 'stretch',
              marginBottom: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}>
              {/* Título ÚLTIMO LLAMADO */}
              <div style={{
                fontFamily: '"Poppins", sans-serif',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                textAlign: 'center',
                padding: '16px 0 12px 0',
              }}>
                Último Llamado
              </div>

              {/* Contenedor Blanco Interno */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: 16,
                padding: '24px 16px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                minHeight: 180,
              }}>
                {latest ? (
                  <>
                    <span style={{
                      fontFamily: '"GoodTimeGrotesk", sans-serif',
                      fontSize: 'clamp(6.0rem, 11.5vw, 10.0rem)',
                      fontWeight: 950,
                      color: '#1E293B',
                      lineHeight: 0.9,
                      letterSpacing: '0.04em',
                      fontVariantNumeric: 'tabular-nums',
                      marginBottom: 4,
                      display: 'block',
                      transform: 'scaleX(1.22)',
                      transformOrigin: 'center',
                    }}>
                      {latest.ticket_number}
                    </span>
                    <span style={{
                      fontFamily: '"Poppins", sans-serif',
                      color: '#488E3E',
                      fontWeight: 900,
                      fontSize: 32,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      marginTop: 8,
                      transform: 'scaleX(1.06)',
                      transformOrigin: 'center',
                    }}>
                      Pase a Recepción
                    </span>
                  </>
                ) : (
                  <span style={{
                    color: '#94A3B8',
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                  }}>
                    Esperando...
                  </span>
                )}
              </div>
            </div>

            {/* Sección ANTERIORES */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '14px 14px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              flexGrow: 1, overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}>
              <p style={{
                fontFamily: '"Poppins", sans-serif',
                color: '#64748B', fontSize: 16, fontWeight: 800,
                letterSpacing: '0.28em', textTransform: 'uppercase',
                margin: '0 0 12px', textAlign: 'center',
              }}>
                Anteriores
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '92%', overflow: 'hidden' }}>
                {prev.length === 0
                  ? <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>
                      Los turnos anteriores aparecerán aquí
                    </p>
                  : prev.map(t => {
                      const hora = t.called_at
                        ? (() => {
                            const d = new Date(t.called_at);
                            let hours = d.getHours();
                            const minutes = d.getMinutes();
                            const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
                            hours = hours % 12;
                            hours = hours ? hours : 12;
                            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
                          })()
                        : '';
                      return (
                        <div key={t.id} style={{
                          background: 'linear-gradient(135deg, #e0e7ff 0%, #fef9c3 100%)',
                          borderRadius: 14,
                          padding: '14px 10px 10px',
                          textAlign: 'center',
                          border: '1px solid rgba(0,0,0,0.06)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                        }}>
                          <div style={{
                            fontFamily: '"GoodTimeGrotesk", sans-serif',
                            fontWeight: 950,
                            fontSize: 'clamp(2.8rem, 4.8vw, 3.8rem)',
                            color: '#1E293B', lineHeight: 1.0,
                            letterSpacing: '0.04em',
                            fontVariantNumeric: 'tabular-nums',
                            transform: 'scaleX(1.18)',
                            transformOrigin: 'center',
                          }}>
                            {t.ticket_number}
                          </div>
                          {hora && (
                            <div style={{
                              fontFamily: '"Poppins", sans-serif',
                              fontSize: 16.5, fontWeight: 900,
                              color: '#488E3E', letterSpacing: '0.08em', marginTop: 8,
                              transform: 'scaleX(1.05)',
                              transformOrigin: 'center',
                            }}>
                              {hora}
                            </div>
                          )}
                        </div>
                      );
                    })
                }
              </div>
            </div>
          </div>

          {/* ── PANEL DERECHO — Sliders del admin ───────────── */}
          <div style={{
            flexGrow: 1,
            padding: '0 20px 0 6px',
            display: 'flex', alignItems: 'stretch',
          }}>
            {slide ? (
              <div style={{
                flexGrow: 1, position: 'relative',
                borderRadius: 16, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              }}>
                {slide.media_type === 'IMAGE' ? (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#000',
                    transform: 'translate3d(0, 0, 0)',
                    willChange: 'transform',
                  }}>
                    {/* Imagen difuminada de fondo */}
                    <img
                      src={slide.image_url ?? ''}
                      alt=""
                      style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        filter: 'blur(20px) brightness(0.4)',
                        transform: 'scale(1.1) translate3d(0, 0, 0)',
                        opacity: 0.6,
                        willChange: 'transform',
                      }}
                    />
                    {/* Imagen real contenida al frente */}
                    <img
                      key={slide.id}
                      src={slide.image_url ?? ''}
                      alt={slide.title}
                      style={{
                        position: 'relative',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        zIndex: 1,
                        transform: 'translate3d(0, 0, 0)',
                        willChange: 'transform',
                      }}
                    />
                  </div>
                ) : (
                  <video
                    key={slide.id}
                    ref={handleVideoLoad}
                    autoPlay
                    muted={!slide.has_sound}
                    playsInline
                    disablePictureInPicture
                    disableRemotePlayback
                    controlsList="nodownload nofullscreen noremoteplayback"
                    onEnded={() => setIdx(p => (p + 1) % sliders.length)}
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'contain',
                      pointerEvents: 'none',
                      transform: 'translate3d(0, 0, 0)',
                      backfaceVisibility: 'hidden',
                      willChange: 'transform',
                    }}
                  >
                    <source src={slide.video_url ?? ''} type="video/mp4" />
                  </video>
                )}


              </div>
            ) : (
              /* Sin sliders: mostrar turnero.mp4 en el panel derecho */
              <div style={{
                flexGrow: 1, position: 'relative',
                borderRadius: 16, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
                <video
                  autoPlay loop muted playsInline
                  disablePictureInPicture
                  disableRemotePlayback
                  controlsList="nodownload nofullscreen noremoteplayback"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                >
                  <source src="/sliders/turnero.mp4?v=2" type="video/mp4" />
                </video>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

