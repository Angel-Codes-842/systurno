@echo off
:: Sistema de Turnos - Inicio en modo desarrollo (Windows)
:: Usa npm run dev (hot-reload). Para produccion usa deploy.bat
::
:: USO: start.bat [IP] (opcional, fuerza IP para las URLs)
setlocal enabledelayedexpansion

:: Posicionarse siempre en la carpeta del script
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

:: --- Iniciar Backend ---------------------------------------------------
echo [*] Iniciando Backend en puerto %BACKEND_PORT%...
pushd backend >nul 2>&1
start "Backend - Turnos" cmd /k "title Backend Turnos && venv\Scripts\python manage.py runserver 0.0.0.0:%BACKEND_PORT%"
popd >nul 2>&1

:: Esperar un momento para que el backend arranque
timeout /t 3 /nobreak >nul

:: --- Iniciar Frontend (modo dev) ----------------------------------------
echo [*] Iniciando Frontend en puerto %FRONTEND_PORT%...
pushd frontend >nul 2>&1
start "Frontend - Turnos" cmd /k "title Frontend Turnos && npm run dev -- --host 0.0.0.0 --port %FRONTEND_PORT%"
popd >nul 2>&1

:: Esperar que el frontend arranque
timeout /t 5 /nobreak >nul

:: --- Resumen ------------------------------------------------------------
echo.
echo [OK] Sistema iniciado. Se abrieron 2 ventanas de consola.
echo.
echo --- URLs locales -----------------------------------------------------
echo   Kiosko:      http://localhost:%FRONTEND_PORT%/kiosk
echo   Recepcion:   http://localhost:%FRONTEND_PORT%/turnos
echo   Sala Espera: http://localhost:%FRONTEND_PORT%/display
echo ----------------------------------------------------------------------
echo.
echo --- URLs en red local ------------------------------------------------
if defined SERVER_IP (
    echo   Kiosko:      http://%SERVER_IP%:%FRONTEND_PORT%/kiosk
    echo   Recepcion:   http://%SERVER_IP%:%FRONTEND_PORT%/turnos
    echo   Sala Espera: http://%SERVER_IP%:%FRONTEND_PORT%/display
) else (
    set "FOUND_IP="
    for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1" ^| findstr /v "169.254"') do (
        set "IP=%%I"
        call :trim IP
        if defined IP (
            echo   Kiosko:      http://!IP!:%FRONTEND_PORT%/kiosk
            echo   Recepcion:   http://!IP!:%FRONTEND_PORT%/turnos
            echo   Sala Espera: http://!IP!:%FRONTEND_PORT%/display
            set "FOUND_IP=1"
        )
    )
    if not defined FOUND_IP echo   (No se encontro direccion IPv4 local)
)
echo ----------------------------------------------------------------------
echo.
echo Cierra las ventanas "Backend Turnos" y "Frontend Turnos" para detener.
echo Para produccion usa: deploy.bat
echo.
pause
goto :eof

:trim
setlocal enabledelayedexpansion
set "val=!%~1!"
for /f "tokens=* delims= " %%A in ("!val!") do endlocal & set "%~1=%%A"
goto :eof
