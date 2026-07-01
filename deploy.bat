@echo off
:: Sistema de Turnos - Deploy Produccion (Windows)
:: REVISADO: Django sirve frontend build + API en un solo puerto
:: REQUIERE ejecutar como Administrador
setlocal enabledelayedexpansion

:: Posicionarse siempre en la carpeta del script
cd /d "%~dp0"

set APP_PORT=8000
if not "%1"=="" set APP_PORT=%1

:: Obtener IP local (primera IPv4 que no sea loopback ni APIPA)
for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    set "IP=%%I"
    for /f "tokens=*" %%a in ("!IP!") do set LOCAL_IP=%%a
)
if not defined LOCAL_IP set LOCAL_IP=localhost

echo ----------------------------------------
echo ^|   Sistema de Turnos - Deploy Prod    ^|
echo ----------------------------------------
echo IP detectada: %LOCAL_IP%
echo Puerto unico: %APP_PORT% (API + Frontend)
echo.

:: --- Verificar herramientas --------------------------------------------------
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

:: --- Backend -----------------------------------------------------------------
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

:: Crear .env de produccion (siempre se regenera en deploy)
echo [*] Creando .env de produccion...
(
    echo DEBUG=False
    echo SECRET_KEY=%SECRET_KEY%
    echo ALLOWED_HOSTS=*
    echo DB_ENGINE=django.db.backends.sqlite3
    echo USE_REDIS=False
    echo CORS_ALLOW_ALL_ORIGINS=True
) > .env
echo [OK] .env creado con SECRET_KEY aleatoria

:: Carpetas y migraciones
if not exist "media\sliders" mkdir media\sliders
echo [*] Aplicando migraciones...
venv\Scripts\python manage.py migrate --noinput
if errorlevel 1 (
    echo [ERROR] Fallo al aplicar migraciones.
    pause & exit /b 1
)

:: Colectar archivos estaticos si se usa whitenoise/static
venv\Scripts\python manage.py collectstatic --noinput >nul 2>&1

echo [OK] Backend configurado
cd ..

:: --- Frontend - Build --------------------------------------------------------
echo.
echo [*] Compilando Frontend para produccion...
cd frontend

:: Instalar dependencias si faltan
if not exist "node_modules" (
    echo [*] Instalando dependencias de Node.js...
    cmd /c npm install
    if errorlevel 1 (
        echo [ERROR] Fallo npm install.
        pause & exit /b 1
    )
)

:: Siempre hacer build fresco en deploy
cmd /c npm run build
if errorlevel 1 (
    echo [ERROR] Fallo el build del frontend.
    pause & exit /b 1
)

echo [OK] Frontend compilado ^(dist/^)
cd ..

:: --- Registrar Tarea en Programador de Windows --------------------------------
echo.
echo [*] Registrando tarea en el Programador de tareas de Windows...
set PROJ_DIR=%CD%

:: Crear script de arranque unico (Django sirve API + Frontend)
(
    echo @echo off
    echo cd /d "%PROJ_DIR%\backend"
    echo venv\Scripts\python manage.py runserver 0.0.0.0:%APP_PORT% >> "%PROJ_DIR%\systurno.log" 2^>^&1
) > "%PROJ_DIR%\_run_systurno.bat"

:: Eliminar tareas anteriores si existen
schtasks /delete /tn "SisTurnos" /f >nul 2>&1

:: Registrar tarea unica - arranca al iniciar sesion (10s de delay)
schtasks /create /tn "SisTurnos" ^
    /tr "\"%PROJ_DIR%\_run_systurno.bat\"" ^
    /sc onlogon /delay 0000:10 ^
    /ru "%USERNAME%" /rl highest /f
if errorlevel 1 (
    echo [ERROR] No se pudo registrar la tarea.
    echo         Intenta ejecutar deploy.bat como Administrador.
    pause & exit /b 1
)

:: Iniciar ahora sin esperar reinicio
echo [*] Iniciando servicio ahora...
schtasks /run /tn "SisTurnos" >nul
timeout /t 5 /nobreak >nul

echo [OK] Tarea registrada e iniciada

echo.
echo +========================================+
echo |        OK  Deploy Completado           |
echo +========================================+
echo.
echo URLs del sistema (puerto unico %APP_PORT%):
echo   Kiosko:      http://%LOCAL_IP%:%APP_PORT%/kiosk
echo   Recepcion:   http://%LOCAL_IP%:%APP_PORT%/turnos
echo   Sala Espera: http://%LOCAL_IP%:%APP_PORT%/display
echo.
echo El servicio arranca automaticamente al iniciar sesion en Windows.
echo.
echo Comandos utiles:
echo   Ver estado:   schtasks /query /tn "SisTurnos"
echo   Reiniciar:    schtasks /run /tn "SisTurnos"
echo   Detener:      taskkill /f /im python.exe
echo   Log:          %PROJ_DIR%\systurno.log
echo.
pause

