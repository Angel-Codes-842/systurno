@echo off
:: Sistema de Turnos - Inicio (Windows)
setlocal enabledelayedexpansion

:: Posicionarse siempre en la carpeta del script
cd /d "%~dp0"

set BACKEND_PORT=8000
set FRONTEND_PORT=3000

echo ╔════════════════════════════════════════╗
echo ║      Sistema de Turnos - Inicio        ║
echo ╚════════════════════════════════════════╝
echo.

:: ─── Verificar instalacion ──────────────────────────────────────────────────
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

:: ─── Iniciar Backend ────────────────────────────────────────────────────────
echo [*] Iniciando Backend en puerto %BACKEND_PORT%...
start "Backend - Django" cmd /k "cd backend && venv\Scripts\python manage.py runserver 0.0.0.0:%BACKEND_PORT%"

:: Esperar un momento para que el backend arranque
timeout /t 3 /nobreak >nul

:: ─── Iniciar Frontend ───────────────────────────────────────────────────────
echo [*] Iniciando Frontend en puerto %FRONTEND_PORT%...
start "Frontend - Vite" cmd /k "cd frontend && npm run dev -- --host 0.0.0.0 --port %FRONTEND_PORT%"

:: Esperar que el frontend arranque
timeout /t 4 /nobreak >nul

:: ─── Resumen ────────────────────────────────────────────────────────────────
echo.
echo [OK] Sistema iniciado. Se abrieron 2 ventanas de consola.
echo.
echo URLs:
echo   Kiosko:      http://localhost:%FRONTEND_PORT%/kiosko
echo   Turnos:      http://localhost:%FRONTEND_PORT%/turnos
echo   Sala Espera: http://localhost:%FRONTEND_PORT%/sala-espera
echo.
echo Cierra las ventanas de Backend y Frontend para detener el sistema.
echo.
pause
