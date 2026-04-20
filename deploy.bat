@echo off
:: Sistema de Turnos - Deploy Produccion (Windows)
:: Requiere: Python, Node.js, y opcionalmente NSSM para servicios de Windows
::   NSSM: https://nssm.cc/download
setlocal enabledelayedexpansion

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

:: ─── Servicios Windows con NSSM ─────────────────────────────────────────────
echo.
echo [*] Verificando NSSM para servicios de Windows...
nssm version >nul 2>&1
if errorlevel 1 (
    echo [!] NSSM no encontrado. El sistema funcionara en modo manual.
    echo     Para instalar NSSM: https://nssm.cc/download
    echo     Coloca nssm.exe en una carpeta del PATH y vuelve a ejecutar deploy.bat
    goto :sin_nssm
)

:: Registrar servicio Backend
echo [*] Registrando servicio: TurnosBackend...
set PROJ_DIR=%CD%
nssm stop TurnosBackend >nul 2>&1
nssm remove TurnosBackend confirm >nul 2>&1
nssm install TurnosBackend "%PROJ_DIR%\backend\venv\Scripts\python.exe"
nssm set TurnosBackend AppParameters "manage.py runserver 0.0.0.0:%BACKEND_PORT%"
nssm set TurnosBackend AppDirectory "%PROJ_DIR%\backend"
nssm set TurnosBackend DisplayName "Sistema de Turnos - Backend"
nssm set TurnosBackend Start SERVICE_AUTO_START
nssm set TurnosBackend AppStdout "%PROJ_DIR%\backend.log"
nssm set TurnosBackend AppStderr "%PROJ_DIR%\backend.log"
nssm start TurnosBackend

:: Registrar servicio Frontend (sirve el build con un servidor estatico)
:: Requiere: npm install -g serve
where serve >nul 2>&1
if errorlevel 1 (
    echo [*] Instalando servidor estatico ^(serve^)...
    call npm install -g serve
)

echo [*] Registrando servicio: TurnosFrontend...
for /f %%p in ('where serve') do set SERVE_PATH=%%p
nssm stop TurnosFrontend >nul 2>&1
nssm remove TurnosFrontend confirm >nul 2>&1
nssm install TurnosFrontend "%SERVE_PATH%"
nssm set TurnosFrontend AppParameters "-s dist -l %FRONTEND_PORT%"
nssm set TurnosFrontend AppDirectory "%PROJ_DIR%\frontend"
nssm set TurnosFrontend DisplayName "Sistema de Turnos - Frontend"
nssm set TurnosFrontend Start SERVICE_AUTO_START
nssm set TurnosFrontend AppStdout "%PROJ_DIR%\frontend.log"
nssm set TurnosFrontend AppStderr "%PROJ_DIR%\frontend.log"
nssm start TurnosFrontend

echo [OK] Servicios registrados e iniciados
goto :resumen

:sin_nssm
echo.
echo [!] Para iniciar manualmente ejecuta start.bat
echo [!] Para que arranquen solos al iniciar Windows, instala NSSM y
echo     vuelve a ejecutar deploy.bat

:resumen
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
echo Comandos utiles:
echo   Ver estado:   nssm status TurnosBackend
echo   Reiniciar:    nssm restart TurnosBackend
echo   Detener:      nssm stop TurnosBackend ^& nssm stop TurnosFrontend
echo.
pause
