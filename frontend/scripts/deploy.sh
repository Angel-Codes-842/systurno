#!/bin/bash

# Script de despliegue para producción
# Sistema de Recepción de Pacientes - Frontend

set -e

echo "🚀 Sistema de Recepción - Despliegue"
echo "====================================="
echo ""

# Variables
DEPLOY_DIR="/var/www/clinica-frontend"
BACKUP_DIR="/var/backups/clinica-frontend"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

# Verificar archivo .env
if [ ! -f ".env" ]; then
    echo "❌ Error: Archivo .env no encontrado"
    echo "   Copie .env.example a .env y configure las variables"
    exit 1
fi

# Verificar configuración de producción
echo "🔍 Verificando configuración..."
if grep -q "localhost" .env; then
    echo "⚠️  Advertencia: .env contiene 'localhost'"
    echo "   ¿Está seguro que desea continuar? (s/n)"
    read -r response
    if [ "$response" != "s" ]; then
        echo "Despliegue cancelado"
        exit 0
    fi
fi

# Instalar dependencias
echo ""
echo "📥 Instalando dependencias..."
npm ci --production=false

# Ejecutar linter
echo ""
echo "🔍 Ejecutando linter..."
npm run lint || {
    echo "⚠️  Advertencia: Linter encontró problemas"
    echo "   ¿Desea continuar de todos modos? (s/n)"
    read -r response
    if [ "$response" != "s" ]; then
        echo "Despliegue cancelado"
        exit 0
    fi
}

# Build
echo ""
echo "🔨 Compilando aplicación..."
npm run build

# Verificar que el build fue exitoso
if [ ! -d "dist" ]; then
    echo "❌ Error: Directorio dist no fue creado"
    exit 1
fi

echo "✅ Build completado exitosamente"

# Crear backup si existe despliegue anterior
if [ -d "$DEPLOY_DIR" ]; then
    echo ""
    echo "💾 Creando backup del despliegue anterior..."
    sudo mkdir -p "$BACKUP_DIR"
    sudo tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C "$DEPLOY_DIR" .
    echo "✅ Backup guardado en: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
fi

# Crear directorio de despliegue
echo ""
echo "📁 Preparando directorio de despliegue..."
sudo mkdir -p "$DEPLOY_DIR"

# Copiar archivos
echo ""
echo "📤 Copiando archivos..."
sudo rm -rf "$DEPLOY_DIR"/*
sudo cp -r dist/* "$DEPLOY_DIR/"

# Establecer permisos
echo ""
echo "🔐 Configurando permisos..."
sudo chown -R www-data:www-data "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

# Verificar Nginx
echo ""
echo "🌐 Verificando configuración de Nginx..."
if sudo nginx -t 2>/dev/null; then
    echo "✅ Configuración de Nginx válida"
    echo ""
    echo "🔄 Reiniciando Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reiniciado"
else
    echo "⚠️  Advertencia: Nginx no está configurado o tiene errores"
    echo "   Revise la configuración en /etc/nginx/sites-available/"
fi

# Limpiar archivos temporales
echo ""
echo "🧹 Limpiando archivos temporales..."
rm -rf dist

echo ""
echo "✅ Despliegue completado exitosamente!"
echo ""
echo "📊 Información del despliegue:"
echo "   Directorio: $DEPLOY_DIR"
echo "   Backup: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
echo "   Fecha: $(date)"
echo ""
echo "🌐 La aplicación debería estar disponible en:"
echo "   http://[IP_SERVIDOR]/"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Verificar que la aplicación carga correctamente"
echo "   2. Probar funcionalidades principales"
echo "   3. Configurar dispositivos (kiosko, pantallas, etc.)"
echo ""
