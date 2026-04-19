#!/bin/bash
# Sistema de Turnos - Reparar Permisos
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Reparando permisos del Sistema de Turnos...${NC}"
echo ""

# Obtener el usuario actual
CURRENT_USER=$(whoami)

# Función para mostrar progreso
show_progress() {
    echo -e "${YELLOW}   $1...${NC}"
}

# Función para mostrar éxito
show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Reparar permisos del directorio principal
show_progress "Reparando permisos del directorio principal"
sudo chown -R $CURRENT_USER:$CURRENT_USER . 2>/dev/null || {
    echo -e "${RED}❌ Error al cambiar propietario. ¿Estás en el directorio correcto?${NC}"
    exit 1
}
show_success "Permisos del directorio principal reparados"

# Reparar permisos específicos del backend
if [ -d "backend" ]; then
    show_progress "Reparando permisos del backend"
    chmod -R u+rwx backend/
    if [ -d "backend/venv" ]; then
        chmod -R u+rwx backend/venv/
    fi
    if [ -d "backend/media" ]; then
        chmod -R u+rwx backend/media/
    fi
    show_success "Permisos del backend reparados"
fi

# Reparar permisos específicos del frontend
if [ -d "frontend" ]; then
    show_progress "Reparando permisos del frontend"
    chmod -R u+rwx frontend/
    
    # Eliminar node_modules problemático
    if [ -d "frontend/node_modules" ]; then
        show_progress "Eliminando node_modules con problemas de permisos"
        sudo rm -rf frontend/node_modules frontend/package-lock.json 2>/dev/null || {
            chmod -R u+w frontend/node_modules 2>/dev/null || true
            rm -rf frontend/node_modules frontend/package-lock.json
        }
    fi
    show_success "Permisos del frontend reparados"
fi

# Reparar permisos de scripts
show_progress "Reparando permisos de scripts"
chmod +x *.sh 2>/dev/null || true
show_success "Permisos de scripts reparados"

# Verificar que todo esté bien
echo ""
echo -e "${YELLOW}🔍 Verificando reparación...${NC}"

# Verificar permisos de escritura
if [ -w "." ]; then
    show_success "Permisos de escritura en directorio principal"
else
    echo -e "${RED}❌ Aún sin permisos de escritura${NC}"
fi

if [ -d "backend" ] && [ -w "backend" ]; then
    show_success "Permisos de escritura en backend"
else
    echo -e "${RED}❌ Problemas con permisos en backend${NC}"
fi

if [ -d "frontend" ] && [ -w "frontend" ]; then
    show_success "Permisos de escritura en frontend"
else
    echo -e "${RED}❌ Problemas con permisos en frontend${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      ✅ PERMISOS REPARADOS             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}🚀 Ahora puedes ejecutar:${NC}"
echo "   ./setup.sh    # Para configurar el sistema"
echo "   ./start.sh    # Para iniciar el sistema"
echo ""