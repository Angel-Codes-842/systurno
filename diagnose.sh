#!/bin/bash
# Sistema de Turnos - Diagnóstico y Reparación
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Sistema de Turnos - Diagnóstico     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Función para verificar comando
check_command() {
    local cmd=$1
    local name=$2
    
    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd --version 2>/dev/null | head -n1 | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -n1 || echo "N/A")
        echo -e "${GREEN}✅ $name${NC} (v$version)"
        return 0
    else
        echo -e "${RED}❌ $name no encontrado${NC}"
        return 1
    fi
}

# Función para verificar venv
check_venv() {
    local dir=$1
    if [ -d "$dir/venv" ]; then
        if $dir/venv/bin/pip --version >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Entorno virtual OK${NC}"
            return 0
        else
            echo -e "${RED}❌ Entorno virtual corrupto${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Entorno virtual no existe${NC}"
        return 1
    fi
}

# Verificar sistema operativo
echo -e "${YELLOW}🖥️  Sistema Operativo:${NC}"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "   $PRETTY_NAME"
    if [[ "$ID" != "ubuntu" ]] && [[ "$ID_LIKE" != *"ubuntu"* ]] && [[ "$ID" != "debian" ]] && [[ "$ID_LIKE" != *"debian"* ]]; then
        echo -e "${YELLOW}   ⚠️  Este sistema está optimizado para Ubuntu/Debian${NC}"
    fi
else
    echo -e "${RED}   ❌ Sistema no identificado${NC}"
fi
echo ""

# Verificar dependencias del sistema
echo -e "${YELLOW}📦 Dependencias del Sistema:${NC}"
check_command "python3" "Python 3"
check_command "pip3" "pip3"
check_command "node" "Node.js"
check_command "npm" "npm"

# Verificar versión de Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//' | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}   ⚠️  Node.js versión $NODE_VERSION es muy antigua (requiere 18+)${NC}"
    fi
fi
echo ""

# Verificar estructura del proyecto
echo -e "${YELLOW}📁 Estructura del Proyecto:${NC}"
[ -d "backend" ] && echo -e "${GREEN}✅ Directorio backend${NC}" || echo -e "${RED}❌ Directorio backend${NC}"
[ -d "frontend" ] && echo -e "${GREEN}✅ Directorio frontend${NC}" || echo -e "${RED}❌ Directorio frontend${NC}"
[ -f "setup.sh" ] && echo -e "${GREEN}✅ Script setup.sh${NC}" || echo -e "${RED}❌ Script setup.sh${NC}"
[ -f "start.sh" ] && echo -e "${GREEN}✅ Script start.sh${NC}" || echo -e "${RED}❌ Script start.sh${NC}"
echo ""

# Verificar backend
echo -e "${YELLOW}🔧 Backend:${NC}"
if [ -d "backend" ]; then
    cd backend
    [ -f "requirements-minimal.txt" ] && echo -e "${GREEN}✅ requirements-minimal.txt${NC}" || echo -e "${RED}❌ requirements-minimal.txt${NC}"
    [ -f "manage.py" ] && echo -e "${GREEN}✅ manage.py${NC}" || echo -e "${RED}❌ manage.py${NC}"
    
    check_venv "."
    
    cd ..
else
    echo -e "${RED}❌ Directorio backend no encontrado${NC}"
fi
echo ""

# Verificar frontend
echo -e "${YELLOW}🎨 Frontend:${NC}"
if [ -d "frontend" ]; then
    cd frontend
    [ -f "package.json" ] && echo -e "${GREEN}✅ package.json${NC}" || echo -e "${RED}❌ package.json${NC}"
    [ -d "node_modules" ] && echo -e "${GREEN}✅ node_modules${NC}" || echo -e "${YELLOW}⚠️  node_modules no instalado${NC}"
    cd ..
else
    echo -e "${RED}❌ Directorio frontend no encontrado${NC}"
fi
echo ""

# Verificar puertos
echo -e "${YELLOW}🌐 Puertos:${NC}"
if command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":8000 "; then
        echo -e "${YELLOW}⚠️  Puerto 8000 en uso${NC}"
    else
        echo -e "${GREEN}✅ Puerto 8000 disponible${NC}"
    fi
    
    if netstat -tuln | grep -q ":3000 "; then
        echo -e "${YELLOW}⚠️  Puerto 3000 en uso${NC}"
    else
        echo -e "${GREEN}✅ Puerto 3000 disponible${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  netstat no disponible, no se pueden verificar puertos${NC}"
fi
echo ""

# Verificar permisos
echo -e "${YELLOW}🔐 Permisos:${NC}"
if [ -w "." ]; then
    echo -e "${GREEN}✅ Permisos de escritura en directorio actual${NC}"
else
    echo -e "${RED}❌ Sin permisos de escritura en directorio actual${NC}"
fi

if [ -d "backend" ] && [ -w "backend" ]; then
    echo -e "${GREEN}✅ Permisos de escritura en backend${NC}"
else
    echo -e "${RED}❌ Sin permisos de escritura en backend${NC}"
fi
echo ""

# Sugerencias de reparación
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Sugerencias de Reparación    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}🔧 Para reparar problemas comunes:${NC}"
echo ""
echo -e "${GREEN}1. Reinstalar completamente:${NC}"
echo "   rm -rf backend/venv frontend/node_modules"
echo "   ./setup.sh"
echo ""
echo -e "${GREEN}2. Solo reparar backend:${NC}"
echo "   rm -rf backend/venv"
echo "   cd backend && python3 -m venv venv"
echo "   ./venv/bin/pip install -r requirements-minimal.txt"
echo ""
echo -e "${GREEN}3. Solo reparar frontend:${NC}"
echo "   cd frontend && rm -rf node_modules package-lock.json"
echo "   npm install"
echo ""
echo -e "${GREEN}4. Verificar dependencias del sistema (Ubuntu/Debian):${NC}"
echo "   sudo apt update"
echo "   sudo apt install python3 python3-pip python3-venv nodejs npm"
echo ""
echo -e "${GREEN}5. Si hay problemas de permisos:${NC}"
echo "   ./fix-permissions.sh    # Reparar permisos automáticamente"
echo "   sudo chown -R \$USER:\$USER ."
echo ""
echo -e "${GREEN}6. Si los puertos están ocupados:${NC}"
echo "   sudo lsof -i :8000  # Ver qué usa el puerto 8000"
echo "   sudo lsof -i :3000  # Ver qué usa el puerto 3000"
echo "   kill -9 <PID>       # Terminar proceso"
echo ""
