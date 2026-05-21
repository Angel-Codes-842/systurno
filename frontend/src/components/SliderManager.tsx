import { useState, useEffect, useRef } from 'react'
import { API_URL, resolveMediaUrl } from '../config/api'
import { Upload, Image as ImageIcon, Video, Trash2, PauseCircle, PlayCircle, Loader2, Tv } from 'lucide-react'
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
    <div className="space-y-8">

      {/* ── Subir Nuevo Medio ── */}
      <section className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="flex items-center gap-4 px-7 py-5 border-b border-border bg-surface-2/70">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-text text-sm uppercase tracking-wider">SUBIR NUEVO MEDIO</h3>
            <p className="text-[10px] text-text-muted font-bold mt-0.5 uppercase tracking-widest">Aparecerá en los televisores de la sala de espera</p>
          </div>
        </div>

        <div className="p-7">
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col lg:flex-row gap-10 items-start">

              <div className="w-full max-w-[380px] shrink-0 mx-auto lg:mx-0">
                <div
                  className={`relative w-full aspect-video rounded-xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-all ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-border-2 bg-surface-2/50 hover:border-primary/40'
                  }`}
                >
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
                      className="absolute inset-0 flex flex-col items-center justify-center w-full h-full cursor-pointer"
                    >
                      <div className="p-4 rounded-full bg-surface border border-border shadow-sm mb-4">
                        <Upload className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-xs font-black text-text uppercase tracking-widest">Subir archivo</p>
                      <p className="text-[10px] text-text-muted mt-1.5 uppercase tracking-widest font-bold opacity-60">JPG, PNG, MP4 &bull; o arrastrar aquí</p>
                    </button>
                  ) : (
                    <div className="absolute inset-0 w-full h-full group bg-slate-900">
                      {mediaType === 'IMAGE'
                        ? <img src={previewUrl!} alt="Preview" className="w-full h-full object-cover" />
                        : <video src={previewUrl!} className="w-full h-full object-cover" controls={false} />
                      }
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); setTitle('') }}
                        className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-canceled"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-8 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <label htmlFor="slider-title" className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">
                      TÍTULO REFERENCIA
                    </label>
                    <input
                      id="slider-title"
                      name="title"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Promos enero..."
                      required
                      className="w-full px-5 py-3.5 bg-surface border border-border-2 rounded-xl text-text placeholder:text-text-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-sm font-bold transition-all shadow-sm"
                    />
                    <p className="text-[10px] text-text-muted/40 font-bold uppercase tracking-widest pl-1">Identificador interno para el medio</p>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">
                      TIEMPO VISIBLE
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {[5, 10, 15, 30].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDuration(t)}
                          aria-pressed={duration === t}
                          className={`px-5 py-2.5 rounded-lg text-xs font-black transition-all border cursor-pointer select-none ${
                            duration === t 
                              ? 'bg-primary text-white border-primary shadow-sm' 
                              : 'bg-surface-2 text-text-muted border-border hover:bg-surface-2/80'
                          }`}
                        >
                          {t}s
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-text-muted/40 font-bold uppercase tracking-widest pl-1">{duration} segundos por slide</p>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 text-sm font-black text-text-muted hover:text-text uppercase tracking-widest transition-colors rounded-lg hover:bg-surface-2 cursor-pointer select-none"
                  >
                    Reset
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isUploading || !selectedFile || !title}
                    className="h-12 px-8"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tv className="w-4 h-4" />}
                    Publicar en TV
                  </Button>
                </div>
              </div>

            </div>
          </form>
        </div>
      </section>

      {/* ── Modo TV Live ── */}
      <section className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-7 py-5 border-b border-border bg-surface-2/70">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-text text-sm uppercase tracking-wider">MODO TV LIVE</h3>
              <p className="text-[10px] text-text-muted font-bold mt-0.5 uppercase tracking-widest">Contenido transmitido en las pantallas</p>
            </div>
          </div>
          <span className="text-[10px] font-black text-called bg-called/10 border border-called/20 px-3 py-1.5 rounded-lg uppercase tracking-widest">
            {sliders.length} elementos
          </span>
        </div>

        <div className="p-7">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <p className="text-sm font-medium text-text-muted">Sincronizando con televisores…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 text-canceled gap-3">
              <p className="text-sm font-bold">{error}</p>
              <button
                type="button"
                onClick={loadSliders}
                className="px-4 py-2 rounded-lg border border-canceled/30 text-canceled hover:bg-canceled/10 text-xs font-bold transition-colors cursor-pointer select-none"
              >
                Reintentar
              </button>
            </div>
          ) : sliders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border-2 rounded-xl bg-surface-2/30">
              <div className="p-4 rounded-full bg-surface mb-4 border border-border shadow-sm">
                <ImageIcon className="w-10 h-10 text-text-muted opacity-50" />
              </div>
              <h4 className="text-lg font-bold text-text mb-1">No hay contenido</h4>
              <p className="text-sm font-medium text-text-muted max-w-sm mx-auto">
                Cargue archivos multimedia para alimentar las pantallas de la sala de espera.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {sliders.map((slider) => (
                <div
                  key={slider.id}
                  className={`group flex flex-col rounded-xl border overflow-hidden transition-all shadow-sm ${
                    slider.is_active ? 'border-border hover:border-primary/40' : 'border-border opacity-60 grayscale-[40%]'
                  } bg-surface`}
                >
                  <div className="relative w-full aspect-video bg-surface-2 border-b border-border">
                    {slider.media_type === 'IMAGE'
                      ? <img src={getMediaUrl(slider)} alt={slider.title} width={320} height={180} className="w-full h-full object-cover" loading="lazy" />
                      : <video src={getMediaUrl(slider)} aria-label={slider.title} className="w-full h-full object-cover" muted />
                    }
                    <span className={`absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-sm ${
                      slider.is_active ? 'bg-attended' : 'bg-text-muted'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full bg-white ${slider.is_active ? 'animate-pulse' : ''}`} />
                      {slider.is_active ? 'En TV' : 'Apagado'}
                    </span>
                    <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-text/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-medium">
                      {slider.media_type === 'IMAGE' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                      {slider.duration}s
                    </span>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-text text-sm truncate">{slider.title}</p>
                      <p className="text-[10px] font-medium text-text-muted mt-0.5">
                        <time dateTime={slider.created_at}>{new Date(slider.created_at).toLocaleDateString()}</time>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(slider)}
                        aria-pressed={slider.is_active}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer select-none ${
                          slider.is_active
                            ? 'border-border text-text-muted hover:bg-surface-2 hover:text-text'
                            : 'border-attended/30 text-attended bg-attended/10 hover:bg-attended/20'
                        }`}
                      >
                        {slider.is_active
                          ? <><PauseCircle className="w-3.5 h-3.5" /> Apagar</>
                          : <><PlayCircle className="w-3.5 h-3.5" /> Activar</>
                        }
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteModal({ show: true, slider })}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border border-canceled/30 text-canceled hover:bg-canceled/10 transition-all cursor-pointer select-none"
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 bg-text/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onKeyDown={(e) => e.key === 'Escape' && setDeleteModal({ show: false, slider: null })}
        >
          <div className="bg-surface border border-border rounded-2xl shadow-xl max-w-sm w-full p-8 text-center animate-fade-in">
            <div className="w-14 h-14 bg-canceled/10 text-canceled rounded-full flex items-center justify-center mx-auto mb-5">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 id="delete-modal-title" className="text-lg font-bold text-text mb-2">¿Eliminar Contenido?</h3>
            <p className="text-sm font-medium text-text-muted mb-8 leading-relaxed">
              Se borrará <span className="font-bold text-text">"{deleteModal.slider.title}"</span> permanentemente del sistema de pantallas.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-3 rounded-lg bg-canceled hover:bg-red-600 text-white text-sm font-bold shadow-sm transition-colors cursor-pointer select-none"
              >
                Borrar Definitivamente
              </button>
              <button
                ref={modalCancelRef}
                type="button"
                onClick={() => setDeleteModal({ show: false, slider: null })}
                className="w-full py-3 rounded-lg border border-border text-text hover:bg-surface-2 text-sm font-bold transition-colors cursor-pointer select-none"
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
