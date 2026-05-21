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
          <div className="flex items-center justify-center min-h-screen bg-bg px-6 py-10">
            <div className="max-w-md w-full rounded-[2rem] border border-border bg-surface p-12 shadow-sm text-center">
              <h1 className="text-6xl font-black text-text mb-4">404</h1>
              <p className="text-text-muted mb-8">La ruta solicitada no existe. Regresa al kiosko para sacar un turno.</p>
              <a href="/kiosko" className="inline-flex rounded-full bg-primary px-8 py-3 text-white font-bold shadow-sm transition hover:bg-[#0ea5c9]">Ir al Kiosko</a>
            </div>
          </div>
        } />
      </Routes>
    </WebSocketProvider>
  )
}

export default App
