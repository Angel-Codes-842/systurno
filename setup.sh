#!/bin/bash
# Sistema de Turnos - Instalación Completa
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║    Sistema de Turnos - Instalación     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Solo Debian/Ubuntu
if [ ! -f /etc/debian_version ]; then
    echo -e "${RED}Este script está diseñado para Debian/Ubuntu${NC}"
    exit 1
fi

# Instalar dependencias del sistema
echo -e "${YELLOW}📦 Instalando dependencias del sistema...${NC}"
sudo apt update
sudo apt install -y python3 python3-pip python3-venv python3-dev python3-full
sudo apt install -y build-essential libpq-dev libjpeg-dev zlib1g-dev
sudo apt install -y curl ca-certificates gnupg

# Node.js 20+ (requerido por el proyecto)
INSTALL_NODE=false
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//' | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        INSTALL_NODE=true
    fi
else
    INSTALL_NODE=true
fi

if [ "$INSTALL_NODE" = true ]; then
    echo -e "${YELLOW}Instalando Node.js 20...${NC}"
    
    # Remover versión vieja
    sudo apt remove -y nodejs npm 2>/dev/null || true
    sudo rm -f /etc/apt/keyrings/nodesource.gpg /etc/apt/sources.list.d/nodesource.list
    
    # Instalar Node.js 20 desde NodeSource
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
    sudo apt update
    sudo apt install -y nodejs
fi

# Verificar
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Node.js no instalado correctamente${NC}"
    echo -e "${YELLOW}Intenta manualmente: sudo apt install nodejs npm${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python $(python3 --version | cut -d' ' -f2)${NC}"
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# Backend
echo ""
echo -e "${YELLOW}🔧 Configurando Backend...${NC}"
cd backend

# Función para verificar si el venv está funcionando
check_venv() {
    if [ -d "venv" ]; then
        # Verificar si pip funciona
        if ./venv/bin/pip --version >/dev/null 2>&1; then
            return 0  # venv OK
        else
            return 1  # venv corrupto
        fi
    else
        return 1  # venv no existe
    fi
}

# Verificar estado del venv
if check_venv; then
    echo -e "${GREEN}✅ Entorno virtual existente OK${NC}"
else
    if [ -d "venv" ]; then
        echo -e "${YELLOW}⚠️  Entorno virtual corrupto, recreando...${NC}"
        rm -rf venv
    else
        echo -e "${YELLOW}📦 Creando entorno virtual...${NC}"
    fi
    
    # Crear venv nuevo
    python3 -m venv venv
    
    # Verificar que se creó correctamente
    if ! check_venv; then
        echo -e "${RED}❌ Error al crear entorno virtual${NC}"
        echo -e "${YELLOW}Posibles soluciones:${NC}"
        echo "   1. Instalar python3-venv: sudo apt install python3-venv"
        echo "   2. Verificar permisos en el directorio"
        echo "   3. Verificar espacio en disco"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Entorno virtual creado correctamente${NC}"
fi

# Actualizar pip e instalar dependencias
echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
./venv/bin/pip install -q --upgrade pip
./venv/bin/pip install -q -r requirements-minimal.txt

# Crear .env si no existe
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
DEBUG=True
SECRET_KEY=django-insecure-dev-key-change-in-production
ALLOWED_HOSTS=*
DB_ENGINE=django.db.backends.sqlite3
USE_REDIS=False
CORS_ALLOW_ALL_ORIGINS=True
EOF
fi

# Crear carpetas necesarias
mkdir -p media/sliders
chmod -R 775 media 2>/dev/null || true

# Migraciones
./venv/bin/python manage.py makemigrations --noinput 2>/dev/null || true
./venv/bin/python manage.py migrate --noinput

echo -e "${GREEN}✅ Backend configurado${NC}"

# Frontend
cd ..
echo ""
echo -e "${YELLOW}🎨 Configurando Frontend...${NC}"
cd frontend

# Función para limpiar node_modules con permisos
clean_node_modules() {
    if [ -d "node_modules" ]; then
        echo -e "${YELLOW}   Limpiando node_modules...${NC}"
        # Intentar eliminar normalmente primero
        rm -rf node_modules package-lock.json 2>/dev/null || {
            # Si falla, cambiar permisos y volver a intentar
            echo -e "${YELLOW}   Corrigiendo permisos...${NC}"
            chmod -R u+w node_modules 2>/dev/null || true
            rm -rf node_modules package-lock.json 2>/dev/null || {
                # Si aún falla, usar sudo como último recurso
                echo -e "${YELLOW}   Requiere permisos de administrador...${NC}"
                sudo rm -rf node_modules package-lock.json 2>/dev/null || true
            }
        }
    fi
}

# Verificar si npm funciona correctamente
if [ -d "node_modules" ]; then
    # Probar si npm puede acceder a node_modules
    if ! npm list >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Problemas de permisos detectados en node_modules${NC}"
        clean_node_modules
    fi
fi

# Limpiar node_modules si no existe o hay problemas
if [ ! -d "node_modules" ]; then
    clean_node_modules
fi

# Instalar dependencias
echo -e "${YELLOW}   Instalando dependencias de Node.js...${NC}"
if ! npm install; then
    echo -e "${RED}❌ Error al instalar dependencias de npm${NC}"
    echo -e "${YELLOW}Intentando reparar...${NC}"
    
    # Limpiar completamente y volver a intentar
    clean_node_modules
    
    # Verificar permisos del directorio actual
    if [ ! -w "." ]; then
        echo -e "${RED}❌ Sin permisos de escritura en el directorio frontend${NC}"
        echo -e "${YELLOW}Solución: sudo chown -R $USER:$USER $(pwd)${NC}"
        exit 1
    fi
    
    # Intentar de nuevo
    npm install || {
        echo -e "${RED}❌ No se pudieron instalar las dependencias de npm${NC}"
        echo -e "${YELLOW}Soluciones manuales:${NC}"
        echo "   1. sudo chown -R $USER:$USER $(pwd)"
        echo "   2. sudo rm -rf node_modules package-lock.json"
        echo "   3. npm install"
        exit 1
    }
fi

echo -e "${GREEN}✅ Frontend configurado${NC}"

# Resumen
cd ..
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       ✅ Instalación Completada        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}🚀 Para iniciar:${NC} ${GREEN}./start.sh${NC}"
echo ""
echo -e "${YELLOW}🌐 URLs:${NC}"
echo "   Kiosko:      http://localhost:3000/kiosko"
echo "   Turnos:      http://localhost:3000/turnos"
echo "   Sala Espera: http://localhost:3000/sala-espera"
echo ""
