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
  const modalCancelRef = useRef<HTMLButtonElement>(null)

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

  // Focus trap for modal
  useEffect(() => {
    if (deleteModal.show) modalCancelRef.current?.focus()
  }, [deleteModal.show])

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
      <section aria-labelledby="upload-heading" className="rounded-xl border border-[#1e293b] bg-[#131B2C] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1e293b] bg-[#0f1c2e]/40">
          <div className="p-1.5 rounded-lg bg-[#00b4d8]/20" aria-hidden="true">
            <Upload className="w-4 h-4 text-[#00b4d8]" aria-hidden="true" />
          </div>
          <div>
            <h3 id="upload-heading" className="font-semibold text-white text-sm">Subir Nuevo Medio</h3>
            <p className="text-xs text-[#64748b]">Aparecerá en los televisores de la sala de espera</p>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-[240px_1fr] gap-6 items-start">

              {/* Zona upload */}
              <div>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Seleccionar archivo de imagen o video"
                />
                {!previewUrl ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    aria-label="Cargar archivo de imagen o video"
                    className={`w-full flex flex-col items-center justify-center h-44 rounded-xl border-2 border-dashed cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b4d8] ${
                      isDragging ? 'border-[#00b4d8] bg-[#00b4d8]/10' : 'border-[#1e293b] hover:border-[#00b4d8]/50 hover:bg-[#0f1c2e]/50'
                    }`}
                  >
                    <div className="p-3 rounded-full bg-[#00b4d8]/10 mb-3">
                      <Upload className="w-6 h-6 text-[#00b4d8]" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-medium text-white">Cargar Archivo</p>
                    <p className="text-xs text-[#64748b] mt-1">Cualquier imagen o video</p>
                  </button>
                ) : (
                  <div className="relative h-44 rounded-xl overflow-hidden bg-black border border-[#1e293b]">
                    {mediaType === 'IMAGE'
                      ? <img src={previewUrl} alt="Vista previa del archivo seleccionado" width={240} height={176} className="w-full h-full object-cover" />
                      : <video src={previewUrl} aria-label="Vista previa del video seleccionado" className="w-full h-full object-cover" />
                    }
                    <button
                      type="button"
                      aria-label="Quitar archivo seleccionado"
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null) }}
                      className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-lg hover:bg-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              {/* Campos */}
              <div className="flex flex-col gap-4">
                {/* Título */}
                <div className="space-y-1.5">
                  <label htmlFor="slider-title" className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
                    Título Referencia
                  </label>
                  <input
                    id="slider-title"
                    name="title"
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Recomendaciones Vacunación…"
                    required
                    className="w-full px-3 py-2.5 bg-[#0f1c2e] border border-[#1e293b] rounded-lg text-white placeholder-[#475569] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b4d8] focus-visible:border-[#00b4d8]/50 text-sm transition-colors"
                  />
                </div>

                {/* Formato + Duración */}
                <div className="flex items-end gap-4">
                  <div className="flex-1 space-y-1.5">
                    <label htmlFor="slider-format" className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
                      Formato Visual
                    </label>
                    <div className="relative">
                      <select
                        id="slider-format"
                        name="media_type"
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value as 'IMAGE' | 'VIDEO')}
                        className="w-full px-3 py-2.5 bg-[#0f1c2e] border border-[#1e293b] rounded-lg text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b4d8] text-sm appearance-none cursor-pointer pr-8 transition-colors"
                      >
                        <option value="IMAGE">Imagen (Fija)</option>
                        <option value="VIDEO">Video (Reproducible)</option>
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748b]" aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {mediaType === 'IMAGE' && (
                    <div className="space-y-1.5">
                      <label htmlFor="slider-duration" className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
                        Duración (seg)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="slider-duration"
                          name="duration"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={3600}
                          value={duration}
                          onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-24 px-3 py-2.5 bg-[#0f1c2e] border border-[#1e293b] rounded-lg text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b4d8] text-sm font-mono text-center transition-colors"
                        />
                        <span className="text-sm text-[#64748b]" aria-hidden="true">seg</span>
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
                    aria-busy={isUploading}
                  >
                    {isUploading
                      ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Procesando…</>
                      : <><Check className="w-4 h-4" aria-hidden="true" /> Publicar en TV</>
                    }
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ── Modo TV Live ── */}
      <section aria-labelledby="tv-heading" className="rounded-xl border border-[#1e293b] bg-[#131B2C] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b] bg-[#0f1c2e]/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#0ea5e9]/20" aria-hidden="true">
              <Tv className="w-4 h-4 text-[#0ea5e9]" aria-hidden="true" />
            </div>
            <h3 id="tv-heading" className="font-semibold text-white text-sm">Modo TV Live</h3>
          </div>
          <span className="text-xs font-medium text-[#94a3b8] bg-[#1e293b] px-2.5 py-1 rounded-full" aria-live="polite">
            {sliders.length} elementos
          </span>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16" role="status" aria-label="Cargando sliders">
              <Loader2 className="w-8 h-8 text-[#00b4d8] animate-spin mb-3" aria-hidden="true" />
              <p className="text-sm text-[#64748b]">Sincronizando con televisores…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 text-red-400 gap-3" role="alert">
              <p className="text-sm font-medium">{error}</p>
              <button
                onClick={loadSliders}
                className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                Reintentar
              </button>
            </div>
          ) : sliders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-[#1e293b]/50 mb-4" aria-hidden="true">
                <ImageIcon className="w-10 h-10 text-[#64748b]/30" aria-hidden="true" />
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
                  className={`group flex flex-col rounded-xl border overflow-hidden transition-colors ${
                    slider.is_active ? 'border-[#1e293b] hover:border-[#00b4d8]/30' : 'border-[#1e293b] opacity-60'
                  } bg-[#0f1c2e]`}
                >
                  <div className="relative w-full aspect-video bg-[#1e293b]">
                    {slider.media_type === 'IMAGE'
                      ? <img src={getMediaUrl(slider)} alt={slider.title} width={320} height={180} className="w-full h-full object-cover" loading="lazy" />
                      : <video src={getMediaUrl(slider)} aria-label={slider.title} className="w-full h-full object-cover" muted />
                    }
                    <div className="absolute top-2 right-2" aria-hidden="true">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-white ${
                        slider.is_active ? 'bg-[#22c55e]/80' : 'bg-[#334155]/80'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full bg-white ${slider.is_active ? 'animate-pulse' : ''}`} />
                        {slider.is_active ? 'En TV' : 'Apagado'}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2" aria-hidden="true">
                      <span className="flex items-center gap-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px]">
                        {slider.media_type === 'IMAGE' ? <ImageIcon className="w-3 h-3" aria-hidden="true" /> : <Video className="w-3 h-3" aria-hidden="true" />}
                        {slider.duration}s
                      </span>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    <div>
                      <p className="font-medium text-white text-sm truncate">{slider.title}</p>
                      <p className="text-[10px] text-[#64748b]">
                        <time dateTime={slider.created_at}>{new Date(slider.created_at).toLocaleDateString()}</time>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleToggleActive(slider)}
                        aria-label={slider.is_active ? `Apagar ${slider.title}` : `Activar ${slider.title}`}
                        aria-pressed={slider.is_active}
                        className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b4d8] ${
                          slider.is_active
                            ? 'border-[#1e293b] text-[#94a3b8] hover:bg-[#1e293b]'
                            : 'border-[#22c55e]/30 text-[#22c55e] bg-[#22c55e]/10 hover:bg-[#22c55e]/20'
                        }`}
                      >
                        {slider.is_active
                          ? <><PauseCircle className="w-3.5 h-3.5" aria-hidden="true" /> Apagar</>
                          : <><PlayCircle className="w-3.5 h-3.5" aria-hidden="true" /> Activar</>
                        }
                      </button>
                      <button
                        onClick={() => setDeleteModal({ show: true, slider })}
                        aria-label={`Borrar ${slider.title}`}
                        className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Borrar
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onKeyDown={(e) => e.key === 'Escape' && setDeleteModal({ show: false, slider: null })}
        >
          <div className="bg-[#131B2C] border border-[#1e293b] rounded-2xl shadow-2xl max-w-sm w-full p-7 text-center">
            <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <Trash2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 id="delete-modal-title" className="text-base font-semibold text-white mb-2">¿Eliminar Contenido?</h3>
            <p className="text-sm text-[#64748b] mb-6">
              Se borrará <span className="font-semibold text-white">"{deleteModal.slider.title}"</span> permanentemente.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDelete}
                className="w-full py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                Borrar Definitivamente
              </button>
              <button
                ref={modalCancelRef}
                onClick={() => setDeleteModal({ show: false, slider: null })}
                className="w-full py-2.5 rounded-lg border border-[#1e293b] text-[#94a3b8] hover:bg-[#1e293b] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b4d8]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
