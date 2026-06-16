# Kiosko — Rediseño Light Mode + Video de Fondo

## Resumen

Rediseñar `KioskView.tsx` para eliminar la estética neón oscura y adoptar un diseño institucional serio, alineado visualmente con `DisplayView.tsx` y `SpecialistView.tsx`. El fondo pasa a ser el video `turnero.mp4` (mismo que el Display), con tarjetas blancas sólidas sobre el video.

---

## 1. Fondo y layout general

- **Fondo**: Video `turnero.mp4` full-screen (`object-fit: cover`), igual que en `DisplayView.tsx`
- **Overlay**: `rgba(0,0,0,0.08)` para legibilidad, mismo que el Display
- **Header**: Barra sólida `#1B2A4A` (navy corporativo) de 72px
  - Izquierda: logo Biogenic sobre fondo blanco pill
  - Derecha: fecha (texto capitalizado, 12px, opacidad 0.5) y hora (30px, fontWeight 800, tabular-nums) en blanco
- **Footer**: Texto centrado "© {año} BIOGENIC — Diagnóstico Laboratorial del Grupo San Antonio", color `rgba(255,255,255,0.2)`, tamaño 11px, con borde superior sutil
- **Zonas touch**: targets mínimos de 80px altura

## 2. Menú principal (selección de servicio)

- **Título**: "¿Cuál es el motivo de su visita?" en blanco (`#ffffff`) con fontWeight 800
- **Subtítulo**: "Toque la opción correspondiente para generar su turno" en blanco con opacidad 0.6
- **Cards de servicio**: 3 columnas en grid `repeat(3, 1fr)`, gap 20px
  - Fondo blanco sólido `#ffffff`
  - `borderRadius: 16`
  - Sombra suave: `0 4px 20px rgba(0,0,0,0.08)`
  - Sin glows, sin border-top de color, sin semitransparencias
  - Sin borde de color por defecto (solo sombra)
  - Press feedback: `scale(0.97)` + aparece borde de 2px del color de acento del servicio (`#7C3AED`, `#16A34A`, `#D97706`)
  - Sin badge de prefijo
- **Cada card contiene**:
  - Icono del servicio dentro de círculo de 80px con fondo pastel (mismos colores que chips del Display/Specialist):
    - ANALYSIS: `#7C3AED` / fondo `#EDE9FE`
    - RESULTS: `#16A34A` / fondo `#DCFCE7`
    - BUDGET: `#D97706` / fondo `#FEF3C7`
  - Nombre del servicio: texto `#0F172A`, fontWeight 800
  - Descripción: texto `#475569`, fontWeight 400

## 3. Pantalla de carga

- Spinner MUI `CircularProgress` en color `#1B2A4A`
- Texto "Generando su turno..." en `#475569`, fontWeight 700
- Video de fondo continúa reproduciéndose

## 4. Pantalla de éxito

- **Check**: Círculo de 80px, borde `#16A34A`, fondo `rgba(22,163,74,0.13)`, icono check verde
- **Texto superior**: "¡Turno generado exitosamente!" en `#16A34A`, fontWeight 700
- **Subtítulo**: "Su número de atención es:" en gris
- **Número de turno**:
  - Caja blanca sólida con borde de 3px del color del servicio (ANALYSIS púrpura, RESULTS verde, BUDGET ámbar)
  - Sin sombra glow — solo sombra neutra `0 4px 16px rgba(0,0,0,0.08)`
  - Tipografía 4-6rem, fontWeight 900, tabular-nums
  - Color del texto: color oscuro del servicio (`#4C1D95`, `#14532D`, `#78350F`)
- **Pill de servicio**: Fondo pastel sólido (mismos colores que los chips), sin borde, fontWeight 800
- **Texto inferior**: "Retire su ticket impreso y aguarde en la sala de espera a ser llamado en la pantalla."
- **Botón volver**: Fondo `#1B2A4A` sólido, texto blanco, borderRadius 12, sin glow
  - Muestra icono back + "Volver al inicio ({countdown}s)" + circular progress countdown
  - Countdown automático de 8s que resetea al menú

## 5. Ticket de impresión (80mm térmico)

- Sin cambios respecto al diseño actual
- Courier New, 72mm, blanco y negro
- Estructura: marca, servicio, número grande, fecha/hora, instrucciones

## 6. Paleta de colores

| Rol | Color |
|-----|-------|
| Header / Botón volver | `#1B2A4A` |
| Cards de servicio | `#ffffff` |
| Texto en cards | `#0F172A` |
| Texto secundario en cards | `#475569` |
| Título/subtítulo (sobre video) | `#ffffff` (subtítulo con opacidad 0.6) |
| Fondo de página | Video + overlay `rgba(0,0,0,0.08)` |

## 7. Colores de servicio (mantenidos del sistema actual)

| Servicio | Acento | Fondo pastel | Oscuro |
|----------|--------|-------------|--------|
| ANALYSIS | `#7C3AED` | `#EDE9FE` | `#4C1D95` |
| RESULTS | `#16A34A` | `#DCFCE7` | `#14532D` |
| BUDGET | `#D97706` | `#FEF3C7` | `#78350F` |

## 8. No aplica

- Sin badge de prefijo en tarjetas
- Sin hover (pantalla táctil)
- Sin glows ni sombras de color
- Sin gradientes neón
- Sin fondos semitransparentes en tarjetas
