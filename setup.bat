@echo off
:: Sistema de Turnos - Instalación Completa (Windows)
setlocal enabledelayedexpansion

:: Posicionarse siempre en la carpeta del script
cd /d "%~dp0"

echo ╔════════════════════════════════════════╗
echo ║    Sistema de Turnos - Instalación     ║
echo ╚════════════════════════════════════════╝
echo.

:: ─── Verificar Python ───────────────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no encontrado.
    echo Descargalo desde: https://www.python.org/downloads/
    echo Asegurate de marcar "Add Python to PATH" durante la instalacion.
    pause
    exit /b 1
)
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PY_VER=%%v
echo [OK] Python %PY_VER%

:: ─── Verificar Node.js ──────────────────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no encontrado.
    echo Descargalo desde: https://nodejs.org/  ^(version 20 o superior^)
    pause
    exit /b 1
)
for /f %%v in ('node --version 2^>^&1') do set NODE_VER=%%v
echo [OK] Node.js %NODE_VER%

for /f %%v in ('npm --version 2^>^&1') do set NPM_VER=%%v
echo [OK] npm %NPM_VER%

:: ─── Backend ────────────────────────────────────────────────────────────────
echo.
echo [*] Configurando Backend...
cd backend

:: Verificar/crear entorno virtual
if exist "venv\Scripts\pip.exe" (
    echo [OK] Entorno virtual existente OK
) else (
    if exist "venv" (
        echo [!] Entorno virtual corrupto, recreando...
        rmdir /s /q venv
    ) else (
        echo [*] Creando entorno virtual...
    )
    python -m venv venv
    if not exist "venv\Scripts\pip.exe" (
        echo [ERROR] No se pudo crear el entorno virtual.
        pause
        exit /b 1
    )
    echo [OK] Entorno virtual creado correctamente
)

:: Instalar dependencias Python
echo [*] Instalando dependencias Python...
venv\Scripts\pip install -q --upgrade pip
venv\Scripts\pip install -q -r requirements-minimal.txt
if errorlevel 1 (
    echo [ERROR] Fallo al instalar dependencias de Python.
    pause
    exit /b 1
)

:: Crear .env si no existe
if not exist ".env" (
    echo [*] Creando archivo .env...
    (
        echo DEBUG=True
        echo SECRET_KEY=django-insecure-dev-key-change-in-production
        echo ALLOWED_HOSTS=*
        echo DB_ENGINE=django.db.backends.sqlite3
        echo USE_REDIS=False
        echo CORS_ALLOW_ALL_ORIGINS=True
    ) > .env
)

:: Crear carpetas necesarias
if not exist "media\sliders" mkdir media\sliders

:: Migraciones
echo [*] Aplicando migraciones...
venv\Scripts\python manage.py makemigrations --noinput 2>nul
venv\Scripts\python manage.py migrate --noinput
if errorlevel 1 (
    echo [ERROR] Fallo al aplicar migraciones.
    pause
    exit /b 1
)

echo [OK] Backend configurado
cd ..

:: ─── Frontend ───────────────────────────────────────────────────────────────
echo.
echo [*] Configurando Frontend...
cd frontend

:: Instalar dependencias Node
echo [*] Instalando dependencias de Node.js...
call npm install
if errorlevel 1 (
    echo [!] Primer intento fallido, reintentando tras limpiar...
    if exist "node_modules" rmdir /s /q node_modules
    if exist "package-lock.json" del /f package-lock.json
    call npm install
    if errorlevel 1 (
        echo [ERROR] No se pudieron instalar las dependencias de npm.
        echo Soluciones manuales:
        echo   1. rmdir /s /q node_modules
        echo   2. del package-lock.json
        echo   3. npm install
        pause
        exit /b 1
    )
)

echo [OK] Frontend configurado
cd ..

:: ─── Resumen ────────────────────────────────────────────────────────────────
echo.
echo ╔════════════════════════════════════════╗
echo ║       OK  Instalacion Completada       ║
echo ╚════════════════════════════════════════╝
echo.
echo Para iniciar: start.bat  (o ejecuta start.sh en Git Bash)
echo.
echo URLs:
echo   Kiosko:      http://localhost:3000/kiosko
echo   Turnos:      http://localhost:3000/turnos
echo   Sala Espera: http://localhost:3000/sala-espera
echo.
pause
