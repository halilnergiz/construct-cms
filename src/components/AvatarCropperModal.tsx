import { useEffect, useMemo, useRef, useState } from 'react'
import { ImageRestriction } from 'advanced-cropper'
import { Cropper, CircleStencil } from 'react-advanced-cropper'
import type { CropperRef } from 'react-advanced-cropper'
import { Loader2, X } from 'lucide-react'

import 'react-advanced-cropper/dist/style.css'

interface AvatarCropperModalProps {
  file: File | null
  open: boolean
  onClose: () => void
  onConfirm: (blob: Blob) => Promise<void>
}

export default function AvatarCropperModal({
  file,
  open,
  onClose,
  onConfirm,
}: AvatarCropperModalProps) {
  const cropperRef = useRef<CropperRef>(null)
  const [saving, setSaving] = useState(false)

  const imageSrc = useMemo(() => {
    if (!file) return null
    return URL.createObjectURL(file)
  }, [file])

  useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc)
    }
  }, [imageSrc])

  if (!open || !imageSrc) return null

  const handleConfirm = async () => {
    const canvas = cropperRef.current?.getCanvas({
      width: 512,
      height: 512,
    })
    if (!canvas) return

    setSaving(true)
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/png', 0.95)
    })

    if (blob) {
      await onConfirm(blob)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Profil Fotoğrafını Kırp
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="h-[380px] overflow-hidden rounded-lg bg-slate-100">
            <Cropper
              ref={cropperRef}
              src={imageSrc}
              className="h-full w-full"
              stencilComponent={CircleStencil}
              stencilProps={{
                movable: true,
                resizable: true,
              }}
              imageRestriction={ImageRestriction.stencil}
              backgroundClassName="bg-slate-900"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Daire içindeki alan profil fotoğrafı olarak kaydedilir.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Kırp ve Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}
