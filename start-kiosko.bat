@echo off
REM Kiosko con Impresion Silenciosa - Windows
REM La IP del servidor se detecta automaticamente.
REM Si quieres forzar una IP fija, descomenta la siguiente linea y edita el valor:
REM set SERVER_IP=192.168.0.32

set PORT=3000

REM Detectar IP local automaticamente (primera IPv4 que no sea loopback ni APIPA)
if not defined SERVER_IP (
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1" ^| findstr /v "169.254"') do (
        for /f "tokens=1" %%b in ("%%a") do (
            if not defined SERVER_IP set SERVER_IP=%%b
        )
    )
)

if not defined SERVER_IP (
    echo [ERROR] No se pudo detectar la IP del servidor.
    echo Edita este archivo y descomenta la linea: set SERVER_IP=TU_IP
    pause
    exit /b 1
)

set URL=http://%SERVER_IP%:%PORT%/kiosko
echo Conectando a: %URL%

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
