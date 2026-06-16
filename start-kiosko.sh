#!/bin/bash
# Kiosko con Impresión Silenciosa - Ubuntu/Linux
#
# USO: ./start-kiosko.sh [IP] [puerto]
#   IP     - IP del servidor (default: localhost)
#   puerto - Puerto (default: 8000)
#
# EJEMPLOS:
#   ./start-kiosko.sh                     - localhost:8000
#   ./start-kiosko.sh 192.168.0.23        - IP forzada, puerto 8000
#   ./start-kiosko.sh 192.168.0.23 3000   - IP forzada, puerto 3000 (Vite dev)

SERVER_IP="${1:-localhost}"
PORT="${2:-8000}"
URL="http://${SERVER_IP}:${PORT}/kiosk"

# Si el puerto es 80, no incluirlo en la URL
if [ "$PORT" = "80" ]; then
    URL="http://${SERVER_IP}/kiosk"
fi

echo "Iniciando Kiosko en: $URL"

# Cerrar Chrome/Chromium existente
pkill -f chrome 2>/dev/null
pkill -f chromium 2>/dev/null
sleep 2

# Buscar navegador disponible
if command -v google-chrome &> /dev/null; then
    BROWSER="google-chrome"
elif command -v chromium-browser &> /dev/null; then
    BROWSER="chromium-browser"
elif command -v chromium &> /dev/null; then
    BROWSER="chromium"
else
    echo "Chrome/Chromium no encontrado. Instala con:"
    echo "  sudo apt install chromium-browser"
    exit 1
fi

echo "Usando: $BROWSER"

# Iniciar en modo kiosko con impresión silenciosa
$BROWSER --kiosk --kiosk-printing --disable-infobars --disable-session-crashed-bubble "$URL"
