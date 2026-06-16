# Kiosko Light Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign KioskView.tsx from dark neon to light mode with video background, matching DisplayView and SpecialistView design language.

**Architecture:** Single-file component (`KioskView.tsx`) with inline styles. Changes are entirely in the JSX `style={}` objects and structure — no routing, no API, no new files. The video `turnero.mp4` already exists at `frontend/public/sliders/turnero.mp4`.

**Tech Stack:** React 19, MUI 6, Emotion, TypeScript, Vite 6

---

### Task 1: Video background + layout wrapper

**Files:**
- Modify: `frontend/src/views/KioskView.tsx:124-138`

**Change:** Replace the current dark navy background + diagonal pattern overlay with a full-screen video background + subtle dark overlay, identical to `DisplayView.tsx`.

- [ ] **Step 1: Replace the outer container background**

In the outer `<div style={{...}}>` (line 124-132), remove `background: '#0F1A2E'` and keep it transparent. Keep the rest of the wrapper (flex, full viewport, etc.).

Old:
```jsx
<div style={{
  width: '100vw', height: '100vh',
  display: 'flex', flexDirection: 'column',
  fontFamily: '"Inter", system-ui, sans-serif',
  background: '#0F1A2E',
  userSelect: 'none',
  overflow: 'hidden',
  position: 'relative',
}}>
```

New:
```jsx
<div style={{
  position: 'relative',
  height: '100dvh', width: '100vw',
  display: 'flex', flexDirection: 'column',
  fontFamily: '"Inter", system-ui, sans-serif',
  overflow: 'hidden',
  userSelect: 'none',
}}>
```

- [ ] **Step 2: Add video element + overlay BEFORE the header**

