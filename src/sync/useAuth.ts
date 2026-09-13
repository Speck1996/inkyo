import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSyncConfigured } from './client'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSyncConfigured)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signInWithMagicLink(email: string) {
    if (!supabase) return { error: new Error('Sync not configured') }
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return { user, loading, signInWithMagicLink, signOut, configured: isSyncConfigured }
}
