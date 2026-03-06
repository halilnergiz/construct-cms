import { useEffect } from 'react'
import { useLocation } from 'react-router'

import { supabase } from '@/lib/supabase'

import { useAuth } from './useAuth'

export function useProfileFavicon() {
  const { user } = useAuth()
  const location = useLocation()

  useEffect(() => {
    let ignore = false

    const updateFavicon = async () => {
      const isLoginPage = location.pathname === '/login'

      if (isLoginPage || !user) {
        setFavicon(null)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('logo_url')
        .eq('id', user.id)
        .maybeSingle()

      if (ignore) return

      const profileLogoUrl =
        !error && typeof data?.logo_url === 'string' && data.logo_url.length > 0
          ? data.logo_url
          : null

      setFavicon(profileLogoUrl)
    }

    void updateFavicon()

    return () => {
      ignore = true
    }
  }, [location.pathname, user])
}

function setFavicon(href: string | null) {
  const selector = 'link[rel="icon"]'
  const existing = document.querySelector<HTMLLinkElement>(selector)

  if (!href) {
    existing?.remove()
    return
  }

  const favicon = existing ?? document.createElement('link')
  favicon.rel = 'icon'
  favicon.href = href
  if (!existing) {
    document.head.appendChild(favicon)
  }
}