Insert these two elements after the opening `<div>` and before the `<div style={{...}}>` pattern overlay (which we'll remove):

```jsx
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
```

- [ ] **Step 3: Remove the diagonal pattern div**

Remove this entire block (lines 135-138):
```jsx
{/* Patrón de fondo sutil */}
<div style={{
  position: 'absolute', inset: 0, pointerEvents: 'none',
  backgroundImage: ...
}} />
```

- [ ] **Step 4: Verify no visual regressions on other phases**

Run: `npm run dev` (or check in browser). The kiosk should show the video playing behind a transparent area (content not yet styled).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/KioskView.tsx
git commit -m "feat(kiosk): add video background with overlay, remove dark navy"
```

---

### Task 2: Header — solid navy background

**Files:**
- Modify: `frontend/src/views/KioskView.tsx:140-174`

**Change:** Change the kiosk header from semi-transparent (`rgba(255,255,255,0.04)`) to solid navy `#1B2A4A`, matching the SpecialistView header style.

- [ ] **Step 1: Replace header styles**

Old header style (lines 142-148):
```jsx
background: 'rgba(255,255,255,0.04)',
borderBottom: '1px solid rgba(255,255,255,0.08)',
```

New:
```jsx
background: '#1B2A4A',
backgroundImage: 'repeating-linear-gradient(-45deg,transparent,transparent 14px,rgba(255,255,255,0.015) 14px,rgba(255,255,255,0.015) 15px)',
```

Also change the header `zIndex: 1` to `zIndex: 2` (content needs to be above video + overlay).

- [ ] **Step 2: Keep everything else in header the same**

The logo pill (white bg), date text (white, opacity 0.5), and time text (white, fontWeight 800) stay the same — they already work on navy background.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/views/KioskView.tsx
git commit -m "feat(kiosk): change header to solid navy #1B2A4A"
```

---

### Task 3: Content wrapper z-index

**Files:**
- Modify: `frontend/src/views/KioskView.tsx:176-182`

**Change:** Increase `zIndex` on main content area so it renders above the video + overlay.

- [ ] **Step 1: Update the `<main>` style**

Change `zIndex: 1` to `zIndex: 2` in the main container style (line 179).

- [ ] **Step 2: Also update the footer `zIndex`**

Change `zIndex: 1` to `zIndex: 2` in the footer style (line 386).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/views/KioskView.tsx
git commit -m "fix(kiosk): set z-index 2 on content to layer above video"
```

---

### Task 4: Menu phase — title + service cards

**Files:**
- Modify: `frontend/src/views/KioskView.tsx:185-277`

**Change:** Redesign the menu section. Title and subtitle become white (over video). Service cards become solid white `#ffffff` with pastel icon circles, no glows, no neon borders.

- [ ] **Step 1: Replace title and subtitle styles**

Old title styles (lines 190-202):
```jsx
<h1 style={{
  margin: 0, color: '#ffffff',
  fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
  fontWeight: 800, letterSpacing: '-0.01em',
}}>
  ¿Cuál es el motivo de su visita?
</h1>
<p style={{
  margin: '10px 0 0', color: 'rgba(255,255,255,0.45)',
  fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', fontWeight: 500,
}}>
  Toque la opción correspondiente para generar su turno
</p>
```

New:
```jsx
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
```

- [ ] **Step 2: Replace service card styles**

Old card styles (lines 216-274):
```jsx
<button
  key={key}
  onClick={() => select(key)}
  style={{
    background: isPressed
      ? `rgba(255,255,255,0.12)`
      : 'rgba(255,255,255,0.06)',
    border: `1.5px solid ${isPressed ? c.accent : 'rgba(255,255,255,0.1)'}`,
    borderTop: `5px solid ${c.accent}`,
    borderRadius: 20,
    padding: '36px 24px',
    cursor: 'pointer',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', textAlign: 'center',
    gap: 16, width: '100%',
    transform: isPressed ? 'scale(0.97)' : 'scale(1)',
    transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
    boxShadow: isPressed
      ? `0 0 0 3px ${c.accent}55`
      : '0 4px 20px rgba(0,0,0,0.3)',
    WebkitTapHighlightColor: 'transparent',
  }}
>
  {/* Ícono */}
  <div style={{
    width: 80, height: 80, borderRadius: 18,
    background: c.light,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: `0 4px 16px ${c.accent}44`,
  }}>
    <Icon style={{ fontSize: 44, color: c.accent }} />
  </div>

  {/* Texto */}
  <div>
    <div style={{
      fontSize: 'clamp(1rem, 1.8vw, 1.25rem)',
      fontWeight: 800, color: '#ffffff',
      letterSpacing: '-0.01em', marginBottom: 8,
    }}>
      {c.label}
    </div>
    <div style={{
      fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)',
      color: 'rgba(255,255,255,0.45)',
      lineHeight: 1.5, fontWeight: 400,
    }}>
      {c.desc}
    </div>
  </div>

  {/* Badge prefijo */}
  <div style={{
    marginTop: 'auto',
    background: c.accent + '22',
    border: `1px solid ${c.accent}55`,
    borderRadius: 99, padding: '4px 14px',
    fontSize: 11, fontWeight: 800,
    color: c.accent, letterSpacing: '0.12em',
  }}>
    PREFIJO {key === 'ANALYSIS' ? 'A' : key === 'RESULTS' ? 'R' : 'P'}
  </div>
</button>
```

New:
```jsx
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
```

Key changes in the card:
- Background white solid (no semi-transparent)
- No border-top colored accent
- Default border: `2px solid transparent` (only colored on press)
- Shadow: subtle `0 4px 20px rgba(0,0,0,0.08)` (no glow)
- Icon circle: no `boxShadow` glow around it
- Text: `#0F172A` and `#475569` instead of white
- Removed badge prefix div entirely

- [ ] **Step 3: Commit**

```bash
git add frontend/src/views/KioskView.tsx
git commit -m "feat(kiosk): redesign service cards as solid white with pastel icons"
```

---

### Task 5: Loading phase — navy spinner

**Files:**
- Modify: `frontend/src/views/KioskView.tsx:282-290`

**Change:** Replace green spinner with navy `#1B2A4A` spinner and update text color.

- [ ] **Step 1: Update loading phase**

Old:
```jsx
{phase === 'loading' && (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
    <CircularProgress size={80} thickness={3} sx={{ color: '#4ADE80' }} />
    <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>
      Generando su turno...
    </div>
  </div>
)}
```

New:
```jsx
{phase === 'loading' && (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
    <CircularProgress size={80} thickness={3} sx={{ color: '#1B2A4A' }} />
    <div style={{ color: '#ffffff', fontSize: 22, fontWeight: 700 }}>
      Generando su turno...
    </div>
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/KioskView.tsx
git commit -m "feat(kiosk): change loading spinner to navy #1B2A4A"
```

---

### Task 6: Success phase — remove glows, solid card

**Files:**
- Modify: `frontend/src/views/KioskView.tsx:292-381`

**Change:** Redesign the success screen: remove green glow, remove glow shadow on ticket number, use solid white background for ticket card, update text colors.

- [ ] **Step 1: Replace success phase content**

Old (lines 293-381):
```jsx
{phase === 'success' && ticket && svc && (
  <Fade in timeout={400}>
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', width: '100%', maxWidth: 520,
    }}>
      {/* Check animado */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: '#16A34A22',
        border: '2px solid #16A34A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <CheckIcon style={{ fontSize: 44, color: '#4ADE80' }} />
      </div>

      <div style={{ color: '#4ADE80', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
        ¡Turno generado exitosamente!
      </div>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 28 }}>
        Su número de atención es:
      </div>

      {/* Número de turno — protagonista */}
      <div style={{
        background: svc.light,
        border: `3px solid ${svc.accent}`,
        borderRadius: 24,
        padding: '20px 60px',
        marginBottom: 24,
        boxShadow: `0 0 48px ${svc.accent}55`,
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

      {/* Servicio */}
      <div style={{
        background: svc.accent + '22',
        border: `1px solid ${svc.accent}55`,
        borderRadius: 99, padding: '6px 20px',
        fontSize: 13, fontWeight: 800,
        color: svc.accent, letterSpacing: '0.1em',
        textTransform: 'uppercase', marginBottom: 20,
      }}>
        {getServiceTypeLabel(ticket.service_type)}
      </div>

      <div style={{
        color: 'rgba(255,255,255,0.5)', fontSize: 14,
        lineHeight: 1.6, marginBottom: 32,
      }}>
        Retire su ticket impreso y aguarde en la<br />
        sala de espera a ser llamado en la pantalla.
      </div>

      {/* Botón volver con countdown */}
      <button
        onClick={reset}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 12, padding: '14px 28px',
          cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
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
          sx={{ color: svc.accent }}
        />
      </button>
    </div>
  </Fade>
)}
```

New:
```jsx
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
```

Key changes in success phase:
- Check icon: color `#16A34A` instead of `#4ADE80`, background `rgba(22,163,74,0.13)` instead of `#16A34A22` (slightly more opaque, same intent)
- Title text: `#16A34A` instead of `#4ADE80`
- Subtitle: `rgba(255,255,255,0.5)` (white on video) instead of `rgba(255,255,255,0.45)` (same intent)
- Ticket number box: `background: '#ffffff'` (solid white) instead of `svc.light` (pastel)
- Ticket number shadow: `0 4px 16px rgba(0,0,0,0.08)` (neutral) instead of glow `0 0 48px ${svc.accent}55`
- Service pill: `background: svc.light` (solid pastel) with `color: svc.dark`, no border, no semi-transparency
- Bottom text: white with 0.55 opacity (legible on video)
- Back button: `background: '#1B2A4A'` (navy) with white text instead of semi-transparent white
- Countdown spinner: white instead of service accent color

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/KioskView.tsx
git commit -m "feat(kiosk): redesign success screen with solid white ticket card, navy button"
```

---

### Task 7: Footer z-index

- [ ] **Step 1: Update footer z-index**

Change footer zIndex from `1` to `2` (line 386).

If already done in Task 3, skip this task.

- [ ] **Step 2: Commit (if changes made)**

```bash
git add frontend/src/views/KioskView.tsx
git commit -m "fix(kiosk): ensure footer renders above video overlay"
```

---

### Task 8: Verify and cleanup

- [ ] **Step 1: Start dev server and check all phases**

Run: `npm run dev`

Test the kiosk flow:
1. Menu: 3 white cards on video, title readable, cards have subtle shadow
2. Tap a card: scale feedback + colored border appears briefly
3. Loading: navy spinner spins, text visible
4. Success: white card with ticket number, navy back button with countdown
5. Let countdown expire → back to menu

- [ ] **Step 2: Check no unused imports remain**

The component currently imports:
```typescript
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
```

All imports should still be used. No changes needed.

- [ ] **Step 3: Final commit**

```bash
git add frontend/src/views/KioskView.tsx
git commit -m "feat(kiosk): complete light mode redesign with video background"
```
