import { useState, useEffect, useRef } from 'react'
import { API_URL } from '../config/api'
import { Image as ImageIcon, Video, UploadCloud, Trash2, Power, PauseCircle, PlayCircle, Loader2, MonitorPlay, Check } from 'lucide-react'
import { Button } from './ui/Button'

interface Slider {
  id: number
  title: string
  media_type: 'IMAGE' | 'VIDEO'
  media_type_display: string
  image?: string | null
  image_url: string | null
  video?: string | null
  video_url: string | null
  duration: number
  order: number
  is_active: boolean
  created_at: string
}

export default function SliderManager() {
  const [sliders, setSliders] = useState<Slider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE')
  const [duration, setDuration] = useState(10)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; slider: Slider | null }>({ show: false, slider: null })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadSliders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`${API_URL}/sliders/`)
      if (!response.ok) throw new Error(`Error ${response.status}`)
      const data = await response.json()
      
      if (data && typeof data === 'object' && 'results' in data) {
        setSliders(Array.isArray(data.results) ? data.results : [])
      } else if (Array.isArray(data)) {
        setSliders(data)
      } else {
        setSliders([])
      }
    } catch (err) {
      console.error('Error cargando sliders:', err)
      setSliders([])
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSliders()
  }, [])

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    if (file.type.startsWith('video/')) {
      setMediaType('VIDEO')
    } else if (file.type.startsWith('image/')) {
      setMediaType('IMAGE')
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      handleFileSelect(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !title) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('title', title)
    formData.append('media_type', mediaType)
    formData.append('duration', duration.toString())
    
    if (mediaType === 'IMAGE') {
      formData.append('image', selectedFile)
    } else {
      formData.append('video', selectedFile)
    }
    
    formData.append('order', '0')
    formData.append('is_active', 'true')

    try {
      const response = await fetch(`${API_URL}/sliders/`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) throw new Error('Error subiendo slider')
      
      resetForm()
      loadSliders()
    } catch (err) {
      console.error('Error:', err)
      alert('Error al subir el slider')
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setMediaType('IMAGE')
    setDuration(10)
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleDelete = async () => {
    if (!deleteModal.slider?.id) return
    try {
      const response = await fetch(`${API_URL}/sliders/${deleteModal.slider.id}/`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Error eliminando slider')
      setSliders(sliders.filter(s => s.id !== deleteModal.slider!.id))
      setDeleteModal({ show: false, slider: null })
    } catch (err) {
      console.error('Error:', err)
      setDeleteModal({ show: false, slider: null })
    }
  }

  const handleToggleActive = async (slider: Slider) => {
    const updatedSliders = sliders.map(s => s.id === slider.id ? { ...s, is_active: !s.is_active } : s)
    setSliders(updatedSliders)
    
    try {
      const formData = new FormData()
      formData.append('is_active', (!slider.is_active).toString())
      const response = await fetch(`${API_URL}/sliders/${slider.id}/`, {
        method: 'PATCH',
        body: formData,
      })
      if (!response.ok) throw new Error('Error actualizando slider')
    } catch (err) {
      console.error('Error:', err)
      loadSliders()
    }
  }

  const getMediaUrl = (slider: Slider) => {
    if (slider.media_type === 'IMAGE') {
      return slider.image_url || slider.image || ''
    }
    return slider.video_url || slider.video || ''
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8">
      
      {/* SECCIÓN 1: FORMULARIO ALTA DE CONTENIDO (Compacto y Organizado) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/30 rounded-t-2xl">
          <UploadCloud className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-[17px] font-bold text-gray-900 leading-tight">Subir Nuevo Flyer o Video</h2>
            <p className="text-xs text-gray-500">Aparecerá en los televisores de la sala de espera.</p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 lg:gap-12 items-start">
            
            {/* 1. Área de Archivo (Upload) - Grid Columna Fija */}
            <div className="flex flex-col w-full h-full">
              <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider text-xs">Añadir Medio Visual</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full h-48 sm:h-56 md:h-auto md:aspect-square border-[3px] border-dashed rounded-[24px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 p-6 text-center shadow-sm
                    ${isDragging ? 'border-indigo-400 bg-indigo-50/80 scale-105' : 'border-gray-200 bg-gray-50/50 hover:border-indigo-300 hover:bg-indigo-50/30 hover:scale-[1.02]'}`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-indigo-100' : 'bg-white shadow-sm border border-gray-100'}`}>
                    <UploadCloud className={`w-7 h-7 ${isDragging ? 'text-indigo-600' : 'text-gray-500'}`} />
                  </div>
                  <span className="text-base font-bold text-gray-800">Cargar Archivo</span>
                  <span className="text-[13px] text-gray-500 mt-2 max-w-[140px] leading-snug">Soporta formatos universales JPG o MP4</span>
                </div>
              ) : (
                <div className="relative w-full h-48 sm:h-56 md:h-auto md:aspect-square rounded-[24px] overflow-hidden bg-black border border-gray-200 group shadow-md transition-all duration-300">
                  {mediaType === 'IMAGE' ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <video src={previewUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" controls={false} />
                  )}
                  {/* Botón Flotante para cambiar siempre visible en la esquina */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreviewUrl(null); }}
                    className="absolute top-3 right-3 bg-red-500 text-white p-2.5 rounded-xl shadow-[0_4px_12px_rgba(239,68,68,0.4)] hover:bg-red-600 hover:scale-105 active:scale-95 transition-all backdrop-blur-md"
                    title="Quitar archivo seleccionado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {/* Etiqueta de archivo cargado */}
                  <div className="absolute bottom-3 left-3">
                    <span className="block truncate bg-black/80 font-semibold text-white text-[11px] px-3 py-1.5 rounded-lg shadow-sm border border-white/10">
                      Archivo Listo para TV
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Metadatos (Grid Columna Fluida: 1fr) */}
            <div className="flex flex-col gap-6 pt-2 min-w-0 w-full overflow-hidden">
              
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider text-xs">Título de Referencia Interna</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-[14px] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none text-base transition-all shadow-sm placeholder:text-gray-400 font-medium"
                  placeholder="Ej: Recomendaciones Vacunación Agosto"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider text-xs">Formato Visual</label>
                  <div className="relative">
                    <select
                      value={mediaType}
                      onChange={(e) => setMediaType(e.target.value as 'IMAGE' | 'VIDEO')}
                      className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-[14px] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 appearance-none outline-none text-base font-semibold text-gray-800 shadow-sm cursor-pointer transition-all"
                    >
                      <option value="IMAGE">Imagen Fotográfica (Fija)</option>
                      <option value="VIDEO">Video Multimedia (MP4)</option>
                    </select>
                    {/* Flecha elegante, sin iconos absolutos que pisen el texto */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {mediaType === 'IMAGE' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider text-xs">Duración (Segundos)</label>
                    <div className="relative overflow-hidden rounded-[14px]">
                      <input
                        type="number"
                        min="3"
                        max="300"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none text-base text-gray-800 font-bold shadow-sm transition-all text-center pr-12"
                      />
                      <div className="absolute inset-y-0 right-0 py-3.5 pr-4 flex items-center bg-gray-50/0 pointer-events-none">
                         <span className="text-gray-400 font-medium text-sm">s.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Guardar - Alineado a la derecha, Uiverse premium buttons sin overrides molestos */}
              <div className="mt-auto flex flex-col sm:flex-row items-center justify-end gap-5 pt-8">
                <Button 
                  type="button" 
                  onClick={resetForm}
                  disabled={!selectedFile && !title}
                  className="w-full sm:w-auto px-6 py-2 border-gray-300 text-gray-500 hover:bg-gray-100"
                >
                  Limpiar Todo
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUploading || !selectedFile || !title}
                  className="w-full sm:w-auto !bg-indigo-600 !text-white !border-indigo-600 hover:!bg-gray-900 shadow-md flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                       <Loader2 className="w-5 h-5 animate-spin text-white" /> Procesando
                    </>
                  ) : (
                    <>
                       <Check className="w-5 h-5" /> Publicar en TV
                    </>
                  )}
                </Button>
              </div>
            </div>

          </form>
        </div>
      </div>


      {/* SECCIÓN 2: LISTA DE REPRODUCCIÓN ACTUAL */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 md:px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <MonitorPlay className="w-7 h-7 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Lista de Reproducción Activa</h2>
          </div>
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
            {sliders.length} Elementos
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#1e3a5f] animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Sincronizando con televisores...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-8 flex flex-col items-center justify-center gap-4">
            <p className="font-bold">{error}</p>
            <Button variant="secondary" onClick={loadSliders}>Reintentar</Button>
          </div>
        ) : sliders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No tienes contenido subido</h3>
            <p className="text-gray-500 max-w-sm">Utiliza el formulario de arriba para enviar fotos y videos a las pantallas de la clínica.</p>
          </div>
        ) : (
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {sliders.map((slider) => (
                <div 
                  key={slider.id} 
                  className={`flex flex-col bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all duration-300 ${
                    slider.is_active ? 'border-gray-200 hover:border-[#1e3a5f]/30' : 'border-gray-200 bg-gray-50 opacity-80'
                  }`}
                >
                  {/* Vista Previa Intuitiva */}
                  <div className="relative w-full aspect-video bg-black border-b border-gray-200">
                    {slider.media_type === 'IMAGE' ? (
                      <img src={getMediaUrl(slider)} alt={slider.title} className="w-full h-full object-cover" />
                    ) : (
                      <video src={getMediaUrl(slider)} className="w-full h-full object-cover" muted />
                    )}
                    
                    {/* Status Global siempre visible */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-sm flex items-center gap-1.5 backdrop-blur-sm ${
                        slider.is_active ? 'bg-green-600 border border-green-500' : 'bg-gray-600 border border-gray-500'
                      }`}>
                        <div className={`w-2 h-2 rounded-full bg-white ${slider.is_active ? 'animate-pulse' : ''}`} />
                        {slider.is_active ? 'EN TV' : 'APAGADO'}
                      </span>
                    </div>
                    
                    {/* Badge Formato */}
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-black/70 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1.5 border border-white/20">
                        {slider.media_type === 'IMAGE' ? <ImageIcon className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                        {slider.duration}s
                      </span>
                    </div>
                  </div>

                  {/* Datos Claros y Siempre Visibles */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h4 className="font-bold text-gray-900 text-[16px] line-clamp-1 mb-1" title={slider.title}>
                      {slider.title}
                    </h4>
                    
                    <p className="text-xs font-medium text-gray-400 mb-4">
                      Subido: {new Date(slider.created_at).toLocaleDateString()}
                    </p>

                    {/* Botones Explícitos y Cómodos de Apretar */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Button 
                        onClick={() => handleToggleActive(slider)}
                        variant={slider.is_active ? 'secondary' : 'success'}
                        className={`!px-0 w-full !min-h-[40px] ${slider.is_active ? '!text-gray-600' : '!bg-green-600'}`}
                      >
                        {slider.is_active ? (
                          <><PauseCircle className="w-4 h-4 ml-1" /> Apagar</>
                        ) : (
                          <><PlayCircle className="w-4 h-4 ml-1" /> Activar</>
                        )}
                      </Button>
                      
                      <Button 
                        onClick={() => setDeleteModal({ show: true, slider })}
                        variant="secondary"
                        className="!px-0 w-full !text-red-600 !border-red-200 hover:!bg-red-50 !min-h-[40px]"
                      >
                        <Trash2 className="w-4 h-4" /> Borrar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Intuitivo de Eliminación */}
      {deleteModal.show && deleteModal.slider && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar Contenido?</h3>
            <p className="text-gray-500 mb-8">
              Esta acción borrará el anuncio <br/>
              <span className="font-bold text-gray-800">"{deleteModal.slider.title}"</span><br/>
              y no podrás recuperarlo.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button onClick={handleDelete} variant="primary" className="!bg-red-600 !border-red-600 hover:!bg-red-700 w-full text-base">
                Borrar Definitivamente
              </Button>
              <Button onClick={() => setDeleteModal({ show: false, slider: null })} variant="secondary" className="w-full text-base">
                Cancelar y Volver
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
