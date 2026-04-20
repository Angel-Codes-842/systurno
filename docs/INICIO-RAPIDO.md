# 🚀 Inicio Rápido - Sistema de Turnos

## Primera Vez

```bash
# 1. Instalar todo
./setup.sh

# 2. Iniciar sistema
./start.sh
```

## Uso Diario

```bash
# Iniciar sistema
./start.sh

# Verificar que esté corriendo
./check-services.sh
```

## URLs del Sistema

Después de ejecutar `./start.sh`, el sistema estará disponible en:

### En el mismo equipo (localhost):
- **Kiosko**: http://localhost:3000/kiosko
- **Turnos**: http://localhost:3000/turnos
- **Sala Espera**: http://localhost:3000/sala-espera

### Desde otros dispositivos en la red:
Reemplaza `localhost` con la IP del servidor (ejemplo: `192.168.0.104`)

```bash
# Ver las URLs correctas con tu IP
./check-services.sh
```

## Configurar Dispositivos

### Tablet/PC Táctil (Kiosko)
```bash
# Linux
chromium-browser --kiosk http://IP_SERVIDOR:3000/kiosko

# Windows
chrome.exe --kiosk http://IP_SERVIDOR:3000/kiosko
```

### Pantalla TV (Sala de Espera)
```bash
chromium-browser --kiosk http://IP_SERVIDOR:3000/sala-espera
```

### PC Recepción (Gestión de Turnos)
Abrir en navegador normal:
```
http://IP_SERVIDOR:3000/turnos
```

## Problemas Comunes

### Error: "chrome-error://chromewebdata/"
**Causa:** El sistema no está corriendo.

**Solución:**
```bash
./check-services.sh  # Ver estado
./start.sh           # Iniciar si no está corriendo
```

### Error: "No se puede conectar"
**Causa:** Firewall bloqueando puertos o IP incorrecta.

**Solución:**
```bash
# 1. Verificar IP correcta
./check-services.sh

# 2. Verificar firewall (Ubuntu)
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp

# 3. Verificar que el servidor escuche en todas las interfaces
# El start.sh ya lo hace automáticamente (0.0.0.0)
```

### Sistema lento o no responde
```bash
# Detener (Ctrl+C en la terminal donde corre)
# O forzar:
pkill -f "manage.py runserver"
pkill -f "vite"

# Reiniciar
./start.sh
```

## Detener el Sistema

En la terminal donde ejecutaste `./start.sh`:
```bash
Ctrl+C
```

O desde otra terminal:
```bash
pkill -f "manage.py runserver"
pkill -f "vite"
```

## Scripts Útiles

```bash
./check-services.sh  # Ver estado y URLs
./diagnose.sh        # Diagnóstico completo
./fix-permissions.sh # Reparar permisos
./test-system.sh     # Probar instalación
```

## Flujo de Trabajo Típico

1. **Iniciar el día:**
   ```bash
   ./start.sh
   ./check-services.sh  # Anotar las URLs
   ```

2. **Configurar dispositivos:**
   - Abrir URLs en cada dispositivo
   - Poner en modo kiosko si es necesario

3. **Durante el día:**
   - Los pacientes sacan turnos en el kiosko
   - Recepción llama turnos desde `/turnos`
   - Sala de espera muestra llamados automáticamente

4. **Fin del día:**
   - `Ctrl+C` para detener
   - Los tickets del día quedan guardados en la base de datos

## Notas Importantes

- ✅ El sistema usa SQLite (no requiere configuración de BD)
- ✅ Los datos persisten entre reinicios
- ✅ Funciona en red local sin internet
- ✅ Soporta múltiples dispositivos simultáneos
- ✅ WebSocket para actualizaciones en tiempo real

## Soporte

Si tienes problemas:
1. Ejecuta `./diagnose.sh` para ver el estado completo
2. Revisa `TROUBLESHOOTING.md` para soluciones comunes
3. Verifica los logs: `backend.log` y `frontend.log`
