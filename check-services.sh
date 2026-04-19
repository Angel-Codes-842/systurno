#!/bin/bash
# Sistema de Turnos - Verificar Servicios

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Verificación de Servicios Activos    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Obtener IP local
LOCAL_IP=$(hostname -I | awk '{print $1}')

# Verificar Backend (puerto 8000)
echo -e "${YELLOW}🔍 Verificando Backend (puerto 8000)...${NC}"
if curl -s http://localhost:8000/api/tickets/today/ >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend activo${NC}"
    BACKEND_OK=true
else
    echo -e "${RED}❌ Backend NO está corriendo${NC}"
    BACKEND_OK=false
fi

# Verificar Frontend (puerto 3000)
echo -e "${YELLOW}🔍 Verificando Frontend (puerto 3000)...${NC}"
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend activo${NC}"
    FRONTEND_OK=true
else
    echo -e "${RED}❌ Frontend NO está corriendo${NC}"
    FRONTEND_OK=false
fi

echo ""

# Mostrar estado y URLs
if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        ✅ SISTEMA FUNCIONANDO          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}🌐 URLs disponibles:${NC}"
    echo ""
    echo -e "  ${BLUE}Localhost:${NC}"
    echo -e "    Kiosko:      ${GREEN}http://localhost:3000/kiosko${NC}"
    echo -e "    Turnos:      ${GREEN}http://localhost:3000/turnos${NC}"
    echo -e "    Sala Espera: ${GREEN}http://localhost:3000/sala-espera${NC}"
    echo ""
    echo -e "  ${BLUE}Red Local (IP: $LOCAL_IP):${NC}"
    echo -e "    Kiosko:      ${GREEN}http://$LOCAL_IP:3000/kiosko${NC}"
    echo -e "    Turnos:      ${GREEN}http://$LOCAL_IP:3000/turnos${NC}"
    echo -e "    Sala Espera: ${GREEN}http://$LOCAL_IP:3000/sala-espera${NC}"
    echo ""
    echo -e "${YELLOW}💡 Modo Kiosko (pantalla completa):${NC}"
    echo -e "    ${GREEN}chromium-browser --kiosk http://$LOCAL_IP:3000/sala-espera${NC}"
    echo ""
else
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║      ⚠️  SISTEMA NO ESTÁ ACTIVO        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Para iniciar el sistema:${NC}"
    echo -e "    ${GREEN}./start.sh${NC}"
    echo ""
    
    if [ "$BACKEND_OK" = false ] && [ "$FRONTEND_OK" = false ]; then
        echo -e "${YELLOW}⚠️  Ni el backend ni el frontend están corriendo${NC}"
    elif [ "$BACKEND_OK" = false ]; then
        echo -e "${YELLOW}⚠️  Solo falta el backend${NC}"
    elif [ "$FRONTEND_OK" = false ]; then
        echo -e "${YELLOW}⚠️  Solo falta el frontend${NC}"
    fi
    echo ""
    exit 1
fi
