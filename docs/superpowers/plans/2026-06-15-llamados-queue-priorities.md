# Cola de Llamados + Reordenamiento de Prioridades — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Llamados" queue column next to "Cola de espera" in the reception panel, and reorder waiting queue priorities to RESULTS → BUDGET → ANALYSIS.

**Architecture:** Backend change (1 line in views.py) + frontend change (SpecialistView.tsx — add state, handlers, and new column). The existing `getCalledTickets()` API already returns all CALLED tickets; we just need to store them all and display them.

**Tech Stack:** Django 6.0 / DRF (backend), React 19 + MUI 6 + Emotion (frontend)

---

### Task 1: Backend — reorder waiting priority

**Files:**
- Modify: `backend/api/views.py:427-434`

- [ ] **Step 1: Change priority ordering in `get_queryset`**

In `backend/api/views.py`, find the `Case` expression inside the `status_filter == 'WAITING'` block (~line 429-434). Swap ANALYSIS and BUDGET priorities:

Old:
```python
When(service_type='RESULTS', then=Value(1)),
When(service_type='ANALYSIS', then=Value(2)),
When(service_type='BUDGET', then=Value(3)),
```

New:
```python
When(service_type='RESULTS', then=Value(1)),
When(service_type='BUDGET', then=Value(2)),
When(service_type='ANALYSIS', then=Value(3)),
```

- [ ] **Step 2: Commit**

```bash
git add backend/api/views.py
git commit -m "feat(backend): reorder waiting queue priority to RESULTS > BUDGET > ANALYSIS"
```

---

### Task 2: Frontend — add calledList state and handlers

**Files:**
- Modify: `frontend/src/views/SpecialistView.tsx:134-211`

**Change:** Add `calledList` state to store all called tickets, modify `refresh()` to populate it, and add handlers for recall/cancel from the called queue.

- [ ] **Step 1: Add calledList state**

In the `TurnosTab` function (line ~136), add a new state after `history`:

```typescript
const [calledList, setCalledList] = useState<Ticket[]>([]);
```

- [ ] **Step 2: Modify `refresh()` to populate calledList**

In `refresh()` (line ~147-161), change the called tickets logic. Instead of slicing to 6, store ALL called tickets in `calledList`, and also keep 6 in `history` for the left panel:

Old:
```typescript
async function refresh() {
  try {
    const [w, s, h] = await Promise.all([getWaitingTickets(), getTicketStats(), getCalledTickets()]);
    setWaiting(w);
    setStats(s);
    // Últimos 6 llamados, más reciente primero
    const sorted = h
      .slice()
      .sort((a, b) => new Date(b.called_at ?? 0).getTime() - new Date(a.called_at ?? 0).getTime())
      .slice(0, 6);
    setHistory(sorted);
    // Restaurar el turno en pantalla al recargar la página
    setCalled(prev => prev ?? sorted[0] ?? null);
  } catch { /* silent */ }
}
```

New:
```typescript
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
```

- [ ] **Step 3: Add handler to recall from queue**

Add this handler after `handleRecall` (after ~line 184):

```typescript
async function handleRecallFromQueue(t: Ticket) {
  setActing(t.id);
  try {
    await recallTicket(t.id);
    enqueueSnackbar(`Turno ${t.ticket_number} re-llamado`, { variant: 'info' });
  } catch (e: unknown) {
    enqueueSnackbar((e as Error).message, { variant: 'error' });
  } finally { setActing(null); }
}
```

- [ ] **Step 4: Add handler to cancel from queue**

Add this handler after the recall queue handler:

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/SpecialistView.tsx
git commit -m "feat(frontend): add calledList state and recall/cancel handlers for queue"
```

---

### Task 3: Frontend — add Llamados column in right panel

**Files:**
- Modify: `frontend/src/views/SpecialistView.tsx:378-463`

**Change:** Change the right panel from a single "Cola de espera" card to a two-column grid with "Cola de espera" and "Llamados".

- [ ] **Step 1: Replace the right panel content**

Find the right panel section starting at `{/* ── PANEL DERECHO: Cola ── */}` (line ~378). Replace the entire card with a two-column grid containing both queues.

Old (from line 378 to the closing `</Box>` at line ~462):
```jsx
{/* ── PANEL DERECHO: Cola ── */}
<Card sx={{ borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
  <CardContent>
    ...
  </CardContent>
</Card>
```

New:
```jsx
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/SpecialistView.tsx
git commit -m "feat(frontend): add Llamados queue column with recall/cancel actions"
```
