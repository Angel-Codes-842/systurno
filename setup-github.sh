#!/bin/bash
# Script para configurar y subir el proyecto a GitHub

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Configuración de GitHub             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Verificar si git está configurado
if ! git config user.name >/dev/null 2>&1; then
    echo -e "${YELLOW}📝 Configuración de Git${NC}"
    echo ""
    read -p "Ingresa tu nombre (para Git): " git_name
    read -p "Ingresa tu email (de GitHub): " git_email
    
    git config --global user.name "$git_name"
    git config --global user.email "$git_email"
    
    echo -e "${GREEN}✅ Git configurado correctamente${NC}"
    echo ""
fi

# Mostrar configuración actual
echo -e "${YELLOW}📋 Configuración actual de Git:${NC}"
echo "   Nombre: $(git config user.name)"
echo "   Email:  $(git config user.email)"
echo ""

# Verificar archivos a subir
echo -e "${YELLOW}📦 Preparando archivos...${NC}"
git add .

# Mostrar resumen
echo ""
echo -e "${YELLOW}📊 Archivos que se subirán:${NC}"
git status --short | head -20
total_files=$(git status --short | wc -l)
echo "   ... y $total_files archivos en total"
echo ""

# Confirmar
read -p "¿Deseas continuar con el commit? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}❌ Operación cancelada${NC}"
    exit 1
fi

# Hacer commit
echo ""
echo -e "${YELLOW}💾 Creando commit inicial...${NC}"
git commit -m "Initial commit: Sistema de Turnos Biogenic

- Sistema completo de gestión de turnos
- Backend: Django + Channels (WebSocket)
- Frontend: React + TypeScript + Vite
- Diseño corporativo profesional
- Scripts de instalación y deployment
- Documentación completa"

echo -e "${GREEN}✅ Commit creado exitosamente${NC}"
echo ""

# Instrucciones para GitHub
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Siguiente Paso: Crear Repositorio   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 Instrucciones:${NC}"
echo ""
echo "1. Ve a GitHub: https://github.com/new"
echo ""
echo "2. Crea un nuevo repositorio:"
echo "   - Nombre: sistema-turnos-biogenic (o el que prefieras)"
echo "   - Descripción: Sistema de gestión de turnos para laboratorio"
echo "   - Visibilidad: Público o Privado (tu elección)"
echo "   - NO inicialices con README, .gitignore o licencia"
echo ""
echo "3. Después de crear el repo, copia la URL que te da GitHub"
echo "   Ejemplo: https://github.com/tu-usuario/sistema-turnos-biogenic.git"
echo ""
echo "4. Ejecuta estos comandos (reemplaza la URL con la tuya):"
echo ""
echo -e "${GREEN}   git remote add origin https://github.com/TU-USUARIO/TU-REPO.git${NC}"
echo -e "${GREEN}   git push -u origin main${NC}"
echo ""
echo "5. ¡Listo! Tu proyecto estará en GitHub"
echo ""
echo -e "${YELLOW}💡 Tip: Si el repositorio es privado, GitHub te pedirá autenticación${NC}"
echo ""
