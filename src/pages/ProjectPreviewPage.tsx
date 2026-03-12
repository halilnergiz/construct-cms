import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router'
import { ArrowLeft, Pencil, Eye, EyeOff, Trash2, MapPin, X } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import type { Project, ProjectStatus } from '@/types/project'

export default function ProjectPreviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [thumbnailPage, setThumbnailPage] = useState(0)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function fetchProject() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        setProject(data as Project)
      }
      setLoading(false)
    }
    fetchProject()
  }, [id])

  useEffect(() => {
    if (!project) return
    const firstImage = project.cover_image ?? project.images?.[0] ?? null
    setActiveImage(firstImage)
    setThumbnailPage(0)
  }, [project])

  const allImages = useMemo(
    () =>
      Array.from(
        new Set(
          [project?.cover_image, ...(project?.images ?? [])].filter(
            (img): img is string => Boolean(img)
          )
        )
      ),
    [project?.cover_image, project?.images]
  )

  useEffect(() => {
    if (!activeImage || allImages.length === 0) return
    const activeImageIndex = allImages.indexOf(activeImage)
    if (activeImageIndex < 0) return
    const nextPage = Math.floor(activeImageIndex / 5)
    setThumbnailPage((currentPage) =>
      currentPage === nextPage ? currentPage : nextPage
    )
  }, [activeImage, allImages])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFullscreenImage(null)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500">Proje bulunamadı</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          Projelere dön
        </button>
      </div>
    )
  }

  const thumbnailsPerPage = 5
  const totalThumbnailPages = Math.ceil(allImages.length / thumbnailsPerPage)
  const thumbnailStartIndex = thumbnailPage * thumbnailsPerPage
  const visibleThumbnails = allImages.slice(
    thumbnailStartIndex,
    thumbnailStartIndex + thumbnailsPerPage
  )

  const hasCoordinates =
    project.location?.latitude !== null &&
    project.location?.latitude !== undefined &&
    project.location?.longitude !== null &&
    project.location?.longitude !== undefined

  const mapUrl = hasCoordinates
    ? `https://maps.google.com/maps?q=${project.location?.latitude},${project.location?.longitude}&z=14&output=embed`
    : null

  const handleDelete = async () => {
    if (!confirm('Bu projeyi silmek istediğinize emin misiniz?')) return

    setDeleting(true)

    const paths = new Set<string>()
    if (project.cover_image) {
      const coverPath = extractStoragePath(project.cover_image)
      if (coverPath) paths.add(coverPath)
    }
    if (project.images?.length) {
      project.images
        .map(extractStoragePath)
        .filter(Boolean)
        .forEach((path) => paths.add(path as string))
    }
    if (paths.size > 0) {
      await supabase.storage.from('project-images').remove([...paths])
    }
 
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (!error) {
      navigate('/projects')
    }

    setDeleting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Önizleme</h2>
        </div>

        <div className="flex items-center gap-2 self-start">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              project.publication_state === 'published'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {project.publication_state === 'published' ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
            {project.publication_state === 'published' ? 'Yayında' : 'Taslak'}
          </span>
          <Link
            to={`/projects/${project.id}/edit`}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            Düzenle
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Sil
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-xl shadow-slate-200/50 backdrop-blur sm:p-6">
        <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
          <section className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={project.title}
                  className="aspect-video w-full object-cover"
                  onDoubleClick={() => setFullscreenImage(activeImage)}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center text-sm font-medium text-slate-500">
                  Görsel bulunamadı
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-900/65 via-slate-900/10 to-transparent" />
              <span
                className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  project.featured
                    ? 'bg-amber-100/95 text-amber-800'
                    : 'bg-slate-100/95 text-slate-700'
                }`}
              >
                {project.featured ? 'Öne Çıkan' : 'Standart'}
              </span>
              <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2 sm:inset-x-4 sm:bottom-4 sm:gap-3">
                <div>
                  <h1 className="text-xl font-semibold text-white drop-shadow-sm sm:text-2xl md:text-3xl">
                    {project.title}
                  </h1>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-100 sm:gap-2 sm:text-sm">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {formatLocation(project)}
                  </p>
                </div>
                {project.category && (
                  <span className="rounded-full bg-slate-100/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 sm:px-3 sm:py-1 sm:text-xs">
                    {project.category}
                  </span>
                )}
              </div>
            </div>

            {allImages.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  {visibleThumbnails.map((img, i) => (
                    <button
                      type="button"
                      key={`${img}-${thumbnailStartIndex + i}`}
                      onClick={() => setActiveImage(img)}
                      className={`overflow-hidden rounded-xl border transition ${
                        activeImage === img
                          ? 'border-slate-900 ring-2 ring-slate-900/15'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${project.title} - Görsel ${thumbnailStartIndex + i + 1}`}
                        className="aspect-16/10 w-full object-cover"
                        onDoubleClick={() => setFullscreenImage(img)}
                      />
                    </button>
                  ))}
                </div>

                {totalThumbnailPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: totalThumbnailPages }, (_, pageIndex) => (
                      <button
                        type="button"
                        key={`thumb-page-${pageIndex}`}
                        onClick={() => setThumbnailPage(pageIndex)}
                        aria-label={`Galeri sayfası ${pageIndex + 1}`}
                        className={`h-2.5 w-2.5 rounded-full transition ${
                          pageIndex === thumbnailPage
                            ? 'bg-slate-900'
                            : 'bg-slate-300 hover:bg-slate-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="h-[320px] max-h-[320px] space-y-3 md:h-[380px] md:max-h-[380px]">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {mapUrl ? (
                  <iframe
                    title="project-location-map"
                    src={mapUrl}
                    className="h-32 w-full md:h-48"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center p-4 text-sm text-slate-500 md:h-48">
                    Harita için konum koordinatı bulunmuyor
                  </div>
                )}
              </div>

              <div className="h-[calc(320px-12px-8rem)] overflow-y-auto pr-1 text-sm text-slate-600 md:h-[calc(380px-12px-12rem)] lg:h-[calc(380px-12px-10rem)] 2xl:h-[calc(480px-12px-3rem)]">
                <h3 className="text-lg font-semibold text-slate-900">{project.title}</h3>
                <p className="mt-1">
                  {project.description ?? 'Açıklama eklenmemiş.'}
                </p>

                {project.content ? (
                  <div className="mt-3 border-t border-slate-200 pt-3 space-y-2">
                    {project.content.split('\n').map((line, i) =>
                      line.trim() ? <p key={i}>{line}</p> : <div key={i} className="h-2" />
                    )}
                  </div>
                ) : (
                  <p className="mt-3 border-t border-slate-200 pt-3 text-slate-500">
                    İçerik eklenmemiş.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Proje Detayları
        </h3>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Slug</dt>
            <dd className="font-medium text-slate-900">/{project.slug}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Proje Durumu</dt>
            <dd className="font-medium text-slate-900">
              {formatProjectStatus(project.project_status)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Oluşturulma</dt>
            <dd className="font-medium text-slate-900">
              {formatDateTime(project.created_at)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Son Güncelleme</dt>
            <dd className="font-medium text-slate-900">
              {formatDateTime(project.updated_at)}
            </dd>
          </div>
        </dl>
      </div>

      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            type="button"
            onClick={() => setFullscreenImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Tam ekran görseli kapat"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={fullscreenImage}
            alt={`${project.title} tam ekran`}
            className="max-h-[92vh] w-auto max-w-[96vw] rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  const datePart = date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${datePart} Saat ${timePart}`
}

function formatLocation(project: Project): string {
  const city = project.location?.city?.trim()
  const district = project.location?.district?.trim()
  if (district && city) return `${district}, ${city}`
  if (district) return district
  if (city) return city
  return 'Lokasyon belirtilmemiş'
}

function extractStoragePath(url: string): string | null {
  const match = url.match(/project-images\/(.+)$/)
  return match ? match[1] : null
}

function formatProjectStatus(value: ProjectStatus | null): string {
  if (value === 'planned') return 'Planlanan'
  if (value === 'ongoing') return 'Devam Eden'
  if (value === 'completed') return 'Tamamlanmış'
  return 'Belirtilmemiş'
}
