/**
 * SpecialistView — Panel de Recepción
 *
 * Tab 1: TURNOS — cola de espera + llamar turnos
 * Tab 2: SLIDERS — cargar/gestionar imágenes y videos para el display
 *
 * Diseño consistente con DisplayView y KioskView:
 *  - Header navy #1B2A4A con logo Biogenic
 *  - Misma paleta de chips por servicio
 */

import { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Card, CardContent,
  Button, Chip, IconButton, Tooltip, Divider,
  CircularProgress, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, Checkbox,
} from '@mui/material';
import {
  Campaign as CallIcon,
  Replay as RecallIcon,
  CheckCircle as AttendIcon,
  Cancel as CancelIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  People as QueueIcon,
  Slideshow as SliderIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  WifiOff as OfflineIcon,
  Circle as DotIcon,
  VolumeUp as VoiceIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  getWaitingTickets, getCalledTickets, getAttendedTickets, callTicket, recallTicket,
  attendTicket, cancelTicket, getTicketStats,
  getActiveSliders, uploadSlider, deleteSlider, updateSlider,
  getVoices, uploadVoice, activateVoice, deleteVoice, getVoiceTestAudioUrl,
} from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { Ticket, Slider, TicketStats, Voice } from '@/types';

const WS_URL = '/ws/checkins/';

