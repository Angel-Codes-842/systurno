import React from 'react'
import { Clock, Users, ArrowRight, Volume2, CheckCircle2, Bell, Check, XCircle } from 'lucide-react'
import type { Ticket } from '../../types'
import { Button } from '../ui/Button'

interface PanelLlamadosProps {
  waitingTickets: Ticket[]
  calledTickets: Ticket[]
  handleCallTicket: (id: number) => void
  handleAttendTicket: (id: number) => void
  handleCancelTicket: (id: number) => void
  handleRecallTicket: (id: number) => void
}

export const PanelLlamados: React.FC<PanelLlamadosProps> = ({
  waitingTickets,
  calledTickets,
  handleCallTicket,
  handleAttendTicket,
  handleCancelTicket,
  handleRecallTicket
}) => {
  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wide">Panel de Control de Filas</h2>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* En Espera Modern List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10"></div>
          
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-inner">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              Fila de Espera
            </h3>
            <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              {waitingTickets.length} turnos
            </span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1 relative z-10">
            {waitingTickets.length === 0 ? (
              <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <Users className="w-16 h-16 mb-4 xl:w-20 xl:h-20 opacity-20 text-amber-500" />
                <p className="text-xl font-bold text-gray-500">No hay fila</p>
                <p className="text-sm text-gray-400 mt-1">La sala de espera está impecable</p>
              </div>
            ) : (
              waitingTickets.map((ticket, index) => {
                // Predictive Colors based on Service Type
                const isResults = ticket.service_type === 'RESULTS';
                const isAnalysis = ticket.service_type === 'ANALYSIS';
                
                const cardColorClasses = index === 0 
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-md hover:shadow-lg'
                  : isResults ? 'bg-emerald-50/30 border border-emerald-100 hover:bg-emerald-50'
                  : isAnalysis ? 'bg-blue-50/30 border border-blue-100 hover:bg-blue-50'
                  : 'bg-white border border-gray-100 shadow-sm hover:border-gray-200 hover:bg-gray-50';

                const iconColorClasses = index === 0
                  ? 'bg-amber-500 text-white shadow-[0_4px_15px_rgba(245,158,11,0.4)]'
                  : isResults ? 'bg-emerald-100/80 text-emerald-700 border border-emerald-200'
                  : isAnalysis ? 'bg-blue-100/80 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200';

                const badgeColorClasses = isResults ? 'text-emerald-700 bg-emerald-100 border-emerald-200'
                  : isAnalysis ? 'text-blue-700 bg-blue-100 border-blue-200'
                  : 'text-gray-600 bg-gray-100 border-gray-200';

                return (
                  <div
                    key={ticket.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl transition-all ${cardColorClasses}`}
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl shrink-0 ${iconColorClasses}`}>
                        <span className="text-2xl font-black tracking-tighter">{ticket.ticket_number}</span>
                      </div>
                      
                      <div className="flex flex-col flex-1">
                        {index === 0 ? (
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase tracking-widest bg-amber-100/50 px-2 py-0.5 rounded-md">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ring-2 ring-amber-500/30"></span>
                              Siguiente
                            </span>
                            {ticket.service_type_display && (
                              <span className={`text-xs font-bold border px-2 py-0.5 rounded-md ${badgeColorClasses}`}>
                                {ticket.service_type_display}
                              </span>
                            )}
                          </div>
                        ) : (
                          ticket.service_type_display && (
                            <div className="mb-1.5">
                              <span className={`text-xs font-bold border px-2 py-0.5 rounded-md ${badgeColorClasses}`}>
                                {ticket.service_type_display}
                              </span>
                            </div>
                          )
                        )}
                        
                        <span className={`text-sm flex items-center gap-2 font-medium ${index === 0 ? 'text-amber-800' : 'text-gray-500'}`}>
                          <Clock className="w-4 h-4 opacity-70" />
                          Llegó: {new Date(ticket.created_at).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleCallTicket(ticket.id)}
                      variant={index === 0 ? 'primary' : 'secondary'}
                    >
                      Llamar
                      {index === 0 && <ArrowRight className="w-4 h-4 ml-1" />}
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Llamados Modern List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
          
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-inner">
                <Volume2 className="w-5 h-5 text-blue-600" />
              </div>
              Atención Activa
            </h3>
            <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              {calledTickets.length} llamando
            </span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1 relative z-10">
            {calledTickets.length === 0 ? (
              <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <CheckCircle2 className="w-16 h-16 mb-4 xl:w-20 xl:h-20 opacity-20 text-blue-500" />
                <p className="text-xl font-bold text-gray-500">Ningún llamado activo</p>
                <p className="text-sm text-gray-400 mt-1">Llama a un paciente para comenzar</p>
              </div>
            ) : (
              calledTickets.map((ticket) => (
                <div key={ticket.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-100/50 hover:border-blue-200 transition-all shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="flex bg-white text-blue-700 border-2 border-blue-200 px-6 py-4 rounded-2xl items-center justify-center font-black text-3xl tracking-tight shadow-sm">
                      {ticket.ticket_number}
                    </div>
                    <div className="flex flex-col justify-center gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-blue-900 bg-blue-100/50 w-fit px-2 py-0.5 rounded uppercase tracking-wider">
                          Llamando
                        </p>
                        {ticket.service_type_display && (
                          <p className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 w-fit px-2 py-0.5 rounded">
                            {ticket.service_type_display}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-blue-700/80 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {ticket.called_at && new Date(ticket.called_at).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
                    <Button
                      onClick={() => handleCancelTicket(ticket.id)}
                      variant="danger"
                      title="Marcar como Ausente (Cancelar)"
                      className="px-3"
                    >
                      <XCircle className="w-4 h-4" />
                      Ausente
                    </Button>
                    <Button
                      onClick={() => handleRecallTicket(ticket.id)}
                      variant="warning_outline"
                      title="Volver a llamar al paciente en la TV"
                    >
                      <Bell className="w-4 h-4" />
                      Re-Llamar
                    </Button>
                    <Button
                      onClick={() => handleAttendTicket(ticket.id)}
                      variant="success"
                      title="Marcar como Atendido Exitosamente (Enter)"
                    >
                      <Check className="w-4 h-4 -ml-1" />
                      Atendido
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </>
  )
}
