import React from 'react'
import { Users, Clock, Volume2, CheckCircle2 } from 'lucide-react'

interface StatsResumenProps {
  total: number
  waiting: number
  called: number
  attended: number
}

export const StatsResumen: React.FC<StatsResumenProps> = ({ total, waiting, called, attended }) => {
  return (
    <>
      {/* SECCIÓN: RESUMEN DE LA JORNADA */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wide">Resumen Operativo</h2>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      {/* Stats Modern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-center group hover:shadow-lg transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 shrink-0 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600 group-hover:scale-110 transition-all">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Hoy</p>
              <p className="text-4xl font-black text-gray-800 tracking-tight leading-none">{total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-amber-100 flex flex-col justify-center group hover:shadow-lg transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 shrink-0 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 group-hover:bg-amber-100 group-hover:scale-110 transition-all">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">En Espera</p>
              <p className="text-4xl font-black text-amber-500 tracking-tight leading-none">{waiting}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-blue-100 flex flex-col justify-center group hover:shadow-lg transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 shrink-0 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 group-hover:scale-110 transition-all">
              <Volume2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Llamados</p>
              <p className="text-4xl font-black text-blue-500 tracking-tight leading-none">{called}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-[#6b9b37]/20 flex flex-col justify-center group hover:shadow-lg transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#6b9b37]/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 shrink-0 rounded-xl bg-[#6b9b37]/10 flex items-center justify-center text-[#6b9b37] group-hover:bg-[#6b9b37]/20 group-hover:scale-110 transition-all border border-[#6b9b37]/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-bold text-[#6b9b37] uppercase tracking-widest mb-1">Atendidos</p>
              <p className="text-4xl font-black text-[#6b9b37] tracking-tight leading-none">{attended}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
