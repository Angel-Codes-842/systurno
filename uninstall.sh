#!/bin/bash
# Sistema de Turnos - Desinstalar (Linux)
# Elimina servicios, procesos, entornos virtuales y dependencias
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║    Sistema de Turnos - Desinstalar     ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""

read -p "Esto eliminara venv, node_modules y servicios. Continuar? (s/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
    echo "Cancelado."
    exit 0
fi

# --- Detener procesos ----------------------------------------------------------
echo -e "${YELLOW}Deteniendo procesos...${NC}"
pkill -f "manage.py runserver" 2>/dev/null && echo -e "${GREEN}  OK Procesos Django detenidos${NC}" || echo "  (sin procesos Django)"
pkill -f "npm run dev" 2>/dev/null && echo -e "${GREEN}  OK Procesos Node detenidos${NC}" || echo "  (sin procesos Node)"
pkill -f daphne 2>/dev/null || true

# --- Eliminar servicio systemd -------------------------------------------------
echo -e "${YELLOW}Eliminando servicio systemd...${NC}"
if systemctl is-active --quiet turnos 2>/dev/null; then
    sudo systemctl stop turnos
    sudo systemctl disable turnos
    echo -e "${GREEN}  OK Servicio detenido${NC}"
fi
if [ -f /etc/systemd/system/turnos.service ]; then
    sudo rm -f /etc/systemd/system/turnos.service
    sudo systemctl daemon-reload
    echo -e "${GREEN}  OK Servicio eliminado${NC}"
fi

# --- Limpiar Nginx -------------------------------------------------------------
if [ -f /etc/nginx/sites-enabled/turnos ]; then
    echo -e "${YELLOW}Limpiando configuracion Nginx...${NC}"
    sudo rm -f /etc/nginx/sites-enabled/turnos
    sudo rm -f /etc/nginx/sites-available/turnos
    sudo systemctl reload nginx 2>/dev/null || true
    echo -e "${GREEN}  OK Nginx limpiado${NC}"
fi
if [ -d /var/www/turnos ]; then
    sudo rm -rf /var/www/turnos
    echo -e "${GREEN}  OK /var/www/turnos eliminado${NC}"
fi

# --- Eliminar cron -------------------------------------------------------------
crontab -l 2>/dev/null | grep -v "cleanup_tickets" | crontab - 2>/dev/null || true
echo -e "${GREEN}  OK Cron cleanup eliminado${NC}"

# --- Eliminar entornos virtuales ------------------------------------------------
echo -e "${YELLOW}Eliminando entornos virtuales...${NC}"
if [ -d "backend/venv" ]; then
    rm -rf backend/venv
    echo -e "${GREEN}  OK backend/venv eliminado${NC}"
fi
find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

# --- Eliminar node_modules ----------------------------------------------------
echo -e "${YELLOW}Eliminando dependencias Node...${NC}"
if [ -d "frontend/node_modules" ]; then
    rm -rf frontend/node_modules
    echo -e "${GREEN}  OK frontend/node_modules eliminado${NC}"
fi

# --- Eliminar logs ------------------------------------------------------------
rm -f backend.log frontend.log systurno.log 2>/dev/null
echo -e "${GREEN}  OK Logs eliminados${NC}"

# --- Resumen ------------------------------------------------------------------
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Desinstalacion Completada          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Queda intacto (por si lo necesitas):"
echo "  - backend/.env"
echo "  - backend/media/"
echo "  - frontend/dist/"
echo "  - base de datos SQLite (backend/db.sqlite3)"
echo ""
echo "Para eliminar todo, borra manualmente:"
echo "  rm -f backend/db.sqlite3"
echo "  rm -rf backend/media/"
echo "  rm -rf frontend/dist/"
echo ""
