#!/bin/bash

# Sistema de Turnos - Actualizar código
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Actualizando Sistema de Turnos...${NC}"

SERVER_IP=$(hostname -I | awk '{print $1}')
PROJECT_DIR=$(pwd)

# Verificar si es deploy de producción o desarrollo
if [ -d "/var/www/turnos" ] && systemctl is-active --quiet turnos-backend 2>/dev/null; then
    # MODO PRODUCCIÓN
    echo -e "${YELLOW}Modo: Producción${NC}"
    
    # Backend
    echo -e "${YELLOW}Backend...${NC}"
    cd backend
    source venv/bin/activate
    pip install -q -r requirements-minimal.txt
    python manage.py migrate --noinput
    deactivate

    # Frontend
    echo -e "${YELLOW}Frontend...${NC}"
    cd "$PROJECT_DIR/frontend"
    
    # Actualizar .env con IP actual
    cat > .env << EOF
VITE_API_URL=http://${SERVER_IP}/api
VITE_WS_URL=ws://${SERVER_IP}/ws
EOF
    
    npm install --silent
    npm run build

    # Copiar a Nginx
    echo -e "${YELLOW}Copiando a Nginx...${NC}"
    sudo mkdir -p /var/www/turnos
    sudo rm -rf /var/www/turnos/*
    sudo cp -r dist/* /var/www/turnos/
    sudo chown -R www-data:www-data /var/www/turnos

    # Reiniciar backend
    sudo systemctl restart turnos-backend

    echo ""
    echo -e "${GREEN}✅ Actualización de producción completada${NC}"
    echo "   http://$SERVER_IP/kiosko"
    echo "   http://$SERVER_IP/turnos"
    echo "   http://$SERVER_IP/sala-espera"
    
else
    # MODO DESARROLLO
    echo -e "${YELLOW}Modo: Desarrollo${NC}"
    echo -e "${RED}No hay deploy de producción configurado.${NC}"
    echo ""
    echo "Para producción ejecuta primero: ${GREEN}./deploy.sh${NC}"
    echo "Para desarrollo ejecuta: ${GREEN}./start.sh${NC}"
fi
