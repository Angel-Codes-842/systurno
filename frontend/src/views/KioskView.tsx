/**
 * KioskView — Totem táctil de autogestión de turnos
 *
 * Diseñado para pantalla touch 14-15":
 *  - Targets táctiles mínimo 80px altura
 *  - Fondo navy consistente con el Display
 *  - 3 tarjetas de servicio grandes e inmersivas
 *  - Success screen con número prominente
 *  - Ticket térmico 80mm al imprimir
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { CircularProgress, Fade } from '@mui/material';
import {
  Science as AnalysisIcon,
  AssignmentReturned as ResultsIcon,
  RequestQuote as BudgetIcon,
  CheckCircle as CheckIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { generateTicket } from '@/services/api';
import { getServiceTypeLabel } from '@/utils/format';
import type { Ticket, ServiceType } from '@/types';

/* ── Configuración por servicio ── */
const SVC: Record<ServiceType, {
  label: string; desc: string;
  accent: string; light: string; dark: string;
  Icon: React.ElementType;
}> = {
  ANALYSIS: {
    label: 'Análisis Clínicos',
    desc: 'Extracciones, estudios y entrega de órdenes médicas',
    accent: '#7C3AED', light: '#EDE9FE', dark: '#4C1D95',
    Icon: AnalysisIcon,
  },
  RESULTS: {
    label: 'Retirar Resultados',
    desc: 'Retiro de estudios listos e informes impresos',
    accent: '#16A34A', light: '#DCFCE7', dark: '#14532D',
    Icon: ResultsIcon,
  },
  BUDGET: {
    label: 'Presupuesto',
    desc: 'Consulta de aranceles y coberturas de seguros',
    accent: '#D97706', light: '#FEF3C7', dark: '#78350F',
    Icon: BudgetIcon,
  },
};

const SERVICES: ServiceType[] = ['ANALYSIS', 'RESULTS', 'BUDGET'];

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
        time: `${pad(n.getHours())}:${pad(n.getMinutes())}`,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return s;
}

