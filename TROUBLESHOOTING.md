# 🔧 Solución de Problemas

## Diagnóstico Automático

**Nuevo:** Ejecuta el diagnóstico completo del sistema:
```bash
./diagnose.sh         # Diagnóstico completo
./check-services.sh   # Verificar servicios activos
```

### Error: "Unsafe attempt to load URL" o "chrome-error://chromewebdata/"

**Síntoma:** Chrome muestra error al intentar cargar la página.

**Causa:** El servidor frontend no está corriendo o no es accesible.

**Solución:**
```bash
# 1. Verificar servicios
./check-services.sh

# 2. Si no están corriendo, iniciar
./start.sh

# 3. Verificar de nuevo
./check-services.sh
```

El script `check-services.sh` te mostrará:
- Estado del backend (puerto 8000)
- Estado del frontend (puerto 3000)
- URLs correctas para localhost y red local

## Reparación Automática de venv

Los scripts `setup.sh`, `start.sh` y `deploy.sh` ahora detectan y reparan automáticamente:
- Entornos virtuales corruptos
- Enlaces simbólicos rotos (común en WSL)
- Dependencias faltantes

**Síntoma:** Error `./venv/bin/pip: no se puede ejecutar`
**Solución:** El script detecta esto automáticamente y recrea el venv.

## WebSocket no conecta

**Síntoma:** La pantalla de sala de espera no muestra los turnos llamados.

**Solución:**
1. Verificar que el backend use `daphne` (no `runserver`)
2. Revisar que el backend esté corriendo en puerto 8000
3. Verificar CORS en `backend/clinica_backend/settings.py`

```bash
# Reiniciar backend con daphne
cd backend
source venv/bin/activate
daphne -b 0.0.0.0 -p 8000 clinica_backend.asgi:application
```

## Ticket no se imprime

**Síntoma:** Al generar turno, no aparece la ventana de impresión.

**Solución:**
1. Permitir popups en el navegador para la página del kiosko
2. Configurar impresora predeterminada en el sistema

## API no responde

**Síntoma:** Error al cargar turnos o generar tickets.

**Solución:**
```bash
# Verificar que el backend esté corriendo
curl http://localhost:8000/api/tickets/today/

# Ver logs
tail -f backend.log
```

## Pantalla en blanco

**Síntoma:** El frontend no carga.

**Solución:**
```bash
# Verificar que el frontend esté corriendo
cd frontend
npm run dev

# Ver logs
tail -f frontend.log
```

## Reiniciar todo

```bash
# Detener
Ctrl+C

# Volver a iniciar
./start.sh
```
