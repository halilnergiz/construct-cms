import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { supabase, getCapturedAuthType } from '@/lib/supabase'

const TIMEOUT_MS = 15_000
const PASSWORD_SETUP_TYPES = new Set(['invite', 'recovery', 'signup'])

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const authType = getCapturedAuthType()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'INITIAL_SESSION' && !session) return
      if (!session) return

      active = false

      const needsPasswordSetup =
        event === 'PASSWORD_RECOVERY' ||
        PASSWORD_SETUP_TYPES.has(authType ?? '')

      if (needsPasswordSetup) {
        navigate('/set-password', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    })

    const timeout = setTimeout(() => {
      if (active) {
        setError('Bağlantı geçersiz veya süresi dolmuş.')
      }
    }, TIMEOUT_MS)

    return () => {
      active = false
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [navigate])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-sm rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            Giriş sayfasına dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800" />
        <p className="text-sm text-slate-500">Oturum doğrulanıyor...</p>
      </div>
    </div>
  )
}
