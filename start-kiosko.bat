@echo off
setlocal enabledelayedexpansion

REM -----------------------------------------------------------------------------
REM  start-kiosko.bat
REM  Abre Chrome (o Edge) en modo kiosko apuntando al totem de turnos.
REM -----------------------------------------------------------------------------

set ROUTE=/kiosk
set CONFIG_FILE=kiosk-config.bat

:: 1. Comprobar si se pasaron argumentos (tienen prioridad para pruebas)
if not "%1"=="" (
    set SERVER_IP=%1
    if not "%2"=="" (
        set PORT=%2
    ) else (
        set PORT=3000
    )
    echo [INFO] Usando valores pasados por linea de comandos.
) else (
    :: 2. Si no hay argumentos, buscar el archivo de configuracion guardado
    if exist "%CONFIG_FILE%" (
        call "%CONFIG_FILE%"
        echo [OK] Configuracion cargada desde %CONFIG_FILE%
    ) else (
        echo --------------------------------------------------
        echo Configurando Kiosko por primera vez...
        echo --------------------------------------------------
        
        set /p USER_IP="Ingrese la IP del servidor (ej: 192.168.1.100): "
        set /p USER_PORT="Ingrese el puerto (presione Enter para usar 3000): "
        
        if "!USER_IP!"=="" (
            echo [ERROR] La IP del servidor es obligatoria.
            pause
            exit /b 1
        )
        if "!USER_PORT!"=="" set USER_PORT=3000
        
        :: Limpiar comillas si las hay
        set USER_IP=!USER_IP:"=!
        set USER_PORT=!USER_PORT:"=!
        
        :: Guardar configuracion
        echo set SERVER_IP=!USER_IP!> "%CONFIG_FILE%"
        echo set PORT=!USER_PORT!>> "%CONFIG_FILE%"
        
        set SERVER_IP=!USER_IP!
        set PORT=!USER_PORT!
        
        echo.
        echo [OK] Configuracion guardada en %CONFIG_FILE%
        echo Si necesitas cambiar la IP o el puerto, simplemente elimina ese archivo.
        echo.
        timeout /t 3 /nobreak >nul
    )
)

if not defined SERVER_IP (
    echo [ERROR] No se ha definido la IP del servidor.
    pause
    exit /b 1
)

if not defined PORT (
    set PORT=3000
)

set URL=http://%SERVER_IP%:%PORT%%ROUTE%
echo Abriendo kiosko en: %URL%

REM Cerrar instancias previas de Firefox
taskkill /F /IM firefox.exe >nul 2>&1
timeout /t 1 /nobreak >nul

REM Buscar Firefox e iniciar en modo kiosko
if exist "C:\Program Files\Mozilla Firefox\firefox.exe" (
    start "" "C:\Program Files\Mozilla Firefox\firefox.exe" --kiosk "%URL%"
    exit
)
if exist "C:\Program Files (x86)\Mozilla Firefox\firefox.exe" (
    start "" "C:\Program Files (x86)\Mozilla Firefox\firefox.exe" --kiosk "%URL%"
    exit
)

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
