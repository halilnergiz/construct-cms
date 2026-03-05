import { useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'

import AvatarCropperModal from '@/components/AvatarCropperModal'

interface CompanyLogoUploaderProps {
  logoUrl: string
  uploading: boolean
  message?: string | null
  messageClassName?: string
  onUpload: (blob: Blob) => Promise<void>
  onReset?: () => Promise<void>
  showResetButton?: boolean
  enablePreviewOnDoubleClick?: boolean
}

export default function CompanyLogoUploader({
  logoUrl,
  uploading,
  message,
  messageClassName = 'text-slate-500',
  onUpload,
  onReset,
  showResetButton = false,
  enablePreviewOnDoubleClick = false,
}: CompanyLogoUploaderProps) {
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const actionButtonClassName =
    'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className={`relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-50 ${
            enablePreviewOnDoubleClick ? 'cursor-pointer' : ''
          }`}
          onClick={() => {
            if (!enablePreviewOnDoubleClick) return
            setPreviewOpen(true)
          }}
        >
          <img
            src={logoUrl}
            alt="Firma logosu"
            draggable={false}
            className="h-full w-full select-none object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <label
              className={`${actionButtonClassName} ${
                uploading ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Logo Yükle
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setSelectedLogoFile(file)
                  setCropperOpen(true)
                  e.target.value = ''
                }
              }}
            />
            </label>
            {showResetButton && onReset && (
              <button
                type="button"
                onClick={() => void onReset()}
                disabled={uploading}
                className={actionButtonClassName}
              >
                Varsayılan Logoya Dön
              </button>
            )}
          </div>
          {message && <p className={`text-xs ${messageClassName}`}>{message}</p>}
        </div>
      </div>

      <AvatarCropperModal
        file={selectedLogoFile}
        open={cropperOpen}
        onClose={() => {
          setCropperOpen(false)
          setSelectedLogoFile(null)
        }}
        onConfirm={async (blob) => {
          setCropperOpen(false)
          setSelectedLogoFile(null)
          await onUpload(blob)
        }}
      />
      {enablePreviewOnDoubleClick && previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute top-2 right-2 z-10 rounded-lg bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
              aria-label="Önizlemeyi kapat"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={logoUrl}
              alt="Firma logosu büyütülmüş önizleme"
              draggable={false}
              className="max-h-[80vh] w-full rounded-xl bg-white object-contain select-none"
            />
          </div>
        </div>
      )}
    </>
  )
}
