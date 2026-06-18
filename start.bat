@echo off
:: Sistema de Turnos - Inicio (Windows)
:: Inicia Django (API + frontend build) y Vite (hot-reload).
:: Accede desde otros equipos via Django :8000 (media incluida).
::
:: USO: start.bat [IP] (opcional, forza IP en las URLs)
setlocal enabledelayedexpansion

cd /d "%~dp0"

if not "%~1"=="" set SERVER_IP=%~1
set BACKEND_PORT=8000
set FRONTEND_PORT=3000

echo ------------------------------------------
echo ^|      Sistema de Turnos - Inicio        ^|
echo ------------------------------------------
echo.

:: --- Verificar instalacion ----------------------------------------------
if not exist "backend\venv\Scripts\python.exe" (
    echo [ERROR] Backend no configurado. Ejecuta setup.bat primero.
    pause
    exit /b 1
)

if not exist "frontend\node_modules" (
    echo [ERROR] Frontend no configurado. Ejecuta setup.bat primero.
    pause
    exit /b 1
)

echo [OK] Sistema verificado
echo.

:: --- Build frontend si falta dist/ (para acceder via Django) ------------
if not exist "frontend\dist\index.html" (
    echo [*] Compilando frontend para acceso por red...
    pushd frontend >nul 2>&1
    call npm run build
    popd >nul 2>&1
    if exist "frontend\dist\index.html" (
        echo [OK] Frontend compilado
    ) else (
        echo [!] No se pudo compilar, solo disponible via Vite :3000
    )
    echo.
)

:: --- Iniciar Backend ---------------------------------------------------
echo [*] Iniciando Backend en puerto %BACKEND_PORT%...
pushd backend >nul 2>&1
start "Backend - Turnos" cmd /k "title Backend Turnos && venv\Scripts\python manage.py runserver 0.0.0.0:%BACKEND_PORT%"
popd >nul 2>&1
timeout /t 3 /nobreak >nul

:: --- Iniciar Frontend (modo dev) ----------------------------------------
echo [*] Iniciando Frontend en puerto %FRONTEND_PORT%...
pushd frontend >nul 2>&1
start "Frontend - Turnos" cmd /k "title Frontend Turnos && npm run dev -- --host 0.0.0.0 --port %FRONTEND_PORT%"
popd >nul 2>&1
timeout /t 5 /nobreak >nul

:: --- Detectar IP -------------------------------------------------------
if not defined SERVER_IP (
    for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
        set "IP=%%I"
        call :trim IP
        if defined IP set "LOCAL_IP=!IP!"
    )
)
if not defined LOCAL_IP set "LOCAL_IP=localhost"

:: --- Resumen ------------------------------------------------------------
echo.
echo [OK] Sistema iniciado
echo.
echo ==== ACCEDE DESDE ESTE EQUIPO ====
echo   Kiosko:      http://localhost:%FRONTEND_PORT%/kiosk
echo   Turnos:      http://localhost:%FRONTEND_PORT%/turnos
echo   Display:     http://localhost:%FRONTEND_PORT%/display
echo.
echo ==== ACCEDE DESDE OTRO EQUIPO ====
echo   Kiosko:      http://%LOCAL_IP%:%FRONTEND_PORT%/kiosk
echo   Turnos:      http://%LOCAL_IP%:%FRONTEND_PORT%/turnos
echo   Display:     http://%LOCAL_IP%:%FRONTEND_PORT%/display
echo.
echo Cierra las 2 ventanas (Backend + Frontend) para detener.
echo.
pause
goto :eof

:trim
setlocal enabledelayedexpansion
set "val=!%~1!"
for /f "tokens=* delims= " %%A in ("!val!") do endlocal & set "%~1=%%A"
goto :eof
