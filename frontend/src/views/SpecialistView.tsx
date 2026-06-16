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
  LinearProgress,
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
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  getWaitingTickets, getCalledTickets, callTicket, recallTicket,
  attendTicket, cancelTicket, getTicketStats,
  getActiveSliders, uploadSlider, deleteSlider,
} from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { Ticket, Slider, TicketStats } from '@/types';

const WS_URL = '/ws/checkins/';

/* ── Paleta por servicio (idéntica a Display y Kiosk) ── */
const SVC: Record<string, { label: string; bg: string; num: string; border: string }> = {
  ANALYSIS: { label: 'Análisis',    bg: '#EDE9FE', num: '#4C1D95', border: '#7C3AED' },
  RESULTS:  { label: 'Resultados',  bg: '#DCFCE7', num: '#14532D', border: '#16A34A' },
  BUDGET:   { label: 'Presupuesto', bg: '#FEF3C7', num: '#78350F', border: '#D97706' },
};

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
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

      {/* ── HEADER (idéntico al Display) ── */}
      <Box component="header" sx={{
        bgcolor: '#1B2A4A',
        backgroundImage: 'repeating-linear-gradient(-45deg,transparent,transparent 14px,rgba(255,255,255,0.015) 14px,rgba(255,255,255,0.015) 15px)',
        height: 72,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        px: 4, flexShrink: 0,
      }}>
        <Box sx={{ bgcolor: '#fff', borderRadius: 2, px: 1.5, py: 0.75, display: 'flex', alignItems: 'center' }}>
          <img src="/logo_biogenic.png" alt="Biogenic" style={{ height: 46, objectFit: 'contain', display: 'block' }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Estado WebSocket */}
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

      {/* ── TABS ── */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E2E8F0', px: 4 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: 14, color: '#64748B' },
            '& .Mui-selected': { color: '#1B2A4A !important' },
            '& .MuiTabs-indicator': { bgcolor: '#1B2A4A', height: 3 },
          }}
        >
          <Tab icon={<QueueIcon fontSize="small" />} iconPosition="start" label="Turnos" />
          <Tab icon={<SliderIcon fontSize="small" />} iconPosition="start" label="Sliders del Display" />
        </Tabs>
      </Box>

      {/* ── CONTENIDO ── */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2.5 }}>
        {tab === 0 && <TurnosTab trigger={trigger} />}
        {tab === 1 && <SlidersTab trigger={trigger} />}
      </Box>
    </Box>
  );
}

