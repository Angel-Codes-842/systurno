#!/bin/bash

# Script para verificar dependencias del backend
# Ejecutar: ./check-dependencies.sh

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Verificación de Dependencias - Backend        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar entorno virtual
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Entorno virtual no encontrado${NC}"
    echo "   Ejecuta: python3 -m venv venv"
    exit 1
fi

# Activar entorno virtual
source venv/bin/activate

echo -e "${YELLOW}📦 Verificando dependencias principales...${NC}"
echo ""

# Función para verificar módulo
check_module() {
    local module=$1
    local name=$2
    
    if python -c "import $module" 2>/dev/null; then
        local version=$(python -c "import $module; print($module.__version__)" 2>/dev/null || echo "N/A")
        echo -e "${GREEN}✅ $name${NC} (v$version)"
        return 0
    else
        echo -e "${RED}❌ $name${NC}"
        return 1
    fi
}

# Verificar dependencias core
echo "Core:"
check_module "django" "Django"
check_module "rest_framework" "Django REST Framework"
check_module "rest_framework_simplejwt" "JWT"
check_module "corsheaders" "CORS Headers"
echo ""

# Verificar WebSocket
echo "WebSocket:"
check_module "channels" "Channels"
check_module "daphne" "Daphne"
echo ""

# Verificar base de datos
echo "Base de Datos:"
check_module "psycopg2" "PostgreSQL (psycopg2)" || echo "   (Opcional para desarrollo con SQLite)"
echo ""

# Verificar Redis
echo "Redis:"
check_module "redis" "Redis Client" || echo "   (Opcional para desarrollo)"
check_module "channels_redis" "Channels Redis" || echo "   (Opcional para desarrollo)"
echo ""

# Verificar utilidades
echo "Utilidades:"
check_module "dotenv" "python-dotenv"
check_module "pytz" "pytz"
echo ""

# Verificar servidores
echo "Servidores:"
check_module "uvicorn" "Uvicorn" || echo "   (Opcional)"
check_module "gunicorn" "Gunicorn" || echo "   (Opcional)"
echo ""

# Resumen
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  Verificación Completa                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Contar paquetes instalados
total=$(pip list | wc -l)
echo "Total de paquetes instalados: $((total - 2))"
echo ""

# Mostrar tamaño del entorno virtual
size=$(du -sh venv 2>/dev/null | cut -f1)
echo "Tamaño del entorno virtual: $size"
echo ""

echo -e "${YELLOW}💡 Para instalar dependencias faltantes:${NC}"
echo "   Mínimas:    pip install -r requirements-minimal.txt"
echo "   Producción: pip install -r requirements-prod.txt"
echo "   Desarrollo: pip install -r requirements-dev.txt"
echo "   Completas:  pip install -r requirements.txt"
echo ""
