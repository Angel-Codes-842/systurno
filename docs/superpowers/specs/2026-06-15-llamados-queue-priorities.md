# Cola de Llamados + Reordenamiento de Prioridades

## Resumen

Agregar una cola "Llamados" al lado de "Cola de espera" en el Panel de Recepción, y reordenar la prioridad de servicios a RESULTS → BUDGET → ANALYSIS.

---

## 1. Orden de prioridad (backend)

En `backend/api/views.py`, cambiar el `Case` del `get_queryset` cuando `status_filter == 'WAITING'`:

| Servicio | Prioridad actual | Prioridad nueva |
|----------|-----------------|-----------------|
| RESULTS | 1 | 1 |
| ANALYSIS | 2 | 3 |
| BUDGET | 3 | 2 |

## 2. Panel derecho: dos columnas

El panel derecho del `TurnosTab` pasa de una sola card "Cola de espera" a un grid de dos columnas `1fr 1fr` con gap 16px:

### Columna izquierda: "Cola de espera" (WAITING)
- Misma card que existe actualmente, sin cambios visuales
- Tickets ordenados por la nueva prioridad (RESULTS → BUDGET → ANALYSIS)
- Cada ticket con botón "Llamar" que lo envía a "En pantalla ahora"

### Columna derecha: "Llamados" (CALLED)
- Nueva card con título "Llamados" + badge con contador
- Muestra tickets con `status === 'CALLED'` ordenados por `-called_at` (más reciente primero)
- Cada ticket muestra:
  - Chip de número con color de servicio (mismo estilo que cola de espera)
  - Service type label
  - Hora de llamado
  - Botón "Re-llamar" (icono `RecallIcon`) — llama a `recallTicket(id)`
  - Botón "Cancelar" (icono `CancelIcon`, color rojo) — llama a `cancelTicket(id)`
- Sin scroll si es necesario (o scroll independiente)
- Estado vacío: "No hay turnos llamados."

## 3. "En pantalla ahora" (sin cambios)

Se mantiene igual:
- Botón "Llamar" envía ticket a "En pantalla ahora" y lo agrega a "Llamados"
- Botón "Marcar atendido": elimina de "En pantalla ahora" y de "Llamados"
- Botón "Volver a llamar": re-notifica
- Botón "Cancelar": elimina de "En pantalla ahora" y de "Llamados"

## 4. Flujo de datos

- `refresh()` ya trae `getCalledTickets()` — se agrega un nuevo state `calledList` que almacena TODOS los llamados (sin limitar a 6)
- Al llamar un ticket → `handleCall()` → `callTicket()` → `refresh()` → ambas colas se actualizan
- Al atender desde "En pantalla ahora" → `handleAttend()` → `refresh()` → desaparece de "Llamados"
- Al cancelar desde "Llamados" → nuevo handler → `cancelTicket()` → `refresh()` → desaparece de ambas
- Al re-llamar desde "Llamados" → nuevo handler → `recallTicket()`

## 5. Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `backend/api/views.py:427-434` | Cambiar prioridad: BUDGET = 2, ANALYSIS = 3 |
| `frontend/src/views/SpecialistView.tsx` | Agregar columna "Llamados", nuevo state, handlers, layout |
