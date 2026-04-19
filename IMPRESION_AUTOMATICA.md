# Configuración de Impresión Automática

## El Problema

Los navegadores web modernos no permiten imprimir sin mostrar el diálogo de impresión por razones de seguridad. Sin embargo, hay formas de configurar el sistema para que la impresión sea lo más automática posible.

## Soluciones

### Opción 1: Chrome en Modo Kiosko (Recomendado para producción)

Ejecutar Chrome en modo kiosko permite impresión silenciosa:

```bash
# Linux
google-chrome --kiosk --kiosk-printing --disable-print-preview "http://localhost:3000/kiosko"

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --kiosk-printing --disable-print-preview "http://localhost:3000/kiosko"
```

**Parámetros importantes:**
- `--kiosk`: Modo pantalla completa sin barras
- `--kiosk-printing`: Impresión automática sin diálogo
- `--disable-print-preview`: Desactiva la vista previa

### Opción 2: Configurar Impresora por Defecto

1. **En Linux:**
   ```bash
   # Ver impresoras disponibles
   lpstat -p -d
   
   # Establecer impresora por defecto
   lpoptions -d nombre_impresora
   ```

2. **En Windows:**
   - Panel de Control → Dispositivos e Impresoras
   - Click derecho en la impresora → Establecer como predeterminada

### Opción 3: Crear Script de Inicio

Crear un script que inicie Chrome en modo kiosko:

**Linux (start-kiosko.sh):**
```bash
#!/bin/bash
google-chrome \
  --kiosk \
  --kiosk-printing \
  --disable-print-preview \
  --disable-session-crashed-bubble \
  --disable-infobars \
  --noerrdialogs \
  --disable-translate \
  --no-first-run \
  --fast \
  --fast-start \
  --disable-features=TranslateUI \
  "http://localhost:3000/kiosko"
```

**Windows (start-kiosko.bat):**
```batch
@echo off
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --kiosk ^
  --kiosk-printing ^
  --disable-print-preview ^
  --disable-session-crashed-bubble ^
  --disable-infobars ^
  --noerrdialogs ^
  "http://localhost:3000/kiosko"
```

### Opción 4: Usar Chromium con Configuración Especial

```bash
chromium-browser \
  --kiosk \
  --kiosk-printing \
  --disable-print-preview \
  --disable-gpu \
  "http://localhost:3000/kiosko"
```

## Configuración de la Impresora Térmica

### Para impresoras de tickets (80mm):

1. **Instalar drivers de la impresora**

2. **Configurar tamaño de papel:**
   - Ancho: 80mm
   - Alto: Automático o 200mm

3. **En CUPS (Linux):**
   ```bash
   # Agregar impresora
   lpadmin -p ticket_printer -E -v usb://... -m everywhere
   
   # Configurar opciones
   lpoptions -p ticket_printer -o media=Custom.80x200mm
   ```

## Flujo de Impresión Actual

1. Usuario toca "Obtener Turno"
2. Se genera el ticket en el backend
3. Se muestra el ticket en pantalla
4. Automáticamente se envía a imprimir (0.5s después)
5. El diálogo de impresión aparece (a menos que esté en modo kiosko)
6. Usuario confirma impresión
7. Después de 15 segundos, vuelve a la pantalla inicial

## Notas Importantes

- **Seguridad:** Los navegadores requieren interacción del usuario para imprimir por seguridad
- **Modo Kiosko:** Es la única forma de lograr impresión 100% automática
- **Impresora por defecto:** Asegúrate de que la impresora de tickets esté configurada como predeterminada
- **Pruebas:** Siempre prueba la impresión antes de poner en producción

## Solución de Problemas

### La impresión no funciona:
1. Verificar que la impresora esté encendida y conectada
2. Verificar que sea la impresora por defecto
3. Probar imprimir desde otra aplicación

### El diálogo sigue apareciendo:
1. Asegurarse de usar Chrome con `--kiosk-printing`
2. Verificar que no haya extensiones bloqueando

### El ticket sale cortado:
1. Ajustar el tamaño de papel en la configuración de la impresora
2. Modificar el CSS de impresión en el código

## Código Relevante

El código de impresión está en:
`frontend/src/pages/kiosko/components/KioskoTicket.tsx`

La función `handlePrint()` genera el HTML del ticket y lo envía a imprimir usando un iframe oculto.
