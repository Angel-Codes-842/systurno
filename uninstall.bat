@echo off
:: Sistema de Turnos - Desinstalar (Windows)
:: Elimina servicios, procesos, entornos virtuales y dependencias
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ------------------------------------------
echo ^|   Sistema de Turnos - Desinstalar      ^|
echo ------------------------------------------
echo.

:: --- Confirmar ----------------------------------------------------------------
set /p CONFIRM="Esto eliminara venv, node_modules y tareas. Continuar? (s/N): "
if /i not "!CONFIRM!"=="s" (
    echo Cancelado.
    pause
    exit /b 0
)

:: --- Detener procesos ---------------------------------------------------------
echo [*] Deteniendo procesos...
taskkill /f /im python.exe >nul 2>&1 && echo [OK] Procesos Python detenidos || echo [*] (sin procesos Python)
taskkill /f /im node.exe >nul 2>&1 && echo [OK] Procesos Node detenidos || echo [*] (sin procesos Node)

:: --- Eliminar tarea programada ------------------------------------------------
echo [*] Eliminando tarea programada...
schtasks /delete /tn "SisTurnos" /f >nul 2>&1 && echo [OK] Tarea SisTurnos eliminada || echo [*] (sin tarea SisTurnos)
schtasks /delete /tn "TurnosBackend" /f >nul 2>&1
schtasks /delete /tn "TurnosFrontend" /f >nul 2>&1

:: --- Eliminar scripts auxiliares ----------------------------------------------
if exist "_run_systurno.bat" del /f "_run_systurno.bat" >nul 2>&1 && echo [OK] Script auxiliar eliminado
if exist "_run_backend.bat" del /f "_run_backend.bat" >nul 2>&1
if exist "_run_frontend.bat" del /f "_run_frontend.bat" >nul 2>&1

:: --- Eliminar entornos virtuales --------------------------------------------
echo [*] Eliminando entornos virtuales...
if exist "backend\venv" (
    rmdir /s /q "backend\venv" >nul 2>&1 && echo [OK] backend\venv eliminado || echo [!] No se pudo eliminar backend\venv
)
if exist "backend\__pycache__" rmdir /s /q "backend\__pycache__" >nul 2>&1

:: --- Eliminar node_modules --------------------------------------------------
echo [*] Eliminando dependencias Node...
if exist "frontend\node_modules" (
    rmdir /s /q "frontend\node_modules" >nul 2>&1 && echo [OK] frontend\node_modules eliminado || echo [!] No se pudo eliminar frontend\node_modules
)

:: --- Eliminar logs ----------------------------------------------------------
echo [*] Eliminando logs...
del /f "backend.log" >nul 2>&1
del /f "frontend.log" >nul 2>&1
del /f "systurno.log" >nul 2>&1
echo [OK] Logs eliminados

:: --- Resumen -----------------------------------------------------------------
echo.
echo +========================================+
echo |       Desinstalacion Completada        |
echo +========================================+
echo.
echo Lo siguiente queda intacto por si lo necesitas:
echo   - backend/.env         (configuracion)
echo   - backend/media/       (imagenes, sliders subidos)
echo   - frontend/dist/       (build del frontend)
echo   - frontend/node_modules (si no se pudo eliminar)
echo   - base de datos SQLite (tickets, etc.)
echo.
echo Para eliminar todo completamente, borra manualmente:
echo   - backend/db.sqlite3
echo   - backend/media/
echo   - frontend/dist/
echo.
pause
