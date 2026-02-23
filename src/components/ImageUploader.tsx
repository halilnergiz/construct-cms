import { useCallback, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'

import { supabase } from '@/lib/supabase'

interface ImageUploaderProps {
  value: string | null
  onChange: (url: string | null) => void
  bucket?: string
  folder?: string
}

export default function ImageUploader({
  value,
  onChange,
  bucket = 'project-images',
  folder = 'covers',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true)
      const ext = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true })

      if (!error) {
        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(fileName)
        onChange(publicUrl)
      }
      setUploading(false)
    },
    [bucket, folder, onChange]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      uploadFile(file)
    }
  }

  const handleRemove = () => {
    onChange(null)
  }

  if (value) {
    return (
      <div className="relative inline-block">
        <img
          src={value}
          alt="Yüklenen görsel"
          className="h-40 w-full rounded-lg object-cover sm:w-60"
        />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md transition-colors hover:bg-red-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
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
            Görsel yüklemek için tıklayın veya sürükleyin
          </span>
          <span className="mt-1 text-xs text-slate-400">PNG, JPG, WebP</span>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </label>
  )
}
