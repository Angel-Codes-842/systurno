#!/bin/bash
# Sistema de Turnos - Prueba Rápida del Sistema
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Sistema de Turnos - Prueba Rápida   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Función para mostrar paso
step() {
    echo -e "${YELLOW}🔄 $1...${NC}"
}

# Función para mostrar éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para mostrar error
error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Paso 1: Verificar estructura
step "Verificando estructura del proyecto"
[ -d "backend" ] || error "Directorio backend no encontrado"
[ -d "frontend" ] || error "Directorio frontend no encontrado"
[ -f "setup.sh" ] || error "Script setup.sh no encontrado"
[ -f "start.sh" ] || error "Script start.sh no encontrado"
success "Estructura del proyecto OK"

# Paso 2: Verificar dependencias del sistema
step "Verificando dependencias del sistema"
command -v python3 >/dev/null 2>&1 || error "Python 3 no instalado"
command -v node >/dev/null 2>&1 || error "Node.js no instalado"
command -v npm >/dev/null 2>&1 || error "npm no instalado"
success "Dependencias del sistema OK"

# Paso 3: Simular venv corrupto y probar auto-reparación
step "Probando auto-reparación de venv"
if [ -d "backend/venv" ]; then
    # Corromper venv eliminando python
    rm -f backend/venv/bin/python* 2>/dev/null || true
    echo "   Venv corrompido intencionalmente"
fi

# Ejecutar setup.sh (debería reparar automáticamente)
echo "   Ejecutando setup.sh..."
./setup.sh >/dev/null 2>&1 || error "Setup falló"
success "Auto-reparación de venv OK"

# Paso 4: Verificar que el venv funciona
step "Verificando entorno virtual"
backend/venv/bin/pip --version >/dev/null 2>&1 || error "venv no funciona después de la reparación"
success "Entorno virtual OK"

# Paso 5: Verificar dependencias de Python
step "Verificando dependencias de Python"
cd backend
if ! ./venv/bin/python -c "import django, rest_framework, channels, daphne" 2>/dev/null; then
    error "Dependencias de Python faltantes"
fi
cd ..
success "Dependencias de Python OK"

# Paso 6: Verificar frontend
step "Verificando frontend"
[ -d "frontend/node_modules" ] || error "node_modules no instalado"
[ -f "frontend/package.json" ] || error "package.json no encontrado"
success "Frontend OK"

# Paso 7: Verificar puertos disponibles
step "Verificando puertos"
if command -v netstat >/dev/null 2>&1; then
    if netstat -tuln 2>/dev/null | grep -q ":8000 "; then
        echo -e "${YELLOW}   ⚠️  Puerto 8000 ocupado${NC}"
    fi
    if netstat -tuln 2>/dev/null | grep -q ":3000 "; then
        echo -e "${YELLOW}   ⚠️  Puerto 3000 ocupado${NC}"
    fi
fi
success "Verificación de puertos completada"

# Resumen final
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        ✅ SISTEMA LISTO PARA USO       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}🚀 Para iniciar el sistema:${NC}"
echo "   ./start.sh"
echo ""
echo -e "${YELLOW}🌐 URLs que estarán disponibles:${NC}"
echo "   http://localhost:3000/kiosko      - Pantalla táctil"
echo "   http://localhost:3000/turnos      - Panel de control"
echo "   http://localhost:3000/sala-espera - Pantalla TV"
echo ""
echo -e "${YELLOW}🔧 Para diagnóstico completo:${NC}"
echo "   ./diagnose.sh"
echo ""