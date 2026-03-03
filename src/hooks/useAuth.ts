import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const syncUserFromServer = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!active) return

      if (!session) {
        setUser(null)
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.getUser()

      if (!active) return

      if (error || !data.user) {
        setUser(null)
        await supabase.auth.signOut({ scope: 'local' })
        setLoading(false)
        return
      }

      setUser(data.user)
      setLoading(false)
    }

    void syncUserFromServer()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
        return
      }

      void syncUserFromServer()
    })

    const handleWindowFocus = () => {
      void syncUserFromServer()
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleWindowFocus)

    return () => {
      active = false
      subscription.unsubscribe()
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleWindowFocus)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { user, loading, signIn, signOut }
}
