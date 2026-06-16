echo on
:: Sistema de Turnos - Inicio DEBUG (muestra todos los comandos)
:: Igual a start.bat pero con echo on para diagnosticar problemas
setlocal enabledelayedexpansion

cd /d "%~dp0"

if not "%~1"=="" set SERVER_IP=%~1
set BACKEND_PORT=8000
set FRONTEND_PORT=3000

echo ------------------------------------------
echo ^|   Sistema de Turnos - Modo DEBUG       ^|
echo ------------------------------------------
echo.

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

echo [OK] Verificacion OK
echo.

pushd backend >nul 2>&1
start "Backend DEBUG" cmd /k "title Backend DEBUG && venv\Scripts\python manage.py runserver 0.0.0.0:%BACKEND_PORT%"
popd >nul 2>&1

timeout /t 3 /nobreak >nul

pushd frontend >nul 2>&1
start "Frontend DEBUG" cmd /k "title Frontend DEBUG && npm run dev -- --host 0.0.0.0 --port %FRONTEND_PORT%"
popd >nul 2>&1

timeout /t 5 /nobreak >nul

echo.
echo --- URLs locales -----------------------------------------------------
echo   Kiosko:      http://localhost:%FRONTEND_PORT%/kiosk
echo   Recepcion:   http://localhost:%FRONTEND_PORT%/turnos
echo   Sala Espera: http://localhost:%FRONTEND_PORT%/display
echo   API:         http://localhost:%BACKEND_PORT%/api/
echo ----------------------------------------------------------------------
echo.
echo --- URLs en red local ------------------------------------------------
if defined SERVER_IP (
    echo   Kiosko:      http://%SERVER_IP%:%FRONTEND_PORT%/kiosk
    echo   Recepcion:   http://%SERVER_IP%:%FRONTEND_PORT%/turnos
    echo   Sala Espera: http://%SERVER_IP%:%FRONTEND_PORT%/display
    echo   API:         http://%SERVER_IP%:%BACKEND_PORT%/api/
) else (
    for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
        set "IP=%%I"
        for /f "tokens=*" %%a in ("!IP!") do set "IP=%%a"
        if defined IP (
            echo   Kiosko:      http://!IP!:%FRONTEND_PORT%/kiosk
            echo   Recepcion:   http://!IP!:%FRONTEND_PORT%/turnos
            echo   Sala Espera: http://!IP!:%FRONTEND_PORT%/display
            echo   API:         http://!IP!:%BACKEND_PORT%/api/
        )
    )
)
echo ----------------------------------------------------------------------
echo.
pause
