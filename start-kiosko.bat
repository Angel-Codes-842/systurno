@echo off
REM Kiosko con Impresion Silenciosa - Windows
REM Cambia SERVER_IP por la IP del servidor

set SERVER_IP=192.168.0.32
set PORT=3000
set URL=http://%SERVER_IP%:%PORT%/kiosko

REM Cerrar Chrome completamente antes de iniciar
taskkill /F /IM chrome.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Buscar Chrome e iniciar en modo kiosko
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --kiosk-printing %URL%
    exit
)
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --kiosk --kiosk-printing %URL%
    exit
)
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --kiosk --kiosk-printing %URL%
    exit
)

REM Edge como alternativa
taskkill /F /IM msedge.exe >nul 2>&1
timeout /t 2 /nobreak >nul
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk --kiosk-printing %URL%
    exit
)

echo Chrome no encontrado. Instala desde https://www.google.com/chrome/
pause
