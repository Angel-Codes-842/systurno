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

import { useEffect, useMemo, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getActiveSliders, getCalledTickets, getTTS } from '@/services/api';
import type { Slider, Ticket } from '@/types';

const WS_URL = '/ws/checkins/';

/* ── Colores por tipo de servicio (chips de ANTERIORES) ── */
const CHIP_COLORS: Record<string, { bg: string; num: string; time: string }> = {
  ANALYSIS: { bg: 'rgba(237,233,254,0.92)', num: '#4C1D95', time: '#7C3AED' },
  RESULTS:  { bg: 'rgba(220,252,231,0.92)', num: '#14532D', time: '#16A34A' },
  BUDGET:   { bg: 'rgba(254,243,199,0.92)', num: '#78350F', time: '#D97706' },
};

/* ── Reloj ── */
function pad(n: number) { return String(n).padStart(2, '0'); }
function useClock() {
  const [s, set] = useState({ date: '', time: '' });
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      set({
        date: n.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
              .replace(/^\w/, c => c.toUpperCase()),
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
  try {
    const phrase = `Turno ${ticketNumber}, por favor pase a recepción`;
    playDing();
    await new Promise(r => setTimeout(r, 1800)); // esperar que el ding termine
    await speakTTS(phrase, getTTS);
    await new Promise(r => setTimeout(r, 900));
    await speakTTS(phrase, getTTS);
  } finally {
    announceTicket._busy = false;
  }
}
announceTicket._busy = false;


/* ════════════════════════════════════════════════════════════════ */
export function DisplayView() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [idx,     setIdx]     = useState(0);
  const { date, time } = useClock();

  /* WebSocket: escucha llamados y actualizaciones de slider */
  useWebSocket(WS_URL, {
    onTicketCalled: (t) => {
      setTickets(cur => [t, ...cur.filter(x => x.id !== t.id)].slice(0, 6));
      announceTicket(t.ticket_number);
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
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          zIndex: 0,
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
          flexShrink: 0, height: 72,
          background: 'transparent',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
        }}>
          {/* Píldora fecha | hora */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            backgroundColor: 'rgba(15,23,42,0.75)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            borderRadius: 9999,
            padding: '9px 22px',
            whiteSpace: 'nowrap', flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>
              {date}
            </span>
            <span style={{ display: 'inline-block', width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.35)' }} />
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums' }}>
              {time}
            </span>
          </div>

          {/* Logo Biogenic */}
          <img src="/logo_biogenic.png" alt="Biogenic" style={{ height: 68, objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }} />
        </header>

        {/* ── CUERPO ──────────────────────────────────────────── */}
        <div style={{ flexGrow: 1, display: 'flex', overflow: 'hidden', padding: '0 0 20px 0' }}>

          {/* ── PANEL IZQUIERDO — Turnos ────────────────────── */}
          <div style={{
            width: '36%', flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            padding: '0 20px 0 20px',
            gap: 0,
          }}>

            {/* Tarjeta navy: ÚLTIMO LLAMADO */}
            <div style={{
              flexShrink: 0,
              backgroundColor: '#1B2A4A',
              backgroundImage: 'repeating-linear-gradient(-45deg,transparent,transparent 14px,rgba(255,255,255,0.02) 14px,rgba(255,255,255,0.02) 15px)',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '18px 16px 26px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              marginBottom: 12,
            }}>
              {/* Badge ÚLTIMO LLAMADO */}
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.35)',
                borderRadius: 9,
                padding: '10px 0',
                width: '100%', textAlign: 'center',
                marginBottom: 14,
              }}>
                <span style={{
                  color: '#fff', fontWeight: 900, fontSize: 15,
                  letterSpacing: '0.3em', textTransform: 'uppercase',
                }}>
                  Último Llamado
                </span>
              </div>

              {/* Número de turno */}
              <div style={{
                border: '4px solid #1B2A4A',
                borderRadius: 12,
                padding: '10px 0',
                width: '90%', textAlign: 'center',
                backgroundColor: '#ffffff',
                marginBottom: 14,
                minHeight: 90,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}>
                {latest
                  ? <span style={{
                      fontSize: 'clamp(3.2rem, 6vw, 5.5rem)',
                      fontWeight: 900, color: '#1B2A4A',
                      lineHeight: 1, letterSpacing: '-0.01em',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {latest.ticket_number}
                    </span>
                  : <span style={{
                      color: 'rgba(255,255,255,0.3)', fontSize: 12,
                      fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                    }}>
                      Esperando...
                    </span>
                }
              </div>

              {/* PASE A RECEPCIÓN */}
              {latest && (
                <span style={{
                  color: '#4ADE80', fontWeight: 900,
                  fontSize: 20, letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  textShadow: '0 0 20px rgba(74,222,128,0.4), 0 2px 4px rgba(0,0,0,0.3)',
                }}>
                  Pase a Recepción
                </span>
              )}
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
                color: '#64748B', fontSize: 16, fontWeight: 800,
                letterSpacing: '0.28em', textTransform: 'uppercase',
                margin: '0 0 12px', textAlign: 'center',
              }}>
                Anteriores
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '76%', overflow: 'hidden' }}>
                {prev.length === 0
                  ? <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>
                      Los turnos anteriores aparecerán aquí
                    </p>
                  : prev.map(t => {
                      const c = CHIP_COLORS[t.service_type] ?? CHIP_COLORS['ANALYSIS'];
                      const hora = t.called_at
                        ? new Date(t.called_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                        : '';
                      return (
                        <div key={t.id} style={{
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          borderRadius: 10,
                          padding: '7px 10px 6px',
                          textAlign: 'center',
                          border: `1px solid ${c.time}44`,
                        }}>
                          <div style={{
                            fontWeight: 900,
                            fontSize: 'clamp(1.3rem, 2.4vw, 1.7rem)',
                            color: c.num, lineHeight: 1.05,
                            letterSpacing: '0.04em',
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {t.ticket_number}
                          </div>
                          {hora && (
                            <div style={{
                              fontSize: 10, fontWeight: 700,
                              color: c.time, letterSpacing: '0.06em', marginTop: 3,
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
                      autoPlay muted playsInline
                      onEnded={() => setIdx(p => (p + 1) % sliders.length)}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
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
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
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

