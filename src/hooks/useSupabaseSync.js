import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import useStore from '../store/useStore'

/**
 * Syncs the Zustand store to Supabase when a user is authenticated.
 * - On sign-in: loads the user's chart from Supabase (overrides localStorage)
 * - On every state change: debounced upsert to Supabase
 */
export function useSupabaseSync(user) {
  const _setFullState = useStore((s) => s._setFullState)
  const guests = useStore((s) => s.guests)
  const tables = useStore((s) => s.tables)
  const constraints = useStore((s) => s.constraints)
  const groups = useStore((s) => s.groups)

  const syncTimeout = useRef(null)
  const initialLoadDone = useRef(false)

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

    clearTimeout(syncTimeout.current)
    syncTimeout.current = setTimeout(async () => {
      await supabase.from('charts').upsert({
        user_id: user.id,
        guests,
        tables,
        constraints,
        groups,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    }, 1200)

    return () => clearTimeout(syncTimeout.current)
  }, [guests, tables, constraints, groups, user?.id])
}
