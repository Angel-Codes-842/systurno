#!/bin/bash
# Sistema de Turnos - Deploy Producción
set -e

# Posicionarse siempre en la raíz del proyecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SERVER_IP=$(hostname -I | awk '{print $1}')
PROJECT_DIR=$(pwd)

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Sistema de Turnos - Deploy Prod      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo -e "IP: ${GREEN}$SERVER_IP${NC} | Dir: $PROJECT_DIR"

# Detectar sistema operativo
if [ ! -f /etc/debian_version ]; then
    echo -e "${RED}Este script está diseñado para Debian/Ubuntu${NC}"
    exit 1
fi

# Instalar dependencias del sistema
echo -e "\n${YELLOW}📦 Instalando dependencias del sistema...${NC}"
sudo apt update
sudo apt install -y python3 python3-pip python3-venv python3-dev python3-full
sudo apt install -y build-essential libpq-dev libjpeg-dev zlib1g-dev
sudo apt install -y nginx curl ca-certificates gnupg

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

# Verificar instalación
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Node.js no instalado correctamente${NC}"
    echo -e "${YELLOW}Intenta manualmente: sudo apt install nodejs npm${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python $(python3 --version | cut -d' ' -f2)${NC}"
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# Backend
echo -e "\n${YELLOW}🔧 Configurando Backend...${NC}"
cd "$PROJECT_DIR/backend"

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

# Verificar y reparar venv si es necesario
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

# Instalar dependencias
echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
./venv/bin/python -m pip install -q --upgrade pip
./venv/bin/python -m pip install -q -r requirements-minimal.txt

cat > .env << EOF
DEBUG=False
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')
ALLOWED_HOSTS=*
CORS_ALLOW_ALL_ORIGINS=True
EOF

./venv/bin/python manage.py migrate --noinput 2>/dev/null || ./venv/bin/python manage.py migrate
mkdir -p media/sliders

# Permisos para que Nginx pueda acceder a media
chmod 755 "$HOME"
chmod 755 "$HOME/Escritorio" 2>/dev/null || true
chmod 755 "$PROJECT_DIR"
chmod 755 "$PROJECT_DIR/backend"
chmod -R 755 "$PROJECT_DIR/backend/media"

echo -e "${GREEN}✅ Backend configurado${NC}"

# Frontend
echo -e "\n${YELLOW}🎨 Compilando Frontend...${NC}"
cd "$PROJECT_DIR/frontend"

# Limpiar node_modules si hay problemas de permisos
rm -rf node_modules package-lock.json 2>/dev/null || true

npm install
npm run build

echo -e "${GREEN}✅ Frontend compilado${NC}"

# Nginx
echo -e "\n${YELLOW}🌐 Configurando Nginx...${NC}"
sudo mkdir -p /var/www/turnos
sudo rm -rf /var/www/turnos/*
sudo cp -r "$PROJECT_DIR/frontend/dist/"* /var/www/turnos/
sudo chown -R www-data:www-data /var/www/turnos

sudo tee /etc/nginx/sites-available/turnos > /dev/null << EOF
server {
    listen 80 default_server;
    server_name _;
    root /var/www/turnos;
    index index.html;
    client_max_body_size 50M;

    location / { try_files \$uri \$uri/ /index.html; }
    location /api { proxy_pass http://127.0.0.1:8000; proxy_set_header Host \$host; }
    location /media { alias $PROJECT_DIR/backend/media; }
    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/turnos /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Servicio systemd
echo -e "\n${YELLOW}⚙️  Configurando servicio...${NC}"
sudo tee /etc/systemd/system/turnos.service > /dev/null << EOF
[Unit]
Description=Sistema de Turnos
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR/backend
ExecStart=$PROJECT_DIR/backend/venv/bin/daphne -b 127.0.0.1 -p 8000 clinica_backend.asgi:application
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable turnos
sudo systemctl restart turnos

# Firewall
if command -v ufw &> /dev/null; then
    sudo ufw allow 80/tcp
    sudo ufw allow 22/tcp
fi

# Cron para limpieza de tickets
(crontab -l 2>/dev/null | grep -v "cleanup_tickets"; echo "0 0 * * * cd $PROJECT_DIR/backend && ./venv/bin/python manage.py cleanup_tickets") | crontab -

# Verificar
echo -e "\n${YELLOW}🔍 Verificando servicios...${NC}"
sleep 3
systemctl is-active --quiet turnos && echo -e "${GREEN}✅ Backend OK${NC}" || echo -e "${RED}❌ Backend Error${NC}"
systemctl is-active --quiet nginx && echo -e "${GREEN}✅ Nginx OK${NC}" || echo -e "${RED}❌ Nginx Error${NC}"

echo -e "\n${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✅ DEPLOY COMPLETADO           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Kiosko:      ${GREEN}http://$SERVER_IP/kiosk${NC}"
echo -e "  Turnos:      ${GREEN}http://$SERVER_IP/turnos${NC}"
echo -e "  Display:     ${GREEN}http://$SERVER_IP/display${NC}"
echo ""
echo -e "Comandos: systemctl status|restart turnos"
