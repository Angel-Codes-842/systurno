# 🎫 Sistema de Turnos - Biogenic

Sistema profesional de gestión de turnos para laboratorios y clínicas. Diseño corporativo, interfaz intuitiva y actualizaciones en tiempo real.

![Estado](https://img.shields.io/badge/estado-producción-success)
![Licencia](https://img.shields.io/badge/licencia-MIT-blue)
![Python](https://img.shields.io/badge/python-3.10+-blue)
![Node](https://img.shields.io/badge/node-18+-green)

## 📸 Capturas de Pantalla

### Kiosko (Pantalla Táctil)
Interfaz simple para que los pacientes obtengan su turno

### Sala de Espera (Pantalla TV)
Muestra los turnos llamados en tiempo real con sonido y voz

### Panel de Recepción
Gestión completa de turnos con atajos de teclado

## ✨ Características

- ✅ **Generación automática de turnos** con numeración secuencial
- ✅ **Notificaciones en tiempo real** vía WebSocket
- ✅ **Impresión de tickets** térmica o estándar
- ✅ **Múltiples tipos de servicio** (Análisis, Resultados, Presupuestos)
- ✅ **Pantalla de espera** con sliders personalizables
- ✅ **Anuncios por voz** en la sala de espera
- ✅ **Diseño corporativo profesional**
- ✅ **Responsive** y adaptable a diferentes dispositivos
- ✅ **Historial de turnos** del día
- ✅ **Auto-reparación** de problemas comunes

## 🚀 Inicio Rápido

### Desarrollo Local (Linux/Mac)
```bash
git clone https://github.com/Angel-Codes-842/systurno.git
cd systurno
./setup.sh    # Instala todo automáticamente
./start.sh    # Inicia el sistema
```

### Desarrollo Local (Windows)
```bat
git clone https://github.com/Angel-Codes-842/systurno.git
cd systurno
setup.bat     :: Instala todo automáticamente
start.bat     :: Inicia el sistema
```
> Ejecutar como **Administrador** para evitar problemas de permisos.

### Producción (Ubuntu Server)
```bash
git clone https://github.com/Angel-Codes-842/systurno.git /opt/turnos
cd /opt/turnos
./deploy.sh   # Instala Nginx, configura todo automáticamente
```

### Producción (Windows Server)
```bat
git clone https://github.com/Angel-Codes-842/systurno.git
cd systurno
deploy.bat    :: Build del frontend + registra tareas en el Programador de tareas
```
> Requiere ejecutar como **Administrador**. Los servicios arrancan automáticamente al iniciar sesión.

📖 **Guía detallada:** Ver [INSTALACION.md](docs/INSTALACION.md)

## ✨ Flujo

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     KIOSKO      │     │    RECEPCIÓN    │     │   PANTALLA TV   │
│  Sacar Turno    │────▶│  Llamar Turno   │────▶│  Muestra Turno  │
│   (A-01...)     │     │   + Rellamar    │     │   + Voz         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 🛠️ Tecnologías

### Backend
- **Django 5.0+** - Framework web
- **Django Channels** - WebSocket para tiempo real
- **Django REST Framework** - API REST
- **Daphne** - Servidor ASGI
- **SQLite** - Base de datos (sin configuración)

### Frontend
- **React 18** - Librería UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos

### Deployment
- **Nginx** - Servidor web
- **Systemd** - Gestión de servicios
- **Ubuntu Server 20.04+** - SO recomendado

## 📋 Requisitos

- Python 3.10+
- Node.js 20+
- Ubuntu/Debian (para producción en Linux) o Windows 10/11 (para producción en Windows)

## 💻 Instalación

### Desarrollo Local

```bash
# Clonar repositorio
git clone https://github.com/TU-USUARIO/sistema-turnos-biogenic.git
cd sistema-turnos-biogenic

# Instalar y configurar
./setup.sh

# Iniciar sistema
./start.sh

# Verificar servicios
./check-services.sh
```

### Producción (Ubuntu Server)

```bash
# Clonar en el servidor
git clone https://github.com/TU-USUARIO/sistema-turnos-biogenic.git /opt/turnos
cd /opt/turnos

# Deploy automático (instala Nginx, configura systemd, etc.)
./deploy.sh
```

## 🌐 URLs del Sistema

Después de iniciar:

- **Kiosko**: `http://localhost:3000/kiosko`
- **Panel de Turnos**: `http://localhost:3000/turnos`
- **Sala de Espera**: `http://localhost:3000/sala-espera`

Para acceso en red local, reemplaza `localhost` con la IP del servidor.

## 🔧 Scripts Disponibles

### Linux / Mac
| Script | Descripción |
|--------|-------------|
| `./setup.sh` | Instalación inicial con auto-reparación |
| `./start.sh` | Iniciar sistema en desarrollo |
| `./deploy.sh` | Deploy en producción (Ubuntu) |
| `./update.sh` | Actualizar código en producción |
| `./check-services.sh` | Verificar servicios activos |
| `./diagnose.sh` | Diagnóstico completo del sistema |
| `./fix-permissions.sh` | Reparar problemas de permisos |
| `./test-system.sh` | Pruebas automatizadas |

### Windows
| Script | Descripción |
|--------|-------------|
| `setup.bat` | Instalación inicial (venv, dependencias, migraciones) |
| `start.bat` | Iniciar backend y frontend en ventanas separadas |
| `deploy.bat` | Build de producción + registro en Programador de tareas |
| `start-kiosko.bat` | Abrir Chrome en modo kiosko (IP detectada automáticamente) |

## 📱 Configuración de Dispositivos

### Tablet/PC Táctil (Kiosko)
```bash
chromium-browser --kiosk http://IP_SERVIDOR:3000/kiosko
```

### Pantalla TV (Sala de Espera)
```bash
chromium-browser --kiosk http://IP_SERVIDOR:3000/sala-espera
```

### PC Recepción
Abrir en navegador: `http://IP_SERVIDOR:3000/turnos`

## 🎨 Personalización

### Cambiar Logo
Reemplaza `/frontend/public/logo.jpg` con tu logo

### Modificar Colores
Edita los archivos en `/frontend/src/pages/` para ajustar la paleta de colores

### Configurar Sliders
Usa el panel de administración en `/turnos` → "Sliders Sala Espera"

## 🐛 Solución de Problemas

```bash
# Diagnóstico completo
./diagnose.sh

# Verificar servicios
./check-services.sh

# Reparar permisos
./fix-permissions.sh

# Ver logs
tail -f backend.log
tail -f frontend.log
```

Ver [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) para más detalles.

## 📚 Documentación

- [QUICKSTART.md](docs/QUICKSTART.md) - Guía rápida de inicio
- [INICIO-RAPIDO.md](docs/INICIO-RAPIDO.md) - Guía detallada en español
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Solución de problemas
- [IMPRESION_AUTOMATICA.md](docs/IMPRESION_AUTOMATICA.md) - Configurar impresión

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

Desarrollado para Biogenic - Laboratorio de Análisis Clínicos

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub

### Requisitos
- Ubuntu Server 20.04+ (limpio)
- Acceso SSH con sudo

### Instalación

```bash
# 1. Clonar o copiar el proyecto al servidor
git clone <repo> /opt/turnos
cd /opt/turnos

# 2. Ejecutar deploy (instala todo automáticamente)
./deploy.sh
```

El script instala:
- Python 3 + venv
- Node.js 20
- Nginx
- Configura firewall (puertos 80, 22)
- Crea servicio systemd (auto-inicio)

### URLs (puerto 80)
```
http://IP_SERVIDOR/kiosko       # Pantalla táctil
http://IP_SERVIDOR/turnos       # Llamar turnos
http://IP_SERVIDOR/sala-espera  # Pantalla TV
```

### Comandos del servicio
```bash
sudo systemctl status turnos-backend   # Ver estado
sudo systemctl restart turnos-backend  # Reiniciar
sudo journalctl -u turnos-backend -f   # Ver logs
```

### Actualizar código
```bash
cd /opt/turnos
git pull
./update.sh
```

---

## 💻 Desarrollo Local

```bash
./setup.sh           # Primera vez (auto-repara venv corrupto)
./start.sh           # Iniciar sistema (backend + frontend)
./check-services.sh  # Verificar que todo esté corriendo
```

**URLs después de iniciar:**
- Kiosko: `http://localhost:3000/kiosko`
- Turnos: `http://localhost:3000/turnos`
- Sala Espera: `http://localhost:3000/sala-espera`

**Acceso desde otros dispositivos en la red:**
- Reemplaza `localhost` con la IP del servidor (ej: `http://192.168.0.104:3000/kiosko`)
- Usa `./check-services.sh` para ver las URLs correctas

### Solución de Problemas
```bash
./check-services.sh  # Verificar servicios activos y obtener URLs
./diagnose.sh        # Diagnóstico completo del sistema
./test-system.sh     # Prueba rápida y auto-reparación
./fix-permissions.sh # Reparar problemas de permisos
```

**Nuevas características de auto-reparación:**
- ✅ Detecta y repara entornos virtuales corruptos
- ✅ Soluciona enlaces simbólicos rotos (WSL/sistemas mixtos)
- ✅ Repara problemas de permisos automáticamente
- ✅ Verifica dependencias automáticamente
- ✅ Funciona en cualquier equipo sin intervención manual

El script `setup.sh` ahora detecta y repara automáticamente:
- Entornos virtuales corruptos
- Enlaces simbólicos rotos
- Dependencias faltantes

---

## 📱 Configurar Dispositivos

### Kiosko (Tablet/PC táctil)
```bash
# Linux
chromium-browser --kiosk http://IP/kiosko

# Windows
chrome.exe --kiosk http://IP/kiosko
```

### Pantalla TV (Sala de Espera)
```bash
chromium-browser --kiosk http://IP/sala-espera
```

### Auto-inicio en Raspberry Pi
Agregar a `/etc/xdg/lxsession/LXDE-pi/autostart`:
```
@chromium-browser --kiosk http://IP/sala-espera
```

---

## 📁 Estructura

```
├── backend/          # Django + Daphne (WebSocket)
├── frontend/         # React + Vite
├── deploy.sh         # Deploy producción Linux (Nginx + systemd)
├── deploy.bat        # Deploy producción Windows (Task Scheduler)
├── update.sh         # Actualizar código
├── setup.sh          # Setup desarrollo Linux
├── setup.bat         # Setup desarrollo Windows
├── start.sh          # Iniciar desarrollo Linux
├── start.bat         # Iniciar desarrollo Windows
└── start-kiosko.bat  # Kiosko Windows (IP auto-detectada)
```

---

## 🔧 Arquitectura en Producción

```
                    ┌─────────────────┐
   Puerto 80        │     NGINX       │
   ─────────────────┤                 │
                    │  /             → /var/www/turnos (frontend)
                    │  /api          → localhost:8000 (backend)
                    │  /ws           → localhost:8000 (websocket)
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
   Puerto 8000      │    DAPHNE       │
   (interno)        │   (Backend)     │
                    │   + WebSocket   │
                    └─────────────────┘
```
