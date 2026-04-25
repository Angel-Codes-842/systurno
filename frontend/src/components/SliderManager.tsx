import { useState, useEffect, useRef } from 'react'
import { API_URL, resolveMediaUrl } from '../config/api'
import { Upload, Image as ImageIcon, Video, Trash2, PauseCircle, PlayCircle, Loader2, Tv, Check } from 'lucide-react'
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
      setSliders([])
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadSliders() }, [])

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    if (file.type.startsWith('video/')) setMediaType('VIDEO')
    else if (file.type.startsWith('image/')) setMediaType('IMAGE')
    const reader = new FileReader()
    reader.onloadend = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) handleFileSelect(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !title) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append('title', title)
    formData.append('media_type', mediaType)
    formData.append('duration', duration.toString())
    formData.append(mediaType === 'IMAGE' ? 'image' : 'video', selectedFile)
    formData.append('order', '0')
    formData.append('is_active', 'true')
    try {
      const response = await fetch(`${API_URL}/sliders/`, { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Error subiendo slider')
      resetForm()
      loadSliders()
    } catch {
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
      if (!response.ok) throw new Error('Error eliminando')
      setSliders(sliders.filter(s => s.id !== deleteModal.slider!.id))
    } finally {
      setDeleteModal({ show: false, slider: null })
    }
  }

  const handleToggleActive = async (slider: Slider) => {
    setSliders(sliders.map(s => s.id === slider.id ? { ...s, is_active: !s.is_active } : s))
    try {
      const formData = new FormData()
      formData.append('is_active', (!slider.is_active).toString())
      await fetch(`${API_URL}/sliders/${slider.id}/`, { method: 'PATCH', body: formData })
    } catch {
      loadSliders()
    }
  }

  const getMediaUrl = (slider: Slider) =>
    resolveMediaUrl(
      slider.media_type === 'IMAGE'
        ? slider.image_url || slider.image
        : slider.video_url || slider.video
    )

  return (
    <div className="space-y-6">

      {/* ── Subir Nuevo Medio ── */}
      <section className="rounded-xl border border-[#1e293b] bg-[#131B2C] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1e293b] bg-[#0f1c2e]/40">
          <div className="p-1.5 rounded-lg bg-[#00b4d8]/20">
            <Upload className="w-4 h-4 text-[#00b4d8]" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Subir Nuevo Medio</h3>
            <p className="text-xs text-[#64748b]">Aparecerá en los televisores de la sala de espera</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-[240px_1fr] gap-6 items-start">

              {/* Zona upload */}
              <div>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                {!previewUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center h-44 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                      isDragging ? 'border-[#00b4d8] bg-[#00b4d8]/10' : 'border-[#1e293b] hover:border-[#00b4d8]/50 hover:bg-[#0f1c2e]/50'
                    }`}
                  >
                    <div className="p-3 rounded-full bg-[#00b4d8]/10 mb-3">
                      <Upload className="w-6 h-6 text-[#00b4d8]" />
                    </div>
                    <p className="text-sm font-medium text-white">Cargar Archivo</p>
                    <p className="text-xs text-[#64748b] mt-1">JPG, PNG o MP4</p>
                  </div>
                ) : (
                  <div className="relative h-44 rounded-xl overflow-hidden bg-black border border-[#1e293b]">
                    {mediaType === 'IMAGE'
                      ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      : <video src={previewUrl} className="w-full h-full object-cover" />
                    }
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null) }}
                      className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-lg hover:bg-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Campos */}
              <div className="flex flex-col gap-4">
                {/* Título */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Título Referencia</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Recomendaciones Vacunación"
                    required
                    className="w-full px-3 py-2.5 bg-[#0f1c2e] border border-[#1e293b] rounded-lg text-white placeholder-[#475569] focus:outline-none focus:border-[#00b4d8]/50 text-sm"
                  />
                </div>

                {/* Formato + Duración */}
                <div className="flex items-end gap-4">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Formato Visual</label>
                    <div className="relative">
                      <select
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value as 'IMAGE' | 'VIDEO')}
                        className="w-full px-3 py-2.5 bg-[#0f1c2e] border border-[#1e293b] rounded-lg text-white focus:outline-none focus:border-[#00b4d8]/50 text-sm appearance-none cursor-pointer pr-8"
                      >
                        <option value="IMAGE">Imagen (Fija)</option>
                        <option value="VIDEO">Video (Reproducible)</option>
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748b]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {mediaType === 'IMAGE' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Duración (segundos)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={3600}
                          value={duration}
                          onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-24 px-3 py-2.5 bg-[#0f1c2e] border border-[#1e293b] rounded-lg text-white focus:outline-none focus:border-[#00b4d8]/50 text-sm font-mono text-center"
                        />
                        <span className="text-sm text-[#64748b]">seg</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div className="flex items-center justify-end gap-3 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={resetForm}
                    disabled={!selectedFile && !title}
                  >
                    Limpiar Todo
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isUploading || !selectedFile || !title}
                  >
                    {isUploading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando</>
                      : <><Check className="w-4 h-4" /> Publicar en TV</>
                    }
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ── Modo TV Live ── */}
      <section className="rounded-xl border border-[#1e293b] bg-[#131B2C] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b] bg-[#0f1c2e]/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#0ea5e9]/20">
              <Tv className="w-4 h-4 text-[#0ea5e9]" />
            </div>
            <h3 className="font-semibold text-white text-sm">Modo TV Live</h3>
          </div>
          <span className="text-xs font-medium text-[#94a3b8] bg-[#1e293b] px-2.5 py-1 rounded-full">
            {sliders.length} elementos
          </span>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#00b4d8] animate-spin mb-3" />
              <p className="text-sm text-[#64748b]">Sincronizando con televisores...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 text-red-400 gap-3">
              <p className="text-sm font-medium">{error}</p>
              <button onClick={loadSliders} className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs transition-all">
                Reintentar
              </button>
            </div>
          ) : sliders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-[#1e293b]/50 mb-4">
                <ImageIcon className="w-10 h-10 text-[#64748b]/30" />
              </div>
              <h4 className="text-base font-semibold text-white mb-1">No hay contenido</h4>
              <p className="text-sm text-[#64748b] max-w-xs">
                Cargue archivos multimedia para alimentar las pantallas de la sala de espera.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {sliders.map((slider) => (
                <div
                  key={slider.id}
                  className={`group flex flex-col rounded-xl border overflow-hidden transition-all ${
                    slider.is_active ? 'border-[#1e293b] hover:border-[#00b4d8]/30' : 'border-[#1e293b] opacity-60'
                  } bg-[#0f1c2e]`}
                >
                  <div className="relative w-full aspect-video bg-[#1e293b]">
                    {slider.media_type === 'IMAGE'
                      ? <img src={getMediaUrl(slider)} alt={slider.title} className="w-full h-full object-cover" />
                      : <video src={getMediaUrl(slider)} className="w-full h-full object-cover" muted />
                    }
                    <div className="absolute top-2 right-2">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-white ${
                        slider.is_active ? 'bg-[#22c55e]/80' : 'bg-[#334155]/80'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full bg-white ${slider.is_active ? 'animate-pulse' : ''}`} />
                        {slider.is_active ? 'En TV' : 'Apagado'}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className="flex items-center gap-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px]">
                        {slider.media_type === 'IMAGE' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                        {slider.duration}s
                      </span>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    <div>
                      <p className="font-medium text-white text-sm truncate">{slider.title}</p>
                      <p className="text-[10px] text-[#64748b]">{new Date(slider.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleToggleActive(slider)}
                        className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          slider.is_active
                            ? 'border-[#1e293b] text-[#94a3b8] hover:bg-[#1e293b]'
                            : 'border-[#22c55e]/30 text-[#22c55e] bg-[#22c55e]/10 hover:bg-[#22c55e]/20'
                        }`}
                      >
                        {slider.is_active ? <><PauseCircle className="w-3.5 h-3.5" /> Apagar</> : <><PlayCircle className="w-3.5 h-3.5" /> Activar</>}
                      </button>
                      <button
                        onClick={() => setDeleteModal({ show: true, slider })}
                        className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Borrar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal eliminar */}
      {deleteModal.show && deleteModal.slider && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131B2C] border border-[#1e293b] rounded-2xl shadow-2xl max-w-sm w-full p-7 text-center">
            <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">¿Eliminar Contenido?</h3>
            <p className="text-sm text-[#64748b] mb-6">
              Se borrará <span className="font-semibold text-white">"{deleteModal.slider.title}"</span> permanentemente.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={handleDelete} className="w-full py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-all">
                Borrar Definitivamente
              </button>
              <button onClick={() => setDeleteModal({ show: false, slider: null })} className="w-full py-2.5 rounded-lg border border-[#1e293b] text-[#94a3b8] hover:bg-[#1e293b] text-sm font-medium transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
