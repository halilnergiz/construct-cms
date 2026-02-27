import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router'
import { ArrowLeft, Pencil, Eye, EyeOff, Trash2 } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import type { Project } from '@/types/project'

export default function ProjectPreviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

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

  const galleryImages =
    project.images?.filter((img, index) =>
      project.cover_image ? img !== project.cover_image || index !== 0 : true
    ) ?? []

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
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Önizleme</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Projenin website&apos;taki görünümü
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              project.status === 'published'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {project.status === 'published' ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
            {project.status === 'published' ? 'Yayında' : 'Taslak'}
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

      <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white px-6 py-12 shadow-sm sm:px-10">
          {project.category && (
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-wider text-sky-600">
              {project.category}
            </span>
          )}

          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            {project.title}
          </h1>

          {project.description && (
            <p className="mb-8 text-xl text-gray-500">{project.description}</p>
          )}

          {project.cover_image && (
            <div className="mb-10 overflow-hidden rounded-xl">
              <img
                src={project.cover_image}
                alt={project.title}
                className="aspect-video w-full object-cover"
              />
            </div>
          )}

          {project.content && (
            <div className="prose prose-lg prose-gray max-w-none">
              {project.content.split('\n').map((paragraph, i) =>
                paragraph.trim() ? (
                  <p key={i} className="text-gray-600 leading-relaxed">
                    {paragraph}
                  </p>
                ) : (
                  <br key={i} />
                )
              )}
            </div>
          )}

          {galleryImages.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-6 text-2xl font-semibold text-gray-800">
                Galeri
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {galleryImages.map((img, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-lg"
                  >
                    <img
                      src={img}
                      alt={`${project.title} - Görsel ${i + 1}`}
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Proje Bilgileri
        </h3>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Slug</dt>
            <dd className="font-medium text-slate-900">/{project.slug}</dd>
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

function extractStoragePath(url: string): string | null {
  const match = url.match(/project-images\/(.+)$/)
  return match ? match[1] : null
}