/* ════════════════════════════════ TAB: TURNOS ═══════════════════ */
function TurnosTab({ trigger }: { trigger: number }) {
  const [waiting,  setWaiting]  = useState<Ticket[]>([]);
  const [called,   setCalled]   = useState<Ticket | null>(null);
  const [history,  setHistory]  = useState<Ticket[]>([]);
  const [calledList, setCalledList] = useState<Ticket[]>([]);
  const [stats,    setStats]    = useState<TicketStats | null>(null);
  const [acting,   setActing]   = useState<number | null>(null);
  const [loading,  setLoading]  = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => { refresh(); }, [trigger]);
  useEffect(() => { refresh(); }, []);

  async function refresh() {
    try {
      const [w, s, h] = await Promise.all([getWaitingTickets(), getTicketStats(), getCalledTickets()]);
      setWaiting(w);
      setStats(s);
      // Todos los llamados para la cola "Llamados"
      const sorted = h
        .slice()
        .sort((a, b) => new Date(b.called_at ?? 0).getTime() - new Date(a.called_at ?? 0).getTime());
      setCalledList(sorted);
      // Últimos 6 para el historial del panel izquierdo
      setHistory(sorted.slice(0, 6));
      // Restaurar el turno en pantalla al recargar la página
      setCalled(prev => prev ?? sorted[0] ?? null);
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
      await recallTicket(called.id);
      enqueueSnackbar(`Turno ${called.ticket_number} re-llamado`, { variant: 'info' });
    } catch (e: unknown) {
      enqueueSnackbar((e as Error).message, { variant: 'error' });
    } finally { setActing(null); }
  }

  async function handleRecallFromQueue(t: Ticket) {
    setActing(t.id);
    try {
      await recallTicket(t.id);
      enqueueSnackbar(`Turno ${t.ticket_number} re-llamado`, { variant: 'info' });
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
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '300px 1fr' }, gap: 2.5, alignItems: 'start' }}>

      {/* ── PANEL IZQUIERDO ── */}
      <Stack spacing={2.5}>

        {/* Stats */}
        {stats && (
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ pb: '14px !important' }}>
              <Typography variant="caption" fontWeight={800} color="#64748B" letterSpacing={1.5}
                sx={{ textTransform: 'uppercase', fontSize: 10 }}>
                Hoy
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8, mt: 1 }}>
                {[
                  { label: 'En espera', value: stats.waiting,  color: '#2563EB' },
                  { label: 'Llamados',  value: stats.called,   color: '#D97706' },
                  { label: 'Atendidos', value: stats.attended, color: '#16A34A' },
                  { label: 'Cancelados',value: stats.canceled, color: '#DC2626' },
                ].map(s => (
                  <Box key={s.label} sx={{ textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 1.5, py: 0.8 }}>
                    <Typography fontSize={20} fontWeight={900} color={s.color} lineHeight={1}>{s.value}</Typography>
                    <Typography fontSize={10} color="#94A3B8" mt={0.2}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

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
                    sx={{ fontSize: 52, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}
                  >
                    {called.ticket_number}
                  </Typography>
                </Box>

                <Typography fontSize={11} sx={{ opacity: 0.45, display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', mb: 2 }}>
                  <TimeIcon fontSize="inherit" /> Llamado: {fmtTime(called.called_at)}
                </Typography>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

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

        {/* Últimos llamados */}
        {history.length > 0 && (
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ pb: '12px !important' }}>
              <Typography variant="caption" fontWeight={800} color="#64748B" letterSpacing={1.5}
                sx={{ textTransform: 'uppercase', fontSize: 10 }}>
                Últimos llamados
              </Typography>
              <Stack spacing={0.8} mt={1}>
                {history.map(t => {
                  const c = SVC[t.service_type] ?? SVC['ANALYSIS'];
                  return (
                    <Box key={t.id} sx={{
                      display: 'flex', alignItems: 'center', gap: 1.2,
                      bgcolor: '#F8FAFC', borderRadius: 1.5,
                      border: '1px solid #E2E8F0', px: 1.2, py: 0.6,
                    }}>
                      <Box sx={{
                        bgcolor: c.bg, borderRadius: 1, px: 1, py: 0.2,
                        border: `1px solid ${c.border}`, minWidth: 52, textAlign: 'center',
                      }}>
                        <Typography fontWeight={900} fontSize={14} color={c.num}
                          sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>
                          {t.ticket_number}
                        </Typography>
                      </Box>
                      <Typography fontSize={11} color="#64748B" sx={{ flexGrow: 1 }}>
                        {fmtTime(t.called_at)}
                      </Typography>
                      <Tooltip title="Volver a llamar este turno">
                        <IconButton
                          size="small"
                          disabled={acting === t.id}
                          onClick={async () => {
                            setActing(t.id);
                            try {
                              await recallTicket(t.id);
                              setCalled(t);
                              enqueueSnackbar(`Turno ${t.ticket_number} re-llamado`, { variant: 'info' });
                            } catch (e: unknown) {
                              enqueueSnackbar((e as Error).message, { variant: 'error' });
                            } finally { setActing(null); }
                          }}
                          sx={{ color: '#1B2A4A', '&:hover': { bgcolor: '#EFF6FF' } }}
                        >
                          {acting === t.id
                            ? <CircularProgress size={14} />
                            : <RecallIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>

      {/* ── PANEL DERECHO: Cola de espera + Llamados ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
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
              <Stack spacing={1.2} sx={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', pr: 0.5 }}>
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
                        <Typography fontWeight={900} fontSize={20} color={c.num}
                          sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
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
              <Stack spacing={1.2} sx={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', pr: 0.5 }}>
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
                        <Typography fontWeight={900} fontSize={20} color={c.num}
                          sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
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
    fd.append(isVideo ? 'video_file' : 'image_file', file);
    fd.append('title', file.name.replace(/\.[^.]+$/, ''));
    fd.append('media_type', isVideo ? 'VIDEO' : 'IMAGE');
    fd.append('is_active', 'true');
    fd.append('order', String(sliders.length + 1));
    if (!isVideo) fd.append('duration', '8');

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
