#!/bin/bash
set -e

# Posicionarse siempre en la raíz del proyecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Sistema de Turnos - Inicio        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"

# Verificar instalación
echo -e "${YELLOW}🔍 Verificando sistema...${NC}"

# Función para verificar venv
check_backend() {
    if [ -d "backend/venv" ] && backend/venv/bin/pip --version >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Verificar backend
if ! check_backend; then
    echo -e "${RED}❌ Backend no configurado correctamente${NC}"
    echo -e "${YELLOW}💡 Soluciones:${NC}"
    echo "   1. Ejecutar: ./setup.sh"
    echo "   2. Si persiste el error, eliminar backend/venv y ejecutar setup.sh"
    echo ""
    read -p "¿Quieres que ejecute ./setup.sh automáticamente? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Ejecutando setup.sh...${NC}"
        ./setup.sh
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Setup falló${NC}"
            exit 1
        fi
    else
        exit 1
    fi
fi

# Verificar frontend
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${RED}❌ Frontend no configurado. Ejecuta: ./setup.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Sistema verificado${NC}"

# Cleanup
cleanup() {
    echo -e "\n${YELLOW}Deteniendo servicios...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

pkill -f "manage.py runserver" 2>/dev/null || true
sleep 1

# Backend
echo -e "${YELLOW}Iniciando Backend...${NC}"
cd backend
./venv/bin/python manage.py runserver 0.0.0.0:${BACKEND_PORT} > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 2

# Frontend
echo -e "${YELLOW}Iniciando Frontend...${NC}"
cd frontend
npm run dev -- --host 0.0.0.0 --port ${FRONTEND_PORT} > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 2

echo -e "${GREEN}✅ Sistema iniciado${NC}"
echo ""
echo -e "URLs Red Local:"
echo -e "  Kiosko:      ${GREEN}http://${LOCAL_IP}:${FRONTEND_PORT}/kiosko${NC}"
echo -e "  Turnos:      ${GREEN}http://${LOCAL_IP}:${FRONTEND_PORT}/turnos${NC}"
echo -e "  Sala Espera: ${GREEN}http://${LOCAL_IP}:${FRONTEND_PORT}/sala-espera${NC}"
echo ""
echo -e "Kiosko con impresión silenciosa (Windows):"
echo -e "  ${YELLOW}start-kiosko.bat${NC}"
echo ""
echo -e "${RED}Ctrl+C para detener${NC}"

wait
