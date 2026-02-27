import { useMemo, useState } from 'react'
import { KeyRound, Loader2, ShieldCheck, Upload, UserCircle2 } from 'lucide-react'

import AvatarCropperModal from '@/components/AvatarCropperModal'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

const DEFAULT_AVATAR = 'default-logo.png'

export default function ProfilePage() {
  const { user } = useAuth()
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'account' | 'password'>('account')
  const [oldPassword, setOldPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null)
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
  const [cropperOpen, setCropperOpen] = useState(false)

  const avatarUrl = useMemo(() => {
    const candidate = user?.user_metadata?.avatar_url
    return typeof candidate === 'string' && candidate.length > 0
      ? candidate
      : DEFAULT_AVATAR
  }, [user?.user_metadata])

  const handleAvatarUpload = async (file: Blob) => {
    if (!user) return
    if (!file.type.startsWith('image/')) {
      setAvatarMessage('Lütfen geçerli bir görsel dosyası seçin.')
      return
    }

    setAvatarUploading(true)
    setAvatarMessage(null)

    const ext = file.type.split('/')[1] ?? 'jpg'
    const path = `profiles/${user.id}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setAvatarMessage(uploadError.message)
      setAvatarUploading(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('project-images').getPublicUrl(path)

    const oldAvatar = user.user_metadata?.avatar_url
    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    })

    if (updateError) {
      setAvatarMessage(updateError.message)
      setAvatarUploading(false)
      return
    }

    const oldPath = extractStoragePath(
      typeof oldAvatar === 'string' ? oldAvatar : null
    )
    if (oldPath && oldPath.startsWith('profiles/')) {
      await supabase.storage.from('project-images').remove([oldPath])
    }

    setAvatarMessage('Firma logosu güncellendi.')
    setAvatarUploading(false)
  }

  const handleAvatarReset = async () => {
    if (!user) return

    setAvatarUploading(true)
    setAvatarMessage(null)

    const oldAvatar = user.user_metadata?.avatar_url
    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: null },
    })

    if (error) {
      setAvatarMessage(error.message)
      setAvatarUploading(false)
      return
    }

    const oldPath = extractStoragePath(
      typeof oldAvatar === 'string' ? oldAvatar : null
    )
    if (oldPath && oldPath.startsWith('profiles/')) {
      await supabase.storage.from('project-images').remove([oldPath])
    }

    setAvatarMessage('Firma logosu varsayılan logoya döndürüldü.')
    setAvatarUploading(false)
  }

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (!oldPassword) {
      setPasswordMessage('Lütfen mevcut şifrenizi girin.')
      return
    }
    if (password.length < 6) {
      setPasswordMessage('Şifre en az 6 karakter olmalıdır.')
      return
    }
    if (password !== confirmPassword) {
      setPasswordMessage('Şifreler eşleşmiyor.')
      return
    }

    setPasswordSaving(true)
    if (!user?.email) {
      setPasswordMessage('Hesap e-posta bilgisi bulunamadı.')
      setPasswordSaving(false)
      return
    }
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    })
    if (verifyError) {
      setPasswordMessage('Mevcut şifreniz hatalı.')
      setPasswordSaving(false)
      return
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setPasswordMessage(error.message)
      setPasswordSaving(false)
      return
    }

    setOldPassword('')
    setPassword('')
    setConfirmPassword('')
    setPasswordMessage('Şifreniz başarıyla güncellendi.')
    setPasswordSaving(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Firma Profili</h2>
        <p className="mt-1 text-sm text-slate-500">
          Firma logosu ve şifre ayarlarınızı yönetin.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Firma Logosu
        </h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
            <img src={avatarUrl} alt="Firma logosu" className="h-full w-full object-cover" />
            {avatarUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
              {avatarUploading ? (
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
                    setSelectedAvatarFile(file)
                    setCropperOpen(true)
                    e.target.value = ''
                  }
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => void handleAvatarReset()}
              disabled={avatarUploading}
              className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              Varsayılan Logoya Dön
            </button>
            {avatarMessage && (
              <p className="text-xs text-slate-500">{avatarMessage}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Hesap Bilgileri
        </h3>
        <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'account'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hesap
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Şifre Yenile
          </button>
        </div>
        <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <UserCircle2 className="h-4 w-4" />
            <span>{user?.email ?? '-'}</span>
            <span className="group relative inline-flex">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
                Doğrulanmış mail
              </span>
            </span>
          </div>
        </div>

        {activeTab === 'password' ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Mevcut Şifre
              </label>
              <input
                type="password"
                minLength={6}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                placeholder="Mevcut şifrenizi girin"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Yeni Şifre
              </label>
              <input
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                placeholder="En az 6 karakter"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Yeni Şifre (Tekrar)
              </label>
              <input
                type="password"
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                placeholder="Şifrenizi tekrar girin"
              />
            </div>
            {passwordMessage && (
              <p className="text-sm text-slate-600">{passwordMessage}</p>
            )}
            <button
              type="submit"
              disabled={passwordSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
            >
              {passwordSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Şifreyi Güncelle
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-500">
            Şifre yenilemek için <strong>Şifre Yenile</strong> sekmesine geçiniz.
          </p>
        )}
      </div>

      <AvatarCropperModal
        file={selectedAvatarFile}
        open={cropperOpen}
        onClose={() => {
          setCropperOpen(false)
          setSelectedAvatarFile(null)
        }}
        onConfirm={async (blob) => {
          setCropperOpen(false)
          setSelectedAvatarFile(null)
          await handleAvatarUpload(blob)
        }}
      />
    </div>
  )
}

function extractStoragePath(url: string | null): string | null {
  if (!url) return null
  const match = url.match(/project-images\/(.+)$/)
  return match ? match[1] : null
}