import { SERVICES_CONFIG as SVC } from '@/utils/constants';

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/* ════════════════════════════════════════════════════════════════ */
export function SpecialistView() {
  const [tab, setTab] = useState(0);
  const [trigger, setTrigger] = useState(0);

  const { isConnected } = useWebSocket(WS_URL, {
    onNewTicket:    () => setTrigger(p => p + 1),
    onTicketCalled: () => setTrigger(p => p + 1),
    onSliderUpdate: () => setTrigger(p => p + 1),
  });

  return (
    <Box sx={{
      minHeight: '100vh', bgcolor: '#F1F5F9',
      fontFamily: '"Inter", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── HEADER UNIFICADO (Premium Dark Navbar) ── */}
      <Box component="header" sx={{
        bgcolor: '#1B2A4A',
        backgroundImage: 'repeating-linear-gradient(-45deg,transparent,transparent 14px,rgba(255,255,255,0.015) 14px,rgba(255,255,255,0.015) 15px)',
        height: 72,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        px: 4, flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Izquierda: Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo_biogenic.png" alt="Biogenic" style={{ height: 52, objectFit: 'contain', display: 'block', filter: 'brightness(0) invert(1)' }} />
        </Box>

        {/* Centro: Tabs integrados en el Navbar */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            height: 72,
            '& .MuiTabs-flexContainer': { height: '100%' },
            '& .MuiTab-root': {
              fontWeight: 700,
              textTransform: 'none',
              fontSize: 14,
              color: 'rgba(255,255,255,0.6)',
              minHeight: 72,
              px: 3,
              gap: 1,
              transition: 'all 0.2s',
              '&:hover': {
                color: '#fff',
                backgroundColor: 'rgba(255,255,255,0.04)',
              }
            },
            '& .Mui-selected': {
              color: '#ffffff !important',
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#ffffff',
              height: 3,
            },
          }}
        >
          <Tab icon={<QueueIcon fontSize="small" />} iconPosition="start" label="Turnos" />
          <Tab icon={<SliderIcon fontSize="small" />} iconPosition="start" label="Sliders del Display" />
          <Tab icon={<VoiceIcon fontSize="small" />} iconPosition="start" label="Configuración de Voz" />
        </Tabs>

        {/* Derecha: Estado WebSocket */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            {isConnected ? (
              <DotIcon sx={{ fontSize: 10, color: '#4ADE80' }} />
            ) : (
              <OfflineIcon sx={{ fontSize: 14, color: '#F87171' }} />
            )}
            <Typography fontSize={12} color={isConnected ? '#4ADE80' : '#F87171'} fontWeight={600}>
              {isConnected ? 'Conectado' : 'Sin conexión'}
            </Typography>
          </Box>

          <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
            Panel de Recepción
          </Typography>
        </Box>
      </Box>

      {/* ── CONTENIDO ── */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2.5 }}>
        {tab === 0 && <TurnosTab trigger={trigger} />}
        {tab === 1 && <SlidersTab trigger={trigger} />}
        {tab === 2 && <VoicesTab />}
      </Box>
    </Box>
  );
}

/* ════════════════════════════════ TAB: TURNOS ═══════════════════ */
function TurnosTab({ trigger }: { trigger: number }) {
  const [waiting,  setWaiting]  = useState<Ticket[]>([]);
  const [called,   setCalled]   = useState<Ticket | null>(null);
  const [attendedHistory, setAttendedHistory] = useState<Ticket[]>([]);
  const [calledList, setCalledList] = useState<Ticket[]>([]);
  const [stats,    setStats]    = useState<TicketStats | null>(null);
  const [acting,   setActing]   = useState<number | null>(null);
  const [loading,  setLoading]  = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => { refresh(); }, [trigger]);
  useEffect(() => { refresh(); }, []);

  async function refresh() {
    try {
      const [w, s, h, a] = await Promise.all([
        getWaitingTickets(),
        getTicketStats(),
        getCalledTickets(),
        getAttendedTickets()
      ]);
      
      const priorityMap: Record<string, number> = {
        'RESULTS': 1,  // R-n
        'BUDGET': 2,   // P-n
        'ANALYSIS': 3, // A-n
      };
      
      const sortedWaiting = w.slice().sort((a, b) => {
        const prioA = priorityMap[a.service_type] ?? 99;
        const prioB = priorityMap[b.service_type] ?? 99;
        if (prioA !== prioB) {
          return prioA - prioB;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      setWaiting(sortedWaiting);
      setStats(s);
      
      // Todos los llamados para la cola "Llamados"
      const sortedCalled = h
        .slice()
        .sort((x, y) => new Date(y.called_at ?? 0).getTime() - new Date(x.called_at ?? 0).getTime());
      setCalledList(sortedCalled.filter(t => t.status === 'CALLED'));
      
      // Historial de atendidos ordenados por hora de atención (los más recientes primero)
      const sortedAttended = a
        .slice()
        .sort((x, y) => new Date(y.attended_at ?? 0).getTime() - new Date(x.attended_at ?? 0).getTime());
      setAttendedHistory(sortedAttended.slice(0, 3));
      
      // El turno en pantalla es el último llamado (el que está en el display)
      setCalled(sortedCalled[0] ?? null);
    } catch { /* silent */ }
  }

  async function handleCall(t: Ticket) {
    setActing(t.id);
    try {
      const updated = await callTicket(t.id);
      setCalled(updated);
      enqueueSnackbar(`Turno ${t.ticket_number} llamado`, { variant: 'success' });
      await refresh();
    } catch (e: unknown) {
      enqueueSnackbar((e as Error).message, { variant: 'error' });
    } finally { setActing(null); }
  }

  async function handleRecall() {
    if (!called) return;
    setActing(called.id);
    try {
      const updated = await recallTicket(called.id);
      setCalled(updated);
      enqueueSnackbar(`Turno ${called.ticket_number} re-llamado`, { variant: 'info' });
      await refresh();
    } catch (e: unknown) {
      enqueueSnackbar((e as Error).message, { variant: 'error' });
    } finally { setActing(null); }
  }

  async function handleRecallFromQueue(t: Ticket) {
    setActing(t.id);
    try {
      const updated = await recallTicket(t.id);
      setCalled(updated);
      enqueueSnackbar(`Turno ${t.ticket_number} re-llamado`, { variant: 'info' });
      await refresh();
    } catch (e: unknown) {
      enqueueSnackbar((e as Error).message, { variant: 'error' });
    } finally { setActing(null); }
  }

  async function handleCancelFromQueue(t: Ticket) {
    setActing(t.id);
    try {
      await cancelTicket(t.id);
      enqueueSnackbar(`Turno ${t.ticket_number} cancelado`, { variant: 'warning' });
      // Si el ticket cancelado está en "En pantalla ahora", limpiarlo
      setCalled(prev => prev?.id === t.id ? null : prev);
      await refresh();
    } catch (e: unknown) {
      enqueueSnackbar((e as Error).message, { variant: 'error' });
    } finally { setActing(null); }
  }

  async function handleAttendFromQueue(t: Ticket) {
    setActing(t.id);
    try {
      await attendTicket(t.id);
      enqueueSnackbar(`Turno ${t.ticket_number} atendido ✓`, { variant: 'success' });
      setCalled(prev => prev?.id === t.id ? null : prev);
      await refresh();
    } catch (e: unknown) {
      enqueueSnackbar((e as Error).message, { variant: 'error' });
    } finally { setActing(null); }
  }

  async function handleAttend() {
    if (!called) return;
    setActing(called.id);
    try {
      await attendTicket(called.id);
      enqueueSnackbar(`Turno ${called.ticket_number} atendido ✓`, { variant: 'success' });
      setCalled(null);
      await refresh();
    } catch (e: unknown) {
      enqueueSnackbar((e as Error).message, { variant: 'error' });
    } finally { setActing(null); }
  }

  async function handleCancel() {
    if (!called) return;
    setActing(called.id);
    try {
      await cancelTicket(called.id);
      enqueueSnackbar(`Turno ${called.ticket_number} cancelado`, { variant: 'warning' });
      setCalled(null);
      await refresh();
    } catch (e: unknown) {
      enqueueSnackbar((e as Error).message, { variant: 'error' });
    } finally { setActing(null); }
  }

  const svc = called ? SVC[called.service_type] ?? SVC['ANALYSIS'] : null;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2.5, alignItems: 'start' }}>

      {/* ── PANEL IZQUIERDO ── */}
      <Stack spacing={2.5}>

        {/* Turno en pantalla */}
        <Card sx={{
          borderRadius: 3, bgcolor: '#1B2A4A',
          backgroundImage: 'repeating-linear-gradient(-45deg,transparent,transparent 14px,rgba(255,255,255,0.02) 14px,rgba(255,255,255,0.02) 15px)',
          color: '#fff',
          boxShadow: '0 4px 16px rgba(27,42,74,0.25)',
        }}>
          <CardContent>
            <Typography variant="caption" fontWeight={800} letterSpacing={2.5}
              sx={{ opacity: 0.45, textTransform: 'uppercase', fontSize: 10 }}>
              En pantalla ahora
            </Typography>

            {called ? (
              <Box sx={{ textAlign: 'center', mt: 1.5 }}>
                {/* Chip servicio */}
                <Chip
                  label={svc?.label}
                  size="small"
                  sx={{ bgcolor: svc?.bg, color: svc?.num, fontWeight: 800, mb: 1.5, fontSize: 11 }}
                />

                {/* Número — mismo estilo que chip del Display */}
                <Box sx={{
                  bgcolor: svc?.bg, borderRadius: 2,
                  border: `2px solid ${svc?.border}`,
                  py: 1.5, px: 3, mb: 1,
                }}>
                  <Typography
                    fontWeight={900} color={svc?.num} lineHeight={1}
                    sx={{ fontFamily: '"GoodTimeGrotesk", sans-serif', fontSize: 44, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}
                  >
                    {called.ticket_number}
                  </Typography>
                </Box>

                <Typography fontSize={11} sx={{ opacity: 0.45, display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', mb: 2 }}>
                  <TimeIcon fontSize="inherit" /> Llamado: {fmtTime(called.called_at)}
                </Typography>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

                {called.status === 'ATTENDED' || called.status === 'CANCELED' ? (
                  <Box sx={{ py: 1 }}>
                    <Chip
                      label={called.status === 'ATTENDED' ? 'Atendido ✓' : 'Cancelado / Ausente ✗'}
                      color={called.status === 'ATTENDED' ? 'success' : 'error'}
                      sx={{ fontWeight: 800, fontSize: 13, px: 2, py: 1 }}
                    />
                    <Typography fontSize={11} sx={{ opacity: 0.45, mt: 1.5 }}>
                      Este turno ya finalizó.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    <Button fullWidth variant="outlined" size="small"
                      startIcon={acting === called.id ? <CircularProgress size={13} color="inherit" /> : <RecallIcon />}
                      onClick={handleRecall} disabled={!!acting}
                      sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.25)', fontWeight: 700,
                        '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.06)' } }}>
                      Volver a llamar
                    </Button>
                    <Button fullWidth variant="contained" size="small"
                      startIcon={<AttendIcon />}
                      onClick={handleAttend} disabled={!!acting}
                      sx={{ bgcolor: '#16A34A', fontWeight: 700, '&:hover': { bgcolor: '#15803D' } }}>
                      Marcar atendido
                    </Button>
                    <Button fullWidth variant="text" size="small"
                      startIcon={<CancelIcon />}
                      onClick={handleCancel} disabled={!!acting}
                      sx={{ color: '#F87171', fontWeight: 700 }}>
                      Cancelar / Ausente
                    </Button>
                  </Stack>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography fontSize={13} sx={{ opacity: 0.35 }}>
                  Ningún turno en pantalla.{'\n'}Llamá uno de la lista →
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Fila inferior: Stats + Últimos Atendidos */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}>
          {/* Stats */}
          {stats && (
            <Card sx={{ borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', height: '100%' }}>
              <CardContent sx={{ pb: '14px !important', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="caption" fontWeight={800} color="#64748B" letterSpacing={1.5}
                  sx={{ textTransform: 'uppercase', fontSize: 10, mb: 1 }}>
                  Hoy
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8, flexGrow: 1 }}>
                  {[
                    { label: 'En espera', value: stats.waiting,  color: '#2563EB' },
                    { label: 'Llamados',  value: stats.called,   color: '#D97706' },
                    { label: 'Atendidos', value: stats.attended, color: '#16A34A' },
                    { label: 'Cancelados',value: stats.canceled, color: '#DC2626' },
                  ].map(s => (
                    <Box key={s.label} sx={{ textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 1.5, py: 0.8, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography fontSize={18} fontWeight={900} color={s.color} lineHeight={1}>{s.value}</Typography>
                      <Typography fontSize={9} color="#94A3B8" mt={0.2}>{s.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Últimos atendidos */}
          {attendedHistory.length > 0 && (
            <Card sx={{ borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', height: '100%' }}>
              <CardContent sx={{ pb: '12px !important', height: '100%' }}>
                <Typography variant="caption" fontWeight={800} color="#64748B" letterSpacing={1.5}
                  sx={{ textTransform: 'uppercase', fontSize: 10 }}>
                  Últimos Atendidos
                </Typography>
                <Stack spacing={0.8} mt={1}>
                  {attendedHistory.map(t => {
                    const c = SVC[t.service_type] ?? SVC['ANALYSIS'];
                    return (
                      <Box key={t.id} sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        bgcolor: '#F8FAFC', borderRadius: 1.5,
                        border: '1px solid #E2E8F0', px: 1, py: 0.5,
                      }}>
                        <Box sx={{
                          bgcolor: c.bg, borderRadius: 1, px: 0.8, py: 0.15,
                          border: `1px solid ${c.border}`, minWidth: 46, textAlign: 'center',
                        }}>
                          <Typography fontWeight={900} fontSize={11} color={c.num}
                            sx={{ fontFamily: '"GoodTimeGrotesk", sans-serif', fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>
                            {t.ticket_number}
                          </Typography>
                        </Box>
                        <Typography fontSize={10} color="#64748B" sx={{ flexGrow: 1 }}>
                          {t.attended_at ? fmtTime(t.attended_at) : '—'}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>
      </Stack>

      {/* ── PANEL DERECHO: Cola de espera + Llamados ── */}
      {/* Cola de espera */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography fontWeight={800} fontSize={16} color="#0F172A">Cola de espera</Typography>
                <Box sx={{
                  bgcolor: '#1B2A4A', color: '#fff',
                  borderRadius: 99, px: 1.2, py: 0.15,
                  fontSize: 12, fontWeight: 800, minWidth: 24, textAlign: 'center',
                }}>
                  {waiting.length}
                </Box>
              </Box>
              <Tooltip title="Actualizar">
                <IconButton size="small" onClick={() => { setLoading(true); refresh().finally(() => setLoading(false)); }}>
                  {loading ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>

            {waiting.length === 0 ? (
              <Box sx={{
                bgcolor: '#F8FAFC', border: '1px dashed #CBD5E1',
                borderRadius: 3, py: 4, textAlign: 'center',
              }}>
                <Typography fontSize={13} color="#94A3B8">No hay turnos en espera.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.2} sx={{
                maxHeight: 'calc(100vh - 220px)',
                overflowY: 'auto',
                pr: 0.5,
                scrollbarWidth: 'thin',
                scrollbarColor: '#CBD5E1 #F1F5F9',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#F1F5F9',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#CBD5E1',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#94A3B8',
                },
              }}>
                {waiting.map((t, i) => {
                  const c = SVC[t.service_type] ?? SVC['ANALYSIS'];
                  return (
                    <Box key={t.id} sx={{
                      display: 'flex', alignItems: 'center', gap: 2,
                      bgcolor: i === 0 ? '#EFF6FF' : '#F8FAFC',
                      border: i === 0 ? '1.5px solid #BFDBFE' : '1px solid #E2E8F0',
                      borderRadius: 2.5, p: 1.5,
                      transition: 'all 0.15s',
                    }}>
                      <Typography fontSize={12} fontWeight={700} color="#CBD5E1" sx={{ minWidth: 18, textAlign: 'center' }}>
                        {i + 1}
                      </Typography>

                      <Box sx={{
                        bgcolor: c.bg, borderRadius: 1.5,
                        border: `1.5px solid ${c.border}`,
                        px: 1.5, py: 0.5, minWidth: 68, textAlign: 'center',
                      }}>
                        <Typography fontWeight={900} fontSize={18} color={c.num}
                          sx={{ fontFamily: '"GoodTimeGrotesk", sans-serif', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                          {t.ticket_number}
                        </Typography>
                      </Box>

                      <Box sx={{ flexGrow: 1 }}>
                        <Typography fontSize={13} fontWeight={700} color="#0F172A">{c.label}</Typography>
                        <Typography fontSize={11} color="#94A3B8" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon fontSize="inherit" /> {fmtTime(t.created_at)}
                        </Typography>
                      </Box>

                      <Button
                        variant="contained" size="small"
                        startIcon={acting === t.id ? <CircularProgress size={12} color="inherit" /> : <CallIcon />}
                        onClick={() => handleCall(t)}
                        disabled={!!acting}
                        sx={{
                          bgcolor: '#1B2A4A', fontWeight: 800, fontSize: 12,
                          borderRadius: 2, whiteSpace: 'nowrap',
                          '&:hover': { bgcolor: '#253A5E' },
                        }}
                      >
                        Llamar
                      </Button>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Llamados */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography fontWeight={800} fontSize={16} color="#0F172A">Llamados</Typography>
                <Box sx={{
                  bgcolor: '#D97706', color: '#fff',
                  borderRadius: 99, px: 1.2, py: 0.15,
                  fontSize: 12, fontWeight: 800, minWidth: 24, textAlign: 'center',
                }}>
                  {calledList.length}
                </Box>
              </Box>
            </Box>

            {calledList.length === 0 ? (
              <Box sx={{
                bgcolor: '#F8FAFC', border: '1px dashed #CBD5E1',
                borderRadius: 3, py: 4, textAlign: 'center',
              }}>
                <Typography fontSize={13} color="#94A3B8">No hay turnos llamados.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.2} sx={{
                maxHeight: 'calc(100vh - 220px)',
                overflowY: 'auto',
                pr: 0.5,
                scrollbarWidth: 'thin',
                scrollbarColor: '#CBD5E1 #F1F5F9',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#F1F5F9',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#CBD5E1',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#94A3B8',
                },
              }}>
                {calledList.map(t => {
                  const c = SVC[t.service_type] ?? SVC['ANALYSIS'];
                  return (
                    <Box key={t.id} sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      bgcolor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 2.5, p: 1.5,
                    }}>
                      <Box sx={{
                        bgcolor: c.bg, borderRadius: 1.5,
                        border: `1.5px solid ${c.border}`,
                        px: 1.5, py: 0.5, minWidth: 68, textAlign: 'center',
                      }}>
                        <Typography fontWeight={900} fontSize={18} color={c.num}
                          sx={{ fontFamily: '"GoodTimeGrotesk", sans-serif', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                          {t.ticket_number}
                        </Typography>
                      </Box>

                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography fontSize={13} fontWeight={700} color="#0F172A" noWrap>{c.label}</Typography>
                        <Typography fontSize={11} color="#94A3B8" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon fontSize="inherit" /> {t.called_at ? fmtTime(t.called_at) : '—'}
                        </Typography>
                      </Box>

                      <IconButton
                        size="small"
                        disabled={acting === t.id}
                        onClick={() => handleAttendFromQueue(t)}
                        sx={{ color: '#16A34A', '&:hover': { bgcolor: '#F0FDF4' } }}
                      >
                        {acting === t.id ? <CircularProgress size={16} /> : <AttendIcon fontSize="small" />}
                      </IconButton>

                      <IconButton
                        size="small"
                        disabled={acting === t.id}
                        onClick={() => handleRecallFromQueue(t)}
                        sx={{ color: '#1B2A4A', '&:hover': { bgcolor: '#EFF6FF' } }}
                      >
                        {acting === t.id ? <CircularProgress size={16} /> : <RecallIcon fontSize="small" />}
                      </IconButton>

                      <IconButton
                        size="small"
                        disabled={acting === t.id}
                        onClick={() => handleCancelFromQueue(t)}
                        sx={{ color: '#F87171', '&:hover': { bgcolor: '#FEF2F2' } }}
                      >
                        {acting === t.id ? <CircularProgress size={16} /> : <CancelIcon fontSize="small" />}
                      </IconButton>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    );
}

/* ═══════════════════════════════ TAB: SLIDERS ══════════════════ */
function SlidersTab({ trigger: _trigger }: { trigger: number }) {
  const [sliders,    setSliders]    = useState<Slider[]>([]);
  const [uploading,  setUploading]  = useState(false);
  const [deleting,   setDeleting]   = useState<number | null>(null);
  const [confirmDel, setConfirmDel] = useState<Slider | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => { load(); }, []);

  async function load() {
    try { setSliders(await getActiveSliders()); }
    catch { enqueueSnackbar('Error cargando sliders', { variant: 'error' }); }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      enqueueSnackbar('Solo se permiten imágenes o videos', { variant: 'warning' });
      return;
    }

    const fd = new FormData();
    fd.append(isVideo ? 'video' : 'image', file);
    fd.append('title', file.name.replace(/\.[^.]+$/, ''));
    fd.append('media_type', isVideo ? 'VIDEO' : 'IMAGE');
    fd.append('is_active', 'true');
    fd.append('order', String(sliders.length + 1));
    if (!isVideo) fd.append('duration', '8');
    else fd.append('has_sound', 'true');

    setUploading(true);
    try {
      await uploadSlider(fd);
      enqueueSnackbar('Slider subido correctamente ✓', { variant: 'success' });
      await load();
    } catch (err: unknown) {
      enqueueSnackbar((err as Error).message || 'Error al subir', { variant: 'error' });
    } finally { setUploading(false); }
  }

  async function handleDelete(s: Slider) {
    setDeleting(s.id);
    try {
      await deleteSlider(s.id);
      enqueueSnackbar('Slider eliminado', { variant: 'success' });
      await load();
    } catch (err: unknown) {
      enqueueSnackbar((err as Error).message || 'Error al eliminar', { variant: 'error' });
    } finally { setDeleting(null); setConfirmDel(null); }
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '360px 1fr' }, gap: 3 }}>

      {/* ── UPLOAD ── */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', height: 'fit-content' }}>
        <CardContent>
          <Typography fontWeight={800} fontSize={15} color="#0F172A" mb={2}>Subir nuevo slide</Typography>

          <Box
            onClick={() => !uploading && fileRef.current?.click()}
            sx={{
              border: `2px dashed ${uploading ? '#1B2A4A' : '#CBD5E1'}`,
              borderRadius: 3, p: 4, textAlign: 'center',
              cursor: uploading ? 'default' : 'pointer',
              bgcolor: uploading ? '#EFF6FF' : '#F8FAFC',
              transition: 'all 0.2s',
              '&:hover': !uploading ? { borderColor: '#1B2A4A', bgcolor: '#EFF6FF' } : {},
            }}
          >
            {uploading
              ? <CircularProgress sx={{ color: '#1B2A4A', mb: 1 }} />
              : <UploadIcon sx={{ fontSize: 40, color: '#94A3B8', mb: 1 }} />
            }
            <Typography fontWeight={700} color="#64748B" fontSize={14}>
              {uploading ? 'Subiendo...' : 'Clic para seleccionar imagen o video'}
            </Typography>
            <Typography variant="caption" color="#94A3B8">
              Formatos: JPG, PNG, GIF, MP4, WebM
            </Typography>
          </Box>

          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleUpload} />

          {uploading && <LinearProgress sx={{ mt: 2, borderRadius: 1, '& .MuiLinearProgress-bar': { bgcolor: '#1B2A4A' } }} />}
        </CardContent>
      </Card>

      {/* ── LISTA ── */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography fontWeight={800} fontSize={15} color="#0F172A">Slides activos</Typography>
              <Box sx={{
                bgcolor: '#1B2A4A', color: '#fff',
                borderRadius: 99, px: 1.2, py: 0.15,
                fontSize: 12, fontWeight: 800, minWidth: 24, textAlign: 'center',
              }}>
                {sliders.length}
              </Box>
            </Box>
            <Tooltip title="Actualizar lista">
              <IconButton size="small" onClick={load}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {sliders.length === 0 ? (
            <Box sx={{
              bgcolor: '#F8FAFC', border: '1px dashed #CBD5E1',
              borderRadius: 3, py: 6, textAlign: 'center',
            }}>
              <SliderIcon sx={{ fontSize: 36, color: '#CBD5E1', mb: 1 }} />
              <Typography fontSize={13} color="#94A3B8">
                No hay slides configurados.
                <br />Subí uno para que aparezca en el display.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {sliders.map(s => (
                <Box key={s.id} sx={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  bgcolor: '#F8FAFC', border: '1px solid #E2E8F0',
                  borderRadius: 2.5, p: 1.5,
                }}>
                  {/* Ícono / thumbnail */}
                  {s.media_type === 'IMAGE' && s.image_url ? (
                    <Box component="img" src={s.image_url} alt={s.title}
                      sx={{ width: 80, height: 52, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }} />
                  ) : (
                    <Box sx={{
                      width: 80, height: 52, borderRadius: 1.5, flexShrink: 0,
                      bgcolor: '#1B2A4A',
                      backgroundImage: 'repeating-linear-gradient(-45deg,transparent,transparent 6px,rgba(255,255,255,0.03) 6px,rgba(255,255,255,0.03) 7px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <VideoIcon sx={{ color: '#fff', fontSize: 28 }} />
                    </Box>
                  )}

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} fontSize={14} color="#0F172A" noWrap>{s.title}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.8, mt: 0.5 }}>
                      <Chip
                        icon={s.media_type === 'VIDEO' ? <VideoIcon /> : <ImageIcon />}
                        label={s.media_type === 'VIDEO' ? 'Video' : 'Imagen'}
                        size="small"
                        sx={{ fontSize: 10, height: 20, bgcolor: s.media_type === 'VIDEO' ? '#EDE9FE' : '#EFF6FF',
                          color: s.media_type === 'VIDEO' ? '#4C1D95' : '#1E40AF',
                          '& .MuiChip-icon': { fontSize: 12 } }}
                      />
                      {s.media_type === 'IMAGE' && (
                        <Chip label={`${s.duration}s`} size="small"
                          sx={{ fontSize: 10, height: 20, bgcolor: '#F1F5F9', color: '#64748B' }} />
                      )}
                    </Box>
                  </Box>

                  {s.media_type === 'VIDEO' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2, mr: 1 }}>
                      <Checkbox
                        size="small"
                        checked={s.has_sound}
                        onChange={async () => {
                          const nextChecked = !s.has_sound;
                          try {
                            await updateSlider(s.id, { has_sound: nextChecked });
                            enqueueSnackbar(nextChecked ? 'Sonido activado ✓' : 'Sonido desactivado 🔇', { variant: 'info' });
                            await load();
                          } catch (err: unknown) {
                            enqueueSnackbar((err as Error).message || 'Error al actualizar', { variant: 'error' });
                          }
                        }}
                        sx={{ p: 0.5 }}
                      />
                      <Typography fontSize={11} color="#64748B" fontWeight={700}>Sonido</Typography>
                    </Box>
                  )}

                  <Tooltip title="Eliminar slide">
                    <IconButton
                      size="small" color="error"
                      onClick={() => setConfirmDel(s)}
                      disabled={deleting === s.id}
                    >
                      {deleting === s.id ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Confirm delete */}
      <Dialog open={!!confirmDel} onClose={() => setConfirmDel(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800} fontSize={18}>¿Eliminar slide?</DialogTitle>
        <DialogContent>
          <Typography color="#64748B">
            Se eliminará <strong>{confirmDel?.title}</strong> del display. Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setConfirmDel(null)} sx={{ color: '#64748B', fontWeight: 700 }}>Cancelar</Button>
          <Button color="error" variant="contained"
            onClick={() => confirmDel && handleDelete(confirmDel)}
            disabled={!!deleting}
            sx={{ fontWeight: 700, borderRadius: 2 }}>
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* ════════════════════════════════ TAB: VOCES ═════════════════════ */
function VoicesTab() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Voice | null>(null);
  const [testingVoice, setTestingVoice] = useState<Voice | null>(null);
  const [testText, setTestText] = useState('Turno A-01, pase a recepción');
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  // Formulario de subida
  const [name, setName] = useState('');
  const [onnxFile, setOnnxFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);

  useEffect(() => {
    fetchVoices();
  }, []);

  async function fetchVoices() {
    setLoading(true);
    try {
      const data = await getVoices();
      setVoices(data);
    } catch (err) {
      enqueueSnackbar((err as Error).message || 'Error al obtener voces', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !onnxFile || !jsonFile) {
      enqueueSnackbar('Por favor, completa todos los campos y selecciona ambos archivos.', { variant: 'warning' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('onnx_file', onnxFile);
    formData.append('json_file', jsonFile);

    try {
      await uploadVoice(formData);
      enqueueSnackbar('Voz cargada correctamente', { variant: 'success' });
      setName('');
      setOnnxFile(null);
      setJsonFile(null);
      
      // Reset de inputs de archivo
      const onnxInput = document.getElementById('onnx-file-input') as HTMLInputElement;
      const jsonInput = document.getElementById('json-file-input') as HTMLInputElement;
      if (onnxInput) onnxInput.value = '';
      if (jsonInput) jsonInput.value = '';

      fetchVoices();
    } catch (err) {
      enqueueSnackbar((err as Error).message || 'Error al subir la voz', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function handleActivate(id: number) {
    try {
      await activateVoice(id);
      enqueueSnackbar('Voz activada para el turnero', { variant: 'success' });
      fetchVoices();
    } catch (err) {
      enqueueSnackbar((err as Error).message || 'Error al activar la voz', { variant: 'error' });
    }
  }

  async function handleDelete(voice: Voice) {
    try {
      await deleteVoice(voice.id);
      enqueueSnackbar('Voz eliminada correctamente', { variant: 'success' });
      setConfirmDel(null);
      fetchVoices();
    } catch (err) {
      enqueueSnackbar((err as Error).message || 'Error al eliminar la voz', { variant: 'error' });
    }
  }

  function handleTestAudio(voice: Voice) {
    setTestingVoice(voice);
    setTestText('Turno A-01, pase a recepción');
  }

  function playTestAudio() {
    if (!testingVoice || !testText.trim()) return;
    setPlaying(true);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Usar la URL del backend del testeo de audio
    const url = getVoiceTestAudioUrl(testingVoice.id, testText);
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onended = () => setPlaying(false);
    audio.onerror = () => {
      setPlaying(false);
      enqueueSnackbar('Error al reproducir el audio de prueba. Verifica la consola del servidor.', { variant: 'error' });
    };

    audio.play().catch(err => {
      setPlaying(false);
      console.error(err);
      enqueueSnackbar('El navegador bloqueó la reproducción automática del audio.', { variant: 'warning' });
    });
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', display: 'flex', gap: 3.5, flexDirection: { xs: 'column', md: 'row' } }}>
      
      {/* Columna Izquierda: Formulario de Carga */}
      <Box sx={{ flex: 1.2 }}>
        <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={800} color="#1E293B" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <UploadIcon sx={{ color: '#1B2A4A' }} /> Cargar Nueva Voz
            </Typography>
            <Typography color="#64748B" fontSize={13} mb={3.5}>
              Sube los archivos del modelo entrenado de Piper en formato <strong>.onnx</strong> y su correspondiente archivo de configuración <strong>.onnx.json</strong>.
            </Typography>

            <form onSubmit={handleUpload}>
              <Stack gap={2.5}>
                <Box>
                  <Typography fontSize={13} fontWeight={700} color="#475569" mb={0.8}>
                    Nombre descriptivo de la voz:
                  </Typography>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Español Latino Masculino - Juan"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                </Box>

                <Box>
                  <Typography fontSize={13} fontWeight={700} color="#475569" mb={0.8}>
                    Modelo de voz (.onnx):
                  </Typography>
                  <input
                    id="onnx-file-input"
                    type="file"
                    required
                    accept=".onnx"
                    onChange={e => setOnnxFile(e.target.files?.[0] || null)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1.5px dashed #CBD5E1',
                      fontSize: '13px',
                    }}
                  />
                </Box>

                <Box>
                  <Typography fontSize={13} fontWeight={700} color="#475569" mb={0.8}>
                    Configuración de voz (.onnx.json):
                  </Typography>
                  <input
                    id="json-file-input"
                    type="file"
                    required
                    accept=".json"
                    onChange={e => setJsonFile(e.target.files?.[0] || null)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1.5px dashed #CBD5E1',
                      fontSize: '13px',
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={uploading}
                  sx={{
                    bgcolor: '#1B2A4A',
                    color: '#fff',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2.5,
                    py: 1.5,
                    boxShadow: '0 4px 12px rgba(27, 42, 74, 0.2)',
                    '&:hover': { bgcolor: '#111D35' },
                  }}
                >
                  {uploading ? <CircularProgress size={22} color="inherit" /> : 'Cargar Voz'}
                </Button>
              </Stack>
            </form>

            <Divider sx={{ my: 3.5 }} />

            <Typography fontSize={12} color="#64748B" sx={{ lineHeight: 1.5 }}>
              💡 <strong>¿Dónde descargar más voces de Piper?</strong> Puedes encontrar modelos masculinos y femeninos listos para descargar en la comunidad oficial de Piper en Hugging Face o en su catálogo oficial: 
              <br />
              <a href="https://rhasspy.github.io/piper-samples/" target="_blank" rel="noreferrer" style={{ color: '#1B2A4A', fontWeight: 700 }}>
                rhasspy.github.io/piper-samples
              </a>
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Columna Derecha: Tabla/Listado de Voces */}
      <Box sx={{ flex: 1.8 }}>
        <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', height: '100%' }}>
          <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={800} color="#1E293B" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VoiceIcon sx={{ color: '#1B2A4A' }} /> Voces Disponibles
            </Typography>
            <Typography color="#64748B" fontSize={13} mb={3.5}>
              Listado de voces. Activa la voz que quieres usar para los llamados de turnos en la sala de espera. Si no hay voces activas, se usará la voz Davefx (España) de forma predeterminada.
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : voices.length === 0 ? (
              <Box sx={{ border: '1.5px dashed #E2E8F0', borderRadius: 4, py: 8, textAlign: 'center' }}>
                <Typography color="#94A3B8" fontWeight={600} fontSize={14}>
                  No hay voces personalizadas cargadas aún
                </Typography>
                <Typography color="#94A3B8" fontSize={12} mt={0.5}>
                  Sube archivos en el panel de la izquierda para comenzar.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto', flexGrow: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                      <th style={{ padding: '12px 8px', color: '#64748B', fontSize: 13, fontWeight: 700 }}>Nombre</th>
                      <th style={{ padding: '12px 8px', color: '#64748B', fontSize: 13, fontWeight: 700 }}>Estado</th>
                      <th style={{ padding: '12px 8px', color: '#64748B', fontSize: 13, fontWeight: 700, textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voices.map(voice => (
                      <tr key={voice.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '16px 8px' }}>
                          <Typography fontWeight={700} fontSize={14} color="#1E293B">
                            {voice.name}
                          </Typography>
                          <Typography fontSize={11} color="#94A3B8">
                            Subida: {new Date(voice.created_at).toLocaleDateString()}
                          </Typography>
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          {voice.is_active ? (
                            <Chip label="Activa" size="small" sx={{ bgcolor: '#DEF7EC', color: '#03543F', fontWeight: 700 }} />
                          ) : (
                            <Chip label="Inactiva" size="small" variant="outlined" sx={{ color: '#64748B', fontWeight: 600 }} />
                          )}
                        </td>
                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Probar audio de voz">
                              <IconButton onClick={() => handleTestAudio(voice)} size="small" sx={{ color: '#1B2A4A', '&:hover': { bgcolor: 'rgba(27,42,74,0.06)' } }}>
                                <PlayIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {!voice.is_active && (
                              <Tooltip title="Activar para el turnero">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleActivate(voice.id)}
                                  sx={{
                                    borderColor: '#1B2A4A',
                                    color: '#1B2A4A',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    px: 1.5,
                                    '&:hover': { borderColor: '#111D35', bgcolor: 'rgba(27,42,74,0.04)' }
                                  }}
                                >
                                  Activar
                                </Button>
                              </Tooltip>
                            )}
                            <Tooltip title="Eliminar voz">
                              <IconButton onClick={() => setConfirmDel(voice)} size="small" color="error" sx={{ '&:hover': { bgcolor: 'rgba(211,47,47,0.06)' } }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Modal de Confirmación de Borrado */}
      <Dialog open={!!confirmDel} onClose={() => setConfirmDel(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800} fontSize={18}>¿Eliminar modelo de voz?</DialogTitle>
        <DialogContent>
          <Typography color="#64748B">
            Se eliminará el modelo <strong>{confirmDel?.name}</strong> de la base de datos y sus archivos asociados del disco. Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setConfirmDel(null)} sx={{ color: '#64748B', fontWeight: 700 }}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={() => confirmDel && handleDelete(confirmDel)} sx={{ fontWeight: 700, borderRadius: 2 }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Prueba de Voz */}
      <Dialog open={!!testingVoice} onClose={() => { setTestingVoice(null); setPlaying(false); }} PaperProps={{ sx: { borderRadius: 3, width: '100%', maxWidth: 500 } }}>
        <DialogTitle fontWeight={800} fontSize={18} sx={{ pb: 1 }}>Probar Voz de Turnos</DialogTitle>
        <DialogContent>
          <Typography color="#64748B" fontSize={13} mb={2.5}>
            Escribe un texto de ejemplo (como se escuchará en la sala de espera) para probar la entonación y naturalidad de <strong>{testingVoice?.name}</strong>:
          </Typography>
          <input
            type="text"
            value={testText}
            onChange={e => setTestText(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1.5px solid #CBD5E1',
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
              marginBottom: '10px',
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, justifyContent: 'space-between' }}>
          <Button onClick={() => { setTestingVoice(null); setPlaying(false); }} sx={{ color: '#64748B', fontWeight: 700 }}>Cerrar</Button>
          <Button
            variant="contained"
            onClick={playTestAudio}
            disabled={playing || !testText.trim()}
            sx={{
              bgcolor: '#1B2A4A',
              fontWeight: 700,
              borderRadius: 2,
              px: 2.5,
              '&:hover': { bgcolor: '#111D35' }
            }}
          >
            {playing ? <CircularProgress size={18} color="inherit" /> : 'Generar y Escuchar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
