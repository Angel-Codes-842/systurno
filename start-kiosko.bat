@echo off
REM -----------------------------------------------------------------------------
REM  start-kiosko.bat
REM  Abre Chrome (o Edge) en modo kiosko apuntando al totem de turnos.
REM
REM  USO:
REM    start-kiosko.bat [IP] [puerto]
REM      IP     - IP del servidor (opcional, detecta automaticamente)
REM      puerto - Puerto (opcional, default 8000 si es produccion, 3000 si es dev)
REM
REM  EJEMPLOS:
REM    start-kiosko.bat                    - auto detecta IP, puerto 8000 (produccion)
REM    start-kiosko.bat 192.168.0.23       - forza IP, puerto 8000
REM    start-kiosko.bat 192.168.0.23 3000  - forza IP y puerto 3000 (Vite dev)
REM -----------------------------------------------------------------------------

set PORT=8000
set ROUTE=/kiosk

REM Usar IP pasada como argumento, sino detectar automaticamente
if not "%1"=="" (
    set SERVER_IP=%1
) else (
    if not defined SERVER_IP (
        for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1" ^| findstr /v "169.254"') do (
            for /f "tokens=1" %%b in ("%%a") do (
                if not defined SERVER_IP set SERVER_IP=%%b
            )
        )
    )
)

if not "%2"=="" set PORT=%2

if not defined SERVER_IP (
    echo [ERROR] No se pudo detectar la IP del servidor.
    echo Edita este archivo y descomenta la linea: set SERVER_IP=TU_IP
    pause
    exit /b 1
)

set URL=http://%SERVER_IP%:%PORT%%ROUTE%
echo Abriendo kiosko en: %URL%

REM Cerrar instancias previas de Chrome
taskkill /F /IM chrome.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Buscar Chrome e iniciar en modo kiosko con impresion silenciosa
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

REM Edge como alternativa si no hay Chrome
taskkill /F /IM msedge.exe >nul 2>&1
timeout /t 2 /nobreak >nul
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk --kiosk-printing %URL%
    exit
)
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --kiosk --kiosk-printing %URL%
    exit
)

echo [ERROR] No se encontro Chrome ni Edge.
echo Instala Chrome desde: https://www.google.com/chrome/
pause
