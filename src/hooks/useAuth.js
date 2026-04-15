import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Clear OAuth error params from URL without reloading
    const params = new URLSearchParams(window.location.search)
    if (params.get('error_code') === 'bad_oauth_callback') {
      window.history.replaceState({}, '', window.location.pathname)
    }

    if (!supabase) {
      setLoading(false)
      return
    }

    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    if (!supabase) {
      alert('Sign-in is not configured. Please check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your Vercel environment variables.')
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) alert(`Sign-in error: ${error.message}`)
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return { user, loading, signInWithGoogle, signOut }
}
