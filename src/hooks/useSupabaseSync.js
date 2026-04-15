import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import useStore from '../store/useStore'

/**
 * Syncs the Zustand store to Supabase when a user is authenticated.
 * Returns saveStatus: 'idle' | 'saving' | 'saved' | 'error'
 */
export function useSupabaseSync(user) {
  const _setFullState = useStore((s) => s._setFullState)
  const guests = useStore((s) => s.guests)
  const tables = useStore((s) => s.tables)
  const constraints = useStore((s) => s.constraints)
  const groups = useStore((s) => s.groups)

  const syncTimeout = useRef(null)
  const savedTimeout = useRef(null)
  const initialLoadDone = useRef(false)
  const [saveStatus, setSaveStatus] = useState('idle')

  // Load chart from Supabase when user signs in
  useEffect(() => {
    if (!supabase || !user) {
      initialLoadDone.current = false
      return
    }

    async function loadChart() {
      const { data, error } = await supabase
        .from('charts')
        .select('guests, tables, constraints, groups')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!error && data) {
        _setFullState({
          guests: data.guests ?? [],
          tables: data.tables ?? [],
          constraints: data.constraints ?? [],
          groups: data.groups ?? [],
        })
      }
      initialLoadDone.current = true
    }

    loadChart()
  }, [user?.id])

  // Debounced save to Supabase whenever store data changes
  useEffect(() => {
    if (!supabase || !user || !initialLoadDone.current) return

    setSaveStatus('saving')
    clearTimeout(syncTimeout.current)
    clearTimeout(savedTimeout.current)

    syncTimeout.current = setTimeout(async () => {
      const { error } = await supabase.from('charts').upsert({
        user_id: user.id,
        guests,
        tables,
        constraints,
        groups,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      if (error) {
        setSaveStatus('error')
      } else {
        setSaveStatus('saved')
        savedTimeout.current = setTimeout(() => setSaveStatus('idle'), 2000)
      }
    }, 1200)

    return () => {
      clearTimeout(syncTimeout.current)
      clearTimeout(savedTimeout.current)
    }
  }, [guests, tables, constraints, groups, user?.id])

  return { saveStatus }
}
