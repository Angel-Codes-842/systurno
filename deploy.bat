@echo off
:: Sistema de Turnos - Deploy Produccion (Windows)
:: Requiere ejecutar como Administrador
setlocal enabledelayedexpansion

:: Posicionarse siempre en la carpeta del script sin importar desde dónde se ejecute
cd /d "%~dp0"

set BACKEND_PORT=8000
set FRONTEND_PORT=3000

:: Obtener IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1" ^| findstr /v "169.254"') do (
    for /f "tokens=1" %%b in ("%%a") do set LOCAL_IP=%%b
)
if not defined LOCAL_IP set LOCAL_IP=localhost

echo ╔════════════════════════════════════════╗
echo ║   Sistema de Turnos - Deploy Prod      ║
echo ╚════════════════════════════════════════╝
echo IP: %LOCAL_IP%
echo.

:: ─── Verificar herramientas ─────────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no encontrado. Ejecuta setup.bat primero.
    pause & exit /b 1
)
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no encontrado. Ejecuta setup.bat primero.
    pause & exit /b 1
)

:: ─── Backend ────────────────────────────────────────────────────────────────
echo [*] Configurando Backend para produccion...
cd backend

:: Crear/verificar venv
if not exist "venv\Scripts\pip.exe" (
    echo [*] Creando entorno virtual...
    python -m venv venv
    if not exist "venv\Scripts\pip.exe" (
        echo [ERROR] No se pudo crear el entorno virtual.
        pause & exit /b 1
    )
)

:: Instalar dependencias
echo [*] Instalando dependencias Python...
venv\Scripts\pip install -q --upgrade pip
venv\Scripts\pip install -q -r requirements-minimal.txt
if errorlevel 1 (
    echo [ERROR] Fallo al instalar dependencias de Python.
    pause & exit /b 1
)

:: Generar SECRET_KEY aleatoria
for /f %%k in ('python -c "import secrets; print(secrets.token_urlsafe(50))"') do set SECRET_KEY=%%k

:: Crear .env de produccion
echo [*] Creando .env de produccion...
(
    echo DEBUG=False
    echo SECRET_KEY=%SECRET_KEY%
    echo ALLOWED_HOSTS=*
    echo DB_ENGINE=django.db.backends.sqlite3
    echo USE_REDIS=False
    echo CORS_ALLOW_ALL_ORIGINS=True
) > .env

:: Carpetas y migraciones
if not exist "media\sliders" mkdir media\sliders
echo [*] Aplicando migraciones...
venv\Scripts\python manage.py migrate --noinput
if errorlevel 1 (
    echo [ERROR] Fallo al aplicar migraciones.
    pause & exit /b 1
)

echo [OK] Backend configurado
cd ..

:: ─── Frontend - Build ───────────────────────────────────────────────────────
echo.
echo [*] Compilando Frontend...
cd frontend

if not exist "node_modules" (
    echo [*] Instalando dependencias de Node.js...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Fallo npm install.
        pause & exit /b 1
    )
)

call npm run build
if errorlevel 1 (
    echo [ERROR] Fallo el build del frontend.
    pause & exit /b 1
)

echo [OK] Frontend compilado ^(dist/^)
cd ..

:: ─── Servicios con Task Scheduler (nativo Windows) ─────────────────────────
echo.
echo [*] Registrando tareas en el Programador de tareas de Windows...
set PROJ_DIR=%CD%

:: Instalar servidor estatico para el frontend
where serve >nul 2>&1
if errorlevel 1 (
    echo [*] Instalando servidor estatico ^(serve^)...
    call npm install -g serve
)

:: Eliminar tareas anteriores si existen
schtasks /delete /tn "TurnosBackend" /f >nul 2>&1
schtasks /delete /tn "TurnosFrontend" /f >nul 2>&1

:: Crear scripts de arranque auxiliares
echo [*] Creando scripts de arranque...
(
    echo @echo off
    echo cd /d "%PROJ_DIR%\backend"
    echo venv\Scripts\python manage.py runserver 0.0.0.0:%BACKEND_PORT% >> "%PROJ_DIR%\backend.log" 2^>^&1
) > "%PROJ_DIR%\_run_backend.bat"

for /f %%p in ('where serve') do set SERVE_PATH=%%p
(
    echo @echo off
    echo cd /d "%PROJ_DIR%\frontend"
    echo "%SERVE_PATH%" -s dist -l %FRONTEND_PORT% >> "%PROJ_DIR%\frontend.log" 2^>^&1
) > "%PROJ_DIR%\_run_frontend.bat"

:: Registrar tarea Backend - arranca al iniciar sesion
schtasks /create /tn "TurnosBackend" ^
    /tr "\"%PROJ_DIR%\_run_backend.bat\"" ^
    /sc onlogon /delay 0000:10 ^
    /ru "%USERNAME%" /rl highest /f
if errorlevel 1 (
    echo [ERROR] No se pudo registrar la tarea TurnosBackend.
    echo         Intenta ejecutar deploy.bat como Administrador.
    pause & exit /b 1
)

:: Registrar tarea Frontend - arranca al iniciar sesion
schtasks /create /tn "TurnosFrontend" ^
    /tr "\"%PROJ_DIR%\_run_frontend.bat\"" ^
    /sc onlogon /delay 0000:15 ^
    /ru "%USERNAME%" /rl highest /f
if errorlevel 1 (
    echo [ERROR] No se pudo registrar la tarea TurnosFrontend.
    pause & exit /b 1
)

:: Iniciar ahora sin esperar reinicio
echo [*] Iniciando servicios...
schtasks /run /tn "TurnosBackend" >nul
timeout /t 4 /nobreak >nul
schtasks /run /tn "TurnosFrontend" >nul

echo [OK] Tareas registradas e iniciadas

echo.
echo ╔════════════════════════════════════════╗
echo ║        OK  Deploy Completado           ║
echo ╚════════════════════════════════════════╝
echo.
echo URLs:
echo   Kiosko:      http://%LOCAL_IP%:%FRONTEND_PORT%/kiosko
echo   Turnos:      http://%LOCAL_IP%:%FRONTEND_PORT%/turnos
echo   Sala Espera: http://%LOCAL_IP%:%FRONTEND_PORT%/sala-espera
echo.
echo Los servicios arrancan automaticamente al iniciar sesion en Windows.
echo.
echo Comandos utiles:
echo   Ver tareas:   schtasks /query /tn "TurnosBackend"
echo   Iniciar:      schtasks /run /tn "TurnosBackend"
echo   Detener:      taskkill /f /im python.exe ^& taskkill /f /im node.exe
echo   Logs:         backend.log  /  frontend.log
echo.
pause
