#!/bin/bash

# Script de configuración inicial del proyecto
# Sistema de Recepción de Pacientes - Frontend

set -e

echo "🏥 Sistema de Recepción - Setup Inicial"
echo "========================================"
echo ""

# Verificar Node.js
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "Por favor instale Node.js >= 18 desde https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versión $NODE_VERSION es muy antigua"
    echo "Se requiere Node.js >= 18"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Verificar npm
echo "📦 Verificando npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

echo "✅ npm $(npm -v) detectado"

# Instalar dependencias
echo ""
echo "📥 Instalando dependencias..."
npm install

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creando archivo .env..."
    cp .env.example .env
    echo "✅ Archivo .env creado"
    echo ""
    echo "⚠️  IMPORTANTE: Edite el archivo .env con la configuración de su servidor"
    echo "   Ejemplo: nano .env"
else
    echo ""
    echo "✅ Archivo .env ya existe"
fi

# Verificar configuración
echo ""
echo "🔍 Verificando configuración..."
if grep -q "localhost:8000" .env; then
    echo "⚠️  Advertencia: .env está configurado para localhost"
    echo "   Si el backend está en otro servidor, actualice VITE_API_URL y VITE_WS_URL"
fi

echo ""
echo "✅ Setup completado exitosamente!"
echo ""
echo "📚 Próximos pasos:"
echo "   1. Editar .env con la IP del servidor backend"
echo "   2. Ejecutar: npm run dev"
echo "   3. Abrir navegador en http://localhost:3000"
echo ""
echo "📖 Para más información, ver README.md"
echo ""
