/**
 * KioskView — Totem táctil de autogestión de turnos
 *
 * Diseñado para pantalla touch 14-15":
 *  - Targets táctiles mínimo 80px altura
 *  - Video de fondo turnero.mp4 con overlay sutil
 *  - 3 tarjetas de servicio blancas sólidas
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
import { useClock } from '@/hooks/useClock';
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
    <div className="kiosk-root" style={{
      position: 'relative',
      height: '100dvh', width: '100vw',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Inter", system-ui, sans-serif',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      <div className="kiosk-screen" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative',
      }}>

      {/* Video de fondo — turnero.mp4 */}
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
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
      >
        <source src="/sliders/turnero.mp4?v=2" type="video/mp4" />
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
        background: 'transparent',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Logo Biogenic */}
        <img src="/logo_biogenic.png" alt="Biogenic" style={{ height: 56, objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />

        {/* Fecha + Hora — píldora (estilo cápsulas superpuestas) */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderRadius: 9999,
          border: '1.5px solid #CBD5E1',
          padding: '3px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          {/* Cápsula de Fecha (Izquierda) */}
          <div style={{
            backgroundColor: '#1B2A4A',
            color: '#ffffff',
            borderRadius: 9999,
            padding: '6px 18px',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
          }}>
            {date}
          </div>
          {/* Texto de Hora (Derecha) */}
          <div style={{
            color: '#1B2A4A',
            padding: '0 18px 0 14px',
            fontSize: 16,
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
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
                  margin: 0,
                  color: '#0F172A',
                  fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                  fontWeight: 800, letterSpacing: '-0.01em',
                  textShadow: '0 0 16px rgba(255,255,255,0.7), 0 2px 4px rgba(255,255,255,0.5)',
                }}>
                  ¿Cuál es el motivo de su visita?
                </h1>
                <p style={{
                  margin: '8px 0 0',
                  color: '#1e293b',
                  fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', fontWeight: 500,
                  textShadow: '0 0 12px rgba(255,255,255,0.6), 0 2px 4px rgba(255,255,255,0.4)',
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

              <div style={{ color: '#16A34A', fontSize: 18, fontWeight: 700, marginBottom: 6, textShadow: '0 1px 4px rgba(255,255,255,0.3)' }}>
                ¡Turno generado exitosamente!
              </div>
              <div style={{ color: '#1e293b', fontSize: 14, marginBottom: 28, fontWeight: 500, textShadow: '0 0 10px rgba(255,255,255,0.5), 0 1px 3px rgba(255,255,255,0.3)' }}>
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
                  fontFamily: '"GoodTimeGrotesk", sans-serif',
                  fontSize: 'clamp(3rem, 10vw, 5rem)',
                  fontWeight: 900, color: svc.dark,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1, letterSpacing: '0.02em',
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
                color: '#1e293b', fontSize: 14, fontWeight: 500,
                lineHeight: 1.6, marginBottom: 32,
                textShadow: '0 0 10px rgba(255,255,255,0.5), 0 1px 3px rgba(255,255,255,0.3)',
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
      <div style={{
        flexShrink: 0, zIndex: 2, textAlign: 'center',
        padding: '12px 0', color: 'rgba(255,255,255,0.2)',
        fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        © {new Date().getFullYear()} BIOGENIC — Diagnóstico Laboratorial del Grupo San Antonio
      </div>

      {/* ── TICKET TÉRMICO 80mm ── */}
      {ticket && (
        <div id="print-ticket">
          <div className="tk-header">
            <div className="tk-brand">BIOGENIC</div>
            <div className="tk-sub">Diagnóstico Lab · Grupo San Antonio</div>
          </div>
          <div className="tk-service-box">
            <div className="tk-service">{getServiceTypeLabel(ticket.service_type)}</div>
          </div>
          <div className="tk-number-block">
            <div className="tk-number">{ticket.ticket_number}</div>
            <div className="tk-label">SU TURNO</div>
          </div>
          <div className="tk-meta">
            <span>{new Date(ticket.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            <span>{new Date(ticket.created_at).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          </div>
          <div className="tk-footer">Aguarde a ser llamado en pantalla · ¡Gracias!</div>
        </div>
      )}

      {/* ── CSS GLOBAL: pantalla + impresión ── */}
      <style>{`
        #print-ticket {
          display: none;
        }

        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }

          /* Ocultar interfaz del kiosco sin afectar la raíz de React */
          .kiosk-screen {
            display: none !important;
          }

          /* Anular estilos del raíz para que no corte por overflow/altura */
          .kiosk-root {
            height: auto !important;
            width: auto !important;
            overflow: visible !important;
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Mostrar el ticket en flujo normal para cálculo de alto auto */
          #print-ticket {
            display: block !important;
            position: static !important;
            width: 72mm;
            padding: 2mm 3mm 2mm;
            font-family: 'Courier New', Courier, monospace;
            color: #000 !important;
            background: #fff !important;
            box-sizing: border-box;
            line-height: 1;
          }

          .tk-header {
            text-align: center;
            border-bottom: 1.5px solid #000;
            padding-bottom: 2px;
            margin-bottom: 3px;
          }
          .tk-brand {
            font-size: 16pt;
            font-weight: 900;
            letter-spacing: 0.15em;
            line-height: 1;
          }
          .tk-sub {
            font-size: 6pt;
            line-height: 1;
            margin-top: 1px;
          }

          .tk-service-box {
            border: 1px solid #000;
            padding: 1px 3px;
            margin-bottom: 3px;
            text-align: center;
          }
          .tk-service {
            font-size: 9.5pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            line-height: 1;
          }

          .tk-number-block {
            text-align: center;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 2px 0;
            margin-bottom: 3px;
          }
          .tk-number {
            font-size: 22pt;
            font-weight: 900;
            letter-spacing: 0.04em;
            line-height: 1;
          }
          .tk-label {
            font-size: 6pt;
            letter-spacing: 0.12em;
            line-height: 1;
          }

          .tk-meta {
            display: flex;
            justify-content: space-between;
            font-size: 7.5pt;
            font-weight: 700;
            line-height: 1;
            border-bottom: 1px dashed #666;
            padding-bottom: 2px;
            margin-bottom: 2px;
          }

          .tk-footer {
            font-size: 6.5pt;
            text-align: center;
            line-height: 1;
          }
        }
      `}</style>
    </div>
  );
}
