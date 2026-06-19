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
import type { Slider, Ticket } from '@/types';

const WS_URL = '/ws/checkins/';



/* ── Reloj ── */
function pad(n: number) { return String(n).padStart(2, '0'); }
function useClock() {
  const [s, set] = useState({ date: '', time: '' });
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const weekday = n.toLocaleDateString('es-AR', { weekday: 'long' });
      const day = n.getDate();
      const month = n.toLocaleDateString('es-AR', { month: 'long' });
      const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const capMonth = month.charAt(0).toUpperCase() + month.slice(1);
      set({
        date: `${capWeekday}, ${day} De ${capMonth}`,
        time: `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return s;
}

/* ── Anuncio de turno: ding + TTS x2 ── */
function playDing() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();

    const hit = (freq: number, start: number, dur: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(vol, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };

    // Campanazo de hospital: dos notas fuertes
    hit(880, 0.0,  1.2, 0.55);   // A5 — primer ding
    hit(660, 0.0,  1.0, 0.30);   // E5 — armónico
    hit(880, 0.55, 1.0, 0.40);   // segundo ding
    hit(660, 0.55, 0.8, 0.20);
  } catch { /* ignore */ }
}

function speakTTS(text: string, getTTSUrl: (t: string) => string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(getTTSUrl(text));
    audio.volume = 1.0;
    audio.onended = () => resolve();
    audio.onerror  = () => resolve();
    audio.play().catch(() => resolve());
  });
}

async function announceTicket(ticketNumber: string) {
  if (announceTicket._busy) return;       // ya hay un anuncio en curso
  announceTicket._busy = true;
  window.dispatchEvent(new CustomEvent('ticket-announcement-start'));
  try {
    const phrase = `Turno ${ticketNumber}, por favor pase a recepción`;
    playDing();
    await new Promise(r => setTimeout(r, 1800)); // esperar que el ding termine
    await speakTTS(phrase, getTTS);
    await new Promise(r => setTimeout(r, 900));
    await speakTTS(phrase, getTTS);
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
        const exists = cur.some(x => x.id === t.id);
        if (exists) {
          return cur.map(x => x.id === t.id ? t : x);
        } else {
          return [t, ...cur.filter(x => x.id !== t.id)].slice(0, 6);
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
  const prev   = tickets.slice(1, 5);

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
        }}
      >
        <source src="/sliders/turnero.mp4" type="video/mp4" />
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
          <img src="/logo_biogenic.png" alt="Biogenic" style={{ height: 78, objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
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
                      fontSize: 'clamp(3.2rem, 6vw, 5.5rem)',
                      fontWeight: 900,
                      color: '#1E293B',
                      lineHeight: 1.0,
                      letterSpacing: '0.02em',
                      fontVariantNumeric: 'tabular-nums',
                      marginBottom: 12,
                    }}>
                      {latest.ticket_number}
                    </span>
                    <span style={{
                      fontFamily: '"Poppins", sans-serif',
                      color: '#488E3E',
                      fontWeight: 800,
                      fontSize: 20,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '65%', overflow: 'hidden' }}>
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
                          padding: '12px 14px 10px',
                          textAlign: 'center',
                          border: '1px solid rgba(0,0,0,0.06)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                        }}>
                          <div style={{
                            fontFamily: '"GoodTimeGrotesk", sans-serif',
                            fontWeight: 900,
                            fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)',
                            color: '#1E293B', lineHeight: 1.0,
                            letterSpacing: '0.02em',
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {t.ticket_number}
                          </div>
                          {hora && (
                            <div style={{
                              fontFamily: '"Poppins", sans-serif',
                              fontSize: 10.5, fontWeight: 700,
                              color: '#488E3E', letterSpacing: '0.04em', marginTop: 5,
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
                {slide.media_type === 'IMAGE'
                  ? <img
                      key={slide.id}
                      src={slide.image_url ?? ''}
                      alt={slide.title}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  : <video
                      key={slide.id}
                      ref={handleVideoLoad}
                      autoPlay
                      muted={!slide.has_sound}
                      playsInline
                      disablePictureInPicture
                      disableRemotePlayback
                      controlsList="nodownload nofullscreen noremoteplayback"
                      onEnded={() => setIdx(p => (p + 1) % sliders.length)}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                    >
                      <source src={slide.video_url ?? ''} type="video/mp4" />
                    </video>
                }


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
                  <source src="/sliders/turnero.mp4" type="video/mp4" />
                </video>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

