import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Loader2, Save } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import ImageUploader from '@/components/ImageUploader'
import type { ProjectInsert } from '@/types/project'

type FormData = Omit<ProjectInsert, 'images'>

export default function ProjectFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingProject, setLoadingProject] = useState(isEditing)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      content: '',
      category: '',
      status: 'draft',
      cover_image: null,
    },
  })

  useEffect(() => {
    if (!id) return

    async function loadProject() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        setValue('title', data.title)
        setValue('slug', data.slug)
        setValue('description', data.description ?? '')
        setValue('content', data.content ?? '')
        setValue('category', data.category ?? '')
        setValue('status', data.status)
        setCoverImage(data.cover_image)
      }
      setLoadingProject(false)
    }
    loadProject()
  }, [id, setValue])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)

    const payload = {
      ...data,
      cover_image: coverImage,
      images: [],
    }

    if (isEditing) {
      const { error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', id!)
      if (!error) navigate('/projects')
    } else {
      const { error } = await supabase
        .from('projects')
        .insert(payload)
      if (!error) navigate('/projects')
    }

    setSaving(false)
  }

  if (loadingProject) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/projects')}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">
          {isEditing ? 'Projeyi Düzenle' : 'Yeni Proje'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Genel Bilgiler
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Başlık *
              </label>
              <input
                {...register('title', { required: 'Başlık zorunludur' })}
                onChange={(e) => {
                  register('title').onChange(e)
                  if (!isEditing) {
                    setValue('slug', generateSlug(e.target.value))
                  }
                }}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                placeholder="Proje başlığı"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Slug *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">/projeler/</span>
                <input
                  {...register('slug', { required: 'Slug zorunludur' })}
                  className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  placeholder="proje-slug"
                />
              </div>
              {errors.slug && (
                <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Kısa Açıklama
              </label>
              <textarea
                {...register('description')}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                placeholder="Proje hakkında kısa açıklama"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Detaylı İçerik
              </label>
              <textarea
                {...register('content')}
                rows={8}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                placeholder="Projenin detaylı açıklaması..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Kategori
              </label>
              <input
                {...register('category')}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                placeholder="ör: Konut, Ticari, Altyapı"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Kapak Görseli
          </h3>
          <ImageUploader value={coverImage} onChange={setCoverImage} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Yayın Ayarları
          </h3>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Durum
              </label>
              <select
                {...register('status')}
                className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="draft">Taslak</option>
                <option value="published">Yayında</option>
              </select>
            </div>
            <label className="flex items-center gap-2 pt-5 text-sm text-slate-700">
              <input
                type="checkbox"
                {...register('featured')}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              Öne çıkan proje
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditing ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}
