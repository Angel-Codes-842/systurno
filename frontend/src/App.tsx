import { Routes, Route, Navigate } from 'react-router-dom'
import { WebSocketProvider } from './contexts/WebSocketContext'

// Layouts
import FullscreenLayout from './layouts/FullscreenLayout'

// Pages
import KioskoPage from './pages/kiosko/KioskoPage'
import SalaEsperaPage from './pages/sala-espera/SalaEsperaPage'
import TicketsPage from './pages/recepcion/TicketsPage'

function App() {
  return (
    <WebSocketProvider>
      <Routes>
        {/* Kiosko - Pantalla para obtener turno */}
        <Route path="/kiosko" element={
          <FullscreenLayout>
            <KioskoPage />
          </FullscreenLayout>
        } />

        {/* Sala de Espera - Pantalla de llamados */}
        <Route path="/sala-espera" element={
          <FullscreenLayout>
            <SalaEsperaPage />
          </FullscreenLayout>
        } />

        {/* Gestión de Turnos - Panel de recepción */}
        <Route path="/turnos" element={<TicketsPage />} />

        {/* Redirect root to kiosko */}
        <Route path="/" element={<Navigate to="/kiosko" replace />} />
        
        {/* 404 */}
        <Route path="*" element={
          <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
              <p className="text-gray-500 mb-6">Página no encontrada</p>
              <a href="/kiosko" className="text-teal-600 hover:underline">Ir al Kiosko</a>
            </div>
          </div>
        } />
      </Routes>
    </WebSocketProvider>
  )
}

export default App
