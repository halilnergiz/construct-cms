import { useState } from 'react'
import { Loader2, Upload } from 'lucide-react'

import AvatarCropperModal from '@/components/AvatarCropperModal'

interface CompanyLogoUploaderProps {
  logoUrl: string
  uploading: boolean
  message?: string | null
  messageClassName?: string
  onUpload: (blob: Blob) => Promise<void>
  onReset?: () => Promise<void>
  showResetButton?: boolean
}

export default function CompanyLogoUploader({
  logoUrl,
  uploading,
  message,
  messageClassName = 'text-slate-500',
  onUpload,
  onReset,
  showResetButton = false,
}: CompanyLogoUploaderProps) {
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [cropperOpen, setCropperOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
          <img src={logoUrl} alt="Firma logosu" className="h-full w-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
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
              className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              Varsayılan Logoya Dön
            </button>
          )}
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
    </>
  )
}
