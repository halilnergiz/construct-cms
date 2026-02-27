import { useCallback, useState } from 'react'
import { GripVertical, Loader2, Upload, X } from 'lucide-react'

import { supabase } from '@/lib/supabase'

interface ImageUploaderProps {
  values: string[]
  onChange: (urls: string[]) => void
  bucket?: string
  folder?: string
}

export default function ImageUploader({
  values,
  onChange,
  bucket = 'project-images',
  folder = 'projects',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((file) => file.type.startsWith('image/'))
      if (imageFiles.length === 0) return

      setUploading(true)
      const uploadedUrls: string[] = []

      for (const file of imageFiles) {
        const ext = file.name.split('.').pop()
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { upsert: true })

        if (!error) {
          const {
            data: { publicUrl },
          } = supabase.storage.from(bucket).getPublicUrl(fileName)
          uploadedUrls.push(publicUrl)
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...values, ...uploadedUrls])
      }

      setUploading(false)
    },
    [bucket, folder, onChange, values]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) {
      void uploadFiles(files)
      e.target.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files ?? [])
    if (files.length > 0) {
      void uploadFiles(files)
    }
  }

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    const next = [...values]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          dragActive
            ? 'border-sky-400 bg-sky-50'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400'
        }`}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">
              Görselleri yüklemek için tıklayın veya sürükleyin
            </span>
            <span className="mt-1 text-xs text-slate-400">
              Çoklu seçimi destekler (PNG, JPG, WebP)
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {values.length > 0 && (
        <>
          <div className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700">
            İlk görsel kapak görseli olarak kullanılır. Sıralamayı sürükle-bırak ile değiştirebilirsiniz.
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {values.map((url, index) => (
              <div
                key={`${url}-${index}`}
                draggable
                onDragStart={() => setDraggingIndex(index)}
                onDragEnd={() => {
                  setDraggingIndex(null)
                  setDragOverIndex(null)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverIndex(index)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (draggingIndex !== null) {
                    handleReorder(draggingIndex, index)
                  }
                  setDraggingIndex(null)
                  setDragOverIndex(null)
                }}
                className={`group relative overflow-hidden rounded-lg border bg-white ${
                  dragOverIndex === index ? 'border-sky-400' : 'border-slate-200'
                }`}
              >
                <img
                  src={url}
                  alt={`Yüklenen görsel ${index + 1}`}
                  className="h-28 w-full object-cover"
                />
                <div className="absolute left-2 top-2 rounded bg-black/65 px-2 py-0.5 text-xs font-medium text-white">
                  {index === 0 ? 'Kapak' : `${index + 1}`}
                </div>
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="rounded-full bg-red-500/90 p-1 text-white transition-colors hover:bg-red-600"
                    title="Görseli kaldır"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="absolute bottom-2 right-2 rounded bg-black/55 p-1 text-white">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