/* ════════════════════════════════════════════════════════════════ */
export function KioskView() {
  const [phase, setPhase] = useState<'menu' | 'loading' | 'success'>('menu');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [countdown, setCountdown] = useState(8);
  const [pressed, setPressed] = useState<ServiceType | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { date, time } = useClock();

  useEffect(() => {
    document.title = 'Biogenic — Solicitud de Turno';
  }, []);

  /* Countdown automático en success */
  useEffect(() => {
    if (phase !== 'success') return;
    setCountdown(8);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { reset(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('menu');
    setTicket(null);
  }, []);

  const select = useCallback(async (svc: ServiceType) => {
    if (phase !== 'menu') return;
    setPressed(svc);
    await new Promise(r => setTimeout(r, 150)); // feedback táctil
    setPressed(null);
    setPhase('loading');
    try {
      const t = await generateTicket(svc);
      setTicket(t);
      setPhase('success');
      setTimeout(() => window.print(), 400);
    } catch {
      setPhase('menu');
    }
  }, [phase]);

  const svc = ticket ? SVC[ticket.service_type] : null;

  return (
    <div style={{
      position: 'relative',
      height: '100dvh', width: '100vw',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Inter", system-ui, sans-serif',
      overflow: 'hidden',
      userSelect: 'none',
    }}>

      {/* Video de fondo — turnero.mp4 */}
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

      {/* Overlay sutil para legibilidad */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.08)',
        zIndex: 1,
      }} />

      {/* ── HEADER ── */}
      <header style={{
        flexShrink: 0, height: 76, zIndex: 2,
        background: '#1B2A4A',
        backgroundImage: 'repeating-linear-gradient(-45deg,transparent,transparent 14px,rgba(255,255,255,0.015) 14px,rgba(255,255,255,0.015) 15px)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
      }}>
        {/* Logo */}
        <div style={{
          background: '#fff', borderRadius: 10,
          padding: '6px 14px', display: 'flex', alignItems: 'center',
        }}>
          <img src="/logo_biogenic.png" alt="Biogenic"
            style={{ height: 46, objectFit: 'contain', display: 'block' }} />
        </div>

        {/* Fecha + Hora */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
            textTransform: 'capitalize', letterSpacing: '0.04em',
          }}>
            {date}
          </div>
          <div style={{
            fontSize: 30, fontWeight: 800, color: '#ffffff',
            fontVariantNumeric: 'tabular-nums', letterSpacing: '0.08em',
            lineHeight: 1.1,
          }}>
            {time}
          </div>
        </div>
      </header>

      {/* ── CUERPO ── */}
      <main style={{
        flexGrow: 1, zIndex: 2,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 32px',
      }}>

        {/* MENÚ */}
        {phase === 'menu' && (
          <Fade in timeout={300}>
            <div style={{ width: '100%', maxWidth: 1000 }}>
              {/* Título */}
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <h1 style={{
                  margin: 0, color: '#ffffff',
                  fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                  fontWeight: 800, letterSpacing: '-0.01em',
                }}>
                  ¿Cuál es el motivo de su visita?
                </h1>
                <p style={{
                  margin: '8px 0 0', color: 'rgba(255,255,255,0.6)',
                  fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', fontWeight: 500,
                }}>
                  Toque la opción correspondiente para generar su turno
                </p>
              </div>

              {/* Tarjetas de servicio */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {SERVICES.map(key => {
                  const c = SVC[key];
                  const Icon = c.Icon;
                  const isPressed = pressed === key;
                  return (
                    <button
                      key={key}
                      onClick={() => select(key)}
                      style={{
                        background: '#ffffff',
                        border: isPressed ? `2px solid ${c.accent}` : '2px solid transparent',
                        borderRadius: 16,
                        padding: '32px 24px 28px',
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', textAlign: 'center',
                        gap: 16, width: '100%',
                        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
                        transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {/* Ícono con fondo pastel */}
                      <div style={{
                        width: 80, height: 80, borderRadius: 18,
                        background: c.light,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon style={{ fontSize: 44, color: c.accent }} />
                      </div>

                      {/* Texto */}
                      <div>
                        <div style={{
                          fontSize: 'clamp(1rem, 1.8vw, 1.25rem)',
                          fontWeight: 800, color: '#0F172A',
                          letterSpacing: '-0.01em', marginBottom: 6,
                        }}>
                          {c.label}
                        </div>
                        <div style={{
                          fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)',
                          color: '#475569',
                          lineHeight: 1.5, fontWeight: 400,
                        }}>
                          {c.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Fade>
        )}

        {/* CARGANDO */}
        {phase === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <CircularProgress size={80} thickness={3} sx={{ color: '#1B2A4A' }} />
            <div style={{ color: '#ffffff', fontSize: 22, fontWeight: 700 }}>
              Generando su turno...
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {phase === 'success' && ticket && svc && (
          <Fade in timeout={400}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center', width: '100%', maxWidth: 520,
            }}>
              {/* Check */}
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(22,163,74,0.13)',
                border: '2px solid #16A34A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <CheckIcon style={{ fontSize: 44, color: '#16A34A' }} />
              </div>

              <div style={{ color: '#16A34A', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                ¡Turno generado exitosamente!
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 28 }}>
                Su número de atención es:
              </div>

              {/* Número de turno — caja blanca sólida */}
              <div style={{
                background: '#ffffff',
                border: `3px solid ${svc.accent}`,
                borderRadius: 24,
                padding: '20px 60px',
                marginBottom: 24,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}>
                <div style={{
                  fontSize: 'clamp(4rem, 12vw, 6rem)',
                  fontWeight: 900, color: svc.dark,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1, letterSpacing: '-0.01em',
                }}>
                  {ticket.ticket_number}
                </div>
              </div>

              {/* Servicio — pill pastel sólido */}
              <div style={{
                background: svc.light,
                borderRadius: 99, padding: '6px 20px',
                fontSize: 13, fontWeight: 800,
                color: svc.dark, letterSpacing: '0.1em',
                textTransform: 'uppercase', marginBottom: 20,
              }}>
                {getServiceTypeLabel(ticket.service_type)}
              </div>

              <div style={{
                color: 'rgba(255,255,255,0.55)', fontSize: 14,
                lineHeight: 1.6, marginBottom: 32,
              }}>
                Retire su ticket impreso y aguarde en la<br />
                sala de espera a ser llamado en la pantalla.
              </div>

              {/* Botón volver — navy sólido */}
              <button
                onClick={reset}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#1B2A4A',
                  border: 'none',
                  borderRadius: 12, padding: '14px 28px',
                  cursor: 'pointer', color: '#ffffff',
                  fontSize: 15, fontWeight: 700,
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <BackIcon style={{ fontSize: 18, opacity: 0.7 }} />
                Volver al inicio ({countdown}s)
                <CircularProgress
                  variant="determinate"
                  value={(countdown / 8) * 100}
                  size={22} thickness={5}
                  sx={{ color: '#ffffff' }}
                />
              </button>
            </div>
          </Fade>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        flexShrink: 0, zIndex: 2, textAlign: 'center',
        padding: '12px 0', color: 'rgba(255,255,255,0.2)',
        fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        © {new Date().getFullYear()} BIOGENIC — Diagnóstico Laboratorial del Grupo San Antonio
      </footer>

      {/* ── TICKET TÉRMICO 80mm ── */}
      {ticket && (
        <div id="print-ticket">
          <div className="tk-brand">BIOGENIC</div>
          <div className="tk-sub">Diagnóstico Laboratorial</div>
          <div className="tk-sub">del Grupo San Antonio</div>
          <div className="tk-divider">{'- '.repeat(24)}</div>
          <div className="tk-service">{getServiceTypeLabel(ticket.service_type)}</div>
          <div className="tk-divider">{'-'.repeat(32)}</div>
          <div className="tk-label">SU NÚMERO DE ATENCIÓN</div>
          <div className="tk-number">{ticket.ticket_number}</div>
          <div className="tk-divider">{'-'.repeat(32)}</div>
          <div className="tk-row">
            <span>Fecha:</span>
            <span>{new Date(ticket.created_at).toLocaleDateString('es-AR')}</span>
          </div>
          <div className="tk-row">
            <span>Hora:</span>
            <span>{new Date(ticket.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="tk-divider">{'- '.repeat(24)}</div>
          <div className="tk-footer">Por favor aguarde en la</div>
          <div className="tk-footer">sala de espera a ser llamado</div>
          <div className="tk-footer">en la pantalla principal.</div>
          <div className="tk-footer" style={{ marginTop: 6 }}>¡Muchas gracias!</div>
          <div className="tk-divider" style={{ marginTop: 10 }}>{'* '.repeat(16)}</div>
        </div>
      )}

      {/* ── CSS GLOBAL: pantalla + impresión ── */}
      <style>{`
        /* Ocultar ticket en pantalla */
        #print-ticket {
          visibility: hidden;
          position: absolute;
          top: -9999px;
          pointer-events: none;
        }

        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }

          /* Ocultar todo con visibility (sobreescribible en hijos) */
          * { visibility: hidden !important; }

          #print-ticket,
          #print-ticket * {
            visibility: visible !important;
          }

          #print-ticket {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 72mm;
            padding: 4mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11pt;
            color: #000 !important;
            background: #fff !important;
          }

          .tk-brand {
            font-size: 18pt; font-weight: 900;
            text-align: center; letter-spacing: 0.15em;
            margin-bottom: 2px;
          }
          .tk-sub {
            font-size: 8pt; text-align: center;
            letter-spacing: 0.05em;
          }
          .tk-divider {
            font-size: 9pt; text-align: center;
            margin: 5px 0; letter-spacing: -1px; word-spacing: -3px;
          }
          .tk-service {
            font-size: 11pt; font-weight: 700;
            text-align: center; text-transform: uppercase;
            letter-spacing: 0.08em; margin: 4px 0;
          }
          .tk-label {
            font-size: 8pt; text-align: center;
            letter-spacing: 0.1em; margin-bottom: 4px;
          }
          .tk-number {
            font-size: 54pt; font-weight: 900;
            text-align: center; letter-spacing: 0.05em;
            line-height: 1; margin: 6px 0;
          }
          .tk-row {
            display: flex; justify-content: space-between;
            font-size: 9pt; margin: 2px 4px;
          }
          .tk-footer {
            font-size: 8.5pt; text-align: center; margin: 1px 0;
          }
        }
      `}</style>
    </div>
  );
}
