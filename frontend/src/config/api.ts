// Configuración dinámica de API - detecta automáticamente el host
// Funciona sin importar la IP o si hay internet

const getBaseUrl = () => {
  const host = window.location.hostname
  const port = window.location.port
  const protocol = window.location.protocol
  
  // Producción (Nginx en puerto 80/443) - API en mismo host sin puerto específico
  if (!port || port === '80' || port === '443') {
    return `${protocol}//${host}/api`
  }
  
  // Desarrollo - Frontend en 3000, Backend en 8000
  return `${protocol}//${host}:8000/api`
}

const getWsUrl = () => {
  const host = window.location.hostname
  const port = window.location.port
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  
  // Producción (Nginx en puerto 80/443)
  if (!port || port === '80' || port === '443') {
    return `${wsProtocol}//${host}/ws`
  }
  
  // Desarrollo - WebSocket en puerto 8000
  return `${wsProtocol}//${host}:8000/ws`
}

export const API_URL = getBaseUrl()
export const WS_URL = getWsUrl()

// Para debug
console.log('API Config:', { API_URL, WS_URL, host: window.location.hostname })
