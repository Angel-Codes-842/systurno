import { useState, useEffect, useRef } from 'react'
import { API_URL, resolveMediaUrl } from '../config/api'
import { Upload, Image as ImageIcon, Video, Trash2, PauseCircle, PlayCircle, Loader2, Tv, Check, Clock } from 'lucide-react'
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
      <section aria-labelledby="upload-heading" className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-surface-2">
          <div className="p-1.5 rounded-lg bg-primary/20" aria-hidden="true">
            <Upload className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h3 id="upload-heading" className="font-bold text-text text-sm">Subir Nuevo Medio</h3>
            <p className="text-xs text-text-muted font-medium mt-0.5">Aparecerá en los televisores de la sala de espera</p>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">

              {/* Columna Izquierda: Zona upload / Vista Previa = TAMAÑO ESTRICTO */}
              <div className="w-full max-w-[320px] shrink-0 mx-auto lg:mx-0 space-y-2">
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-widest pl-1 lg:pl-0 text-center lg:text-left block">
                  Caja Multimedia
                </label>
                <div className="relative w-[320px] aspect-video rounded-xl border-border bg-surface-2 overflow-hidden flex flex-col items-center justify-center border border-dashed shadow-sm">
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label="Seleccionar archivo"
                  />
                  {!selectedFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`absolute inset-0 flex flex-col items-center justify-center w-full h-full cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isDragging ? 'bg-primary/5 border-2 border-primary' : 'hover:bg-surface border-2 border-transparent hover:border-primary/30'
                        }`}
                    >
                      <div className="p-2.5 rounded-full bg-surface border border-border shadow-sm mb-3">
                        <Upload className="w-5 h-5 text-primary/80" aria-hidden="true" />
                      </div>
                      <p className="text-sm font-bold text-text">Subir Archivo</p>
                      <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest font-bold">JPG, PNG, MP4</p>
                    </button>
                  ) : (
                    <div className="absolute inset-0 w-full h-full group bg-slate-900 border-none">
                      {mediaType === 'IMAGE'
                        ? <img src={previewUrl!} alt="Preview" className="w-full h-full object-cover" />
                        : <video src={previewUrl!} className="w-full h-full object-cover" controls={false} />
                      }
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-white shadow p-[1px] border border-white/10">
                        {mediaType === 'IMAGE' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                        <span className="text-[9px] font-bold tracking-wider uppercase">
                          {mediaType === 'IMAGE' ? 'Imagen' : 'Video'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); setTitle('') }}
                        className="absolute top-2 right-2 p-1.5 rounded bg-black/60 text-white/80 hover:text-white hover:bg-danger/90 border border-white/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Parámetros siempre visibles */}
              <div className="flex-1 flex flex-col gap-6 w-full max-w-2xl mx-auto lg:mx-0 pt-2 lg:pt-0">

                {/* Inputs y Controles en columna limpia */}
                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-6 w-full items-start">

                  {/* Título */}
                  <div className="space-y-2 flex-1 w-full shrink-[2]">
                    <label htmlFor="slider-title" className="text-[11px] font-extrabold text-text-muted uppercase tracking-widest pl-1">
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
                      placeholder="Ej: Promos..."
                      required
                      className="w-full px-5 py-3 hover:bg-surface-2 bg-surface border border-border rounded-xl text-text placeholder-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-[15px] font-medium transition-colors shadow-sm"
                    />
                  </div>

                  {/* Duración */}
                  <div className="w-full sm:w-auto xl:w-auto shrink-0 flex-1">
                    {mediaType === 'IMAGE' ? (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-widest flex items-center gap-1.5 pl-1">
                          <Clock className="w-4 h-4" /> Tiempo visible
                        </label>
                        <div className="flex flex-wrap items-center gap-3">

                          {/* Segmented Control Macizo */}
                          <div className="flex p-1.5 rounded-2xl bg-surface-2 border border-border shadow-inner">
                            {[5, 10, 15, 30].map(secs => (
                              <button
                                key={secs}
                                type="button"
                                onClick={() => setDuration(secs)}
                                className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all duration-200 ${duration === secs
                                    ? 'bg-surface text-primary border border-border shadow-sm scale-100 ring-1 ring-primary/20'
                                    : 'bg-transparent border border-transparent text-text-muted hover:text-text hover:bg-surface/50 scale-95'
                                  }`}
                              >
                                {secs}s
                              </button>
                            ))}
                          </div>

                          {/* Campo Manual */}
                          <div className="flex items-center px-4 py-2 bg-surface border border-border rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary transition-all max-w-[120px]">
                            <input
                              type="number"
                              min={1}
                              max={3600}
                              value={duration}
                              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full bg-transparent text-text focus-visible:outline-none text-[15px] font-black font-mono text-center"
                            />
                            <span className="text-[11px] font-bold text-text-muted uppercase ml-1">seg</span>
                          </div>

                        </div>
                      </div>
                    ) : (
                      // Placeholder visual para vídeo
                      <div className="space-y-2 opacity-50 select-none">
                        <label className="text-[11px] font-extrabold text-transparent uppercase tracking-widest pl-1">.</label>
                        <div className="flex items-center gap-3 h-[52px] px-5 rounded-2xl border-2 border-dashed border-border bg-surface-2 w-full max-w-[240px]">
                          <Video className="w-5 h-5 text-text-muted" />
                          <span className="text-sm font-bold text-text-muted whitespace-nowrap">Duración Auto</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4 pt-5 border-t border-border">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={resetForm}
                    disabled={!selectedFile && !title}
                    className="font-bold text-sm"
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isUploading || !title.trim() || !selectedFile}
                    aria-busy={isUploading}
                    className="font-bold text-sm shadow-sm"
                  >
                    {isUploading
                      ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Subiendo…</>
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
      <section aria-labelledby="tv-heading" className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/20" aria-hidden="true">
              <Tv className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <h3 id="tv-heading" className="font-bold text-text text-sm">Modo TV Live</h3>
          </div>
          <span className="text-xs font-bold text-text-muted bg-surface border border-border px-3 py-1.5 rounded-full" aria-live="polite">
            {sliders.length} elementos
          </span>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16" role="status" aria-label="Cargando sliders">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-text-muted">Sincronizando con televisores…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 text-danger gap-3" role="alert">
              <p className="text-sm font-bold">{error}</p>
              <button
                onClick={loadSliders}
                className="px-4 py-2 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                Reintentar
              </button>
            </div>
          ) : sliders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-xl">
              <div className="p-4 rounded-full bg-surface-2 mb-4 border border-border" aria-hidden="true">
                <ImageIcon className="w-10 h-10 text-text-muted opacity-50" aria-hidden="true" />
              </div>
              <h4 className="text-lg font-bold text-text mb-1">No hay contenido</h4>
              <p className="text-sm font-medium text-text-muted max-w-sm mx-auto">
                Cargue archivos multimedia aquí para alimentar y decorar las pantallas de la sala de espera.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {sliders.map((slider) => (
                <div
                  key={slider.id}
                  className={`group flex flex-col rounded-xl border overflow-hidden transition-all shadow-sm ${slider.is_active ? 'border-border hover:border-primary/50' : 'border-border opacity-70 grayscale-[50%]'
                    } bg-surface`}
                >
                  <div className="relative w-full aspect-video bg-surface-2 border-b border-border">
                    {slider.media_type === 'IMAGE'
                      ? <img src={getMediaUrl(slider)} alt={slider.title} width={320} height={180} className="w-full h-full object-cover" loading="lazy" />
                      : <video src={getMediaUrl(slider)} aria-label={slider.title} className="w-full h-full object-cover" muted />
                    }
                    <div className="absolute top-2 right-2" aria-hidden="true">
                      <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded shadow-sm text-[10px] font-bold text-white ${slider.is_active ? 'bg-success' : 'bg-text-muted'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full bg-white ${slider.is_active ? 'animate-pulse' : ''}`} />
                        {slider.is_active ? 'En TV' : 'Apagado'}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2" aria-hidden="true">
                      <span className="flex items-center gap-1.5 bg-text/80 backdrop-blur-sm text-white px-2 py-0.5 rounded shadow-sm text-[10px] font-medium">
                        {slider.media_type === 'IMAGE' ? <ImageIcon className="w-3 h-3" aria-hidden="true" /> : <Video className="w-3 h-3" aria-hidden="true" />}
                        {slider.duration}s
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <div>
                      <p className="font-bold text-text text-sm truncate">{slider.title}</p>
                      <p className="text-[10px] font-medium text-text-muted mt-0.5">
                        <time dateTime={slider.created_at}>{new Date(slider.created_at).toLocaleDateString()}</time>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        onClick={() => handleToggleActive(slider)}
                        aria-label={slider.is_active ? `Apagar ${slider.title}` : `Activar ${slider.title}`}
                        aria-pressed={slider.is_active}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${slider.is_active
                            ? 'border-border text-text-muted hover:bg-surface-2 hover:text-text'
                            : 'border-success/30 text-success bg-success/10 hover:bg-success/20'
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
                        className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold border border-danger/30 text-danger hover:bg-danger/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
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
          className="fixed inset-0 bg-text/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onKeyDown={(e) => e.key === 'Escape' && setDeleteModal({ show: false, slider: null })}
        >
          <div className="bg-surface border border-border rounded-2xl shadow-xl max-w-sm w-full p-8 text-center animate-fade-in">
            <div className="w-14 h-14 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-5" aria-hidden="true">
              <Trash2 className="w-7 h-7" aria-hidden="true" />
            </div>
            <h3 id="delete-modal-title" className="text-lg font-bold text-text mb-2">¿Eliminar Contenido?</h3>
            <p className="text-sm font-medium text-text-muted mb-8 leading-relaxed">
              Se borrará <span className="font-bold text-text">"{deleteModal.slider.title}"</span> permanentemente del sistema de pantallas.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                className="w-full py-3 rounded-lg bg-danger hover:bg-red-600 text-white text-sm font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                Borrar Definitivamente
              </button>
              <button
                ref={modalCancelRef}
                onClick={() => setDeleteModal({ show: false, slider: null })}
                className="w-full py-3 rounded-lg border border-border text-text hover:bg-surface-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
