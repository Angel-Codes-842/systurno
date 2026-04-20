# 📦 Guía de Instalación Rápida

## Para Desarrollo Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/Angel-Codes-842/systurno.git
cd systurno

# 2. Ejecutar instalación
./setup.sh

# 3. Iniciar el sistema
./start.sh
```

**URLs disponibles:**
- Kiosko: http://localhost:3000/kiosko
- Panel de Turnos: http://localhost:3000/turnos
- Sala de Espera: http://localhost:3000/sala-espera

---

## Para Producción (Ubuntu Server)

```bash
# 1. Clonar el repositorio
git clone https://github.com/Angel-Codes-842/systurno.git /opt/turnos
cd /opt/turnos

# 2. Ejecutar deploy (instala todo automáticamente)
./deploy.sh
```

**El script `deploy.sh` hace todo automáticamente:**
- ✅ Instala Python 3, Node.js 20, Nginx
- ✅ Configura el entorno virtual
- ✅ Instala todas las dependencias
- ✅ Compila el frontend
- ✅ Configura Nginx como proxy
- ✅ Crea servicio systemd (auto-inicio)
- ✅ Configura firewall

**URLs disponibles (puerto 80):**
- Kiosko: http://IP_SERVIDOR/kiosko
- Panel de Turnos: http://IP_SERVIDOR/turnos
- Sala de Espera: http://IP_SERVIDOR/sala-espera

---

## Requisitos

### Desarrollo
- Python 3.10+
- Node.js 18+
- Ubuntu/Debian (recomendado)

### Producción
- Ubuntu Server 20.04+ (limpio)
- Acceso SSH con sudo
- Puertos 80 y 22 disponibles

---

## Comandos Útiles

### Desarrollo
```bash
./start.sh              # Iniciar sistema
./check-services.sh     # Verificar estado
./diagnose.sh           # Diagnóstico completo
```

### Producción
```bash
sudo systemctl status turnos    # Ver estado
sudo systemctl restart turnos   # Reiniciar
sudo journalctl -u turnos -f    # Ver logs
./update.sh                     # Actualizar código
```

---

## Solución de Problemas

Si algo falla durante la instalación:

```bash
# Reparar permisos
./fix-permissions.sh

# Diagnóstico completo
./diagnose.sh

# Reinstalar desde cero
rm -rf backend/venv frontend/node_modules
./setup.sh  # o ./deploy.sh para producción
```

Ver [TROUBLESHOOTING.md](TROUBLESHOOTING.md) para más detalles.

---

## Notas Importantes

1. **Los scripts ya tienen permisos de ejecución** - No necesitas hacer `chmod +x`
2. **El deploy.sh NO necesita sudo** - El script pedirá sudo cuando lo necesite
3. **Primera vez puede tardar** - Descarga e instala todas las dependencias
4. **Internet requerido** - Para descargar paquetes de Python y Node.js
5. **Base de datos incluida** - SQLite, no requiere configuración adicional

---

## Personalización

Después de instalar, puedes personalizar:

1. **Logo**: Reemplaza `frontend/public/logo.jpg`
2. **Colores**: Edita archivos en `frontend/src/pages/`
3. **Sliders**: Usa el panel en `/turnos` → "Sliders Sala Espera"

---

## Soporte

- 📖 Documentación completa: [README.md](README.md)
- 🐛 Problemas: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- 🚀 Inicio rápido: [INICIO-RAPIDO.md](INICIO-RAPIDO.md)
