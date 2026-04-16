import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="accounts.google.com/gsi"]')
    if (existing) { existing.addEventListener('load', resolve); return }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function generateNonce() {
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce))
  const hashedNonce = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  return { nonce, hashedNonce }
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Clear any OAuth error params from URL
    const params = new URLSearchParams(window.location.search)
    if (params.has('error_code')) {
      window.history.replaceState({}, '', window.location.pathname)
    }

    if (!supabase) { setLoading(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    if (!supabase) {
      alert('Sign-in is not configured. Please check environment variables.')
      return
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      alert('VITE_GOOGLE_CLIENT_ID is not set. Please add it to your Vercel environment variables.')
      return
    }

    try {
      await loadGoogleScript()

      const { nonce, hashedNonce } = await generateNonce()

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: async ({ credential }) => {
          const { error: signInError } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: credential,
            nonce,
          })
          if (signInError) alert(`Sign-in failed: ${signInError.message}`)
        },
      })

      // Show One Tap UI — if suppressed, render a button in a temporary container
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // One Tap was blocked — render a Google button in a small overlay
          showGoogleButtonFallback(clientId, nonce, hashedNonce)
        }
      })

    } catch (err) {
      alert(`Sign-in error: ${err.message}`)
    }
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return { user, loading, signInWithGoogle, signOut }
}

function showGoogleButtonFallback(clientId, nonce, hashedNonce) {
  const existing = document.getElementById('__google_btn_overlay')
  if (existing) existing.remove()

  const overlay = document.createElement('div')
  overlay.id = '__google_btn_overlay'
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999;
  `

  const card = document.createElement('div')
  card.style.cssText = `
    background: white; border-radius: 12px; padding: 1.5rem 2rem;
    display: flex; flex-direction: column; align-items: center; gap: 1rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  `

  const title = document.createElement('div')
  title.textContent = 'Sign in to Wedding Seating'
  title.style.cssText = 'font-size: 1rem; font-weight: 600; color: #333;'

  const btnContainer = document.createElement('div')
  btnContainer.id = '__google_btn_container'

  const close = document.createElement('button')
  close.textContent = 'Cancel'
  close.style.cssText = `
    background: none; border: none; color: #888; cursor: pointer;
    font-size: 0.85rem; padding: 0.25rem 0.5rem;
  `
  close.onclick = () => overlay.remove()

  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove() }

  card.appendChild(title)
  card.appendChild(btnContainer)
  card.appendChild(close)
  overlay.appendChild(card)
  document.body.appendChild(overlay)

  window.google.accounts.id.initialize({
    client_id: clientId,
    nonce: hashedNonce,
    callback: async ({ credential }) => {
      overlay.remove()
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential,
        nonce,
      })
      if (error) alert(`Sign-in failed: ${error.message}`)
    },
  })

  window.google.accounts.id.renderButton(btnContainer, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: 250,
  })
}
