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

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    // Listen for the popup completing sign-in
    function handleMessage(e) {
      if (e.origin === window.location.origin && e.data === 'oauth-complete') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null)
        })
      }
    }
    window.addEventListener('message', handleMessage)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // If this tab is a popup completing the OAuth flow, close it once loading finishes
  useEffect(() => {
    if (!loading && window.opener) {
      try { window.opener.postMessage('oauth-complete', window.location.origin) } catch (_) {}
      window.close()
    }
  }, [loading])

  async function signInWithGoogle() {
    if (!supabase) {
      alert('Sign-in is not configured. Please check Vercel environment variables.')
      return
    }

    // Use skipBrowserRedirect so the main window doesn't navigate away
    // (which would lose the PKCE verifier stored in localStorage)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    })

    if (error) {
      alert(`Sign-in error: ${error.message}`)
      return
    }

    if (!data?.url) return

    const w = 500, h = 620
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2)
    const top = Math.round(window.screenY + (window.outerHeight - h) / 2)
    window.open(
      data.url,
      'google_oauth',
      `width=${w},height=${h},left=${left},top=${top},toolbar=0,menubar=0,location=0`
    )
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return { user, loading, signInWithGoogle, signOut }
}
