import { create } from 'zustand'
import { v4 as uuid } from 'uuid'

const STORAGE_KEY = 'wedding-seating-v1'
const MAX_HISTORY = 30

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveState(state) {
  try {
    const { guests, tables, constraints, groups } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ guests, tables, constraints, groups }))
  } catch {}
}

function snapshot(s) {
  return {
    guests: s.guests,
    tables: s.tables,
    constraints: s.constraints,
    groups: s.groups,
  }
}

const defaultState = {
  guests: [],
  tables: [],
  constraints: [],
  groups: [],
  activeView: 'setup',
  selectedTableId: null,
  _history: [],   // undo stack — not persisted
}

const saved = loadState()

const useStore = create((set, get) => ({
  ...defaultState,
  ...(saved || {}),
  activeView: 'setup',
  selectedTableId: null,
  _history: [],

  // --- Undo ---
  _pushHistory: () => set((s) => ({
    _history: [...s._history.slice(-MAX_HISTORY), snapshot(s)],
  })),

  undo: () => set((s) => {
    if (s._history.length === 0) return s
    const prev = s._history[s._history.length - 1]
    saveState(prev)
    return { ...prev, _history: s._history.slice(0, -1) }
  }),

  canUndo: () => get()._history.length > 0,

  // --- Navigation ---
  setActiveView: (view) => set({ activeView: view }),
  setSelectedTableId: (id) => set({ selectedTableId: id }),

  // --- Groups ---
  addGroup: (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    set((s) => {
      if (s.groups.includes(trimmed)) return s
      const next = { groups: [...s.groups, trimmed] }
      saveState({ ...s, ...next })
      return next
    })
  },

  removeGroup: (name) =>
    set((s) => {
      const next = { groups: s.groups.filter((g) => g !== name) }
      saveState({ ...s, ...next })
      return next
    }),

  // --- Guests ---
  addGuest: (data) => {
    const guest = { id: uuid(), name: '', group: '', headshotUrl: null, relationships: [], tableId: null, ...data }
    set((s) => {
      const groups = guest.group && !s.groups.includes(guest.group) ? [...s.groups, guest.group] : s.groups
      const next = { guests: [...s.guests, guest], groups, _history: [...s._history.slice(-MAX_HISTORY), snapshot(s)] }
      saveState({ ...s, ...next })
      return next
    })
    return guest.id
  },

  updateGuest: (id, changes) =>
    set((s) => {
      const guests = s.guests.map((g) => (g.id === id ? { ...g, ...changes } : g))
      const groups = changes.group && !s.groups.includes(changes.group) ? [...s.groups, changes.group] : s.groups
      const next = { guests, groups, _history: [...s._history.slice(-MAX_HISTORY), snapshot(s)] }
      saveState({ ...s, ...next })
      return next
    }),

  addRelationship: (guestId, relatedId) =>
    set((s) => {
      const guests = s.guests.map((g) => {
        if (g.id === guestId && !g.relationships.includes(relatedId)) return { ...g, relationships: [...g.relationships, relatedId] }
        if (g.id === relatedId && !g.relationships.includes(guestId)) return { ...g, relationships: [...g.relationships, guestId] }
        return g
      })
      const next = { guests, _history: [...s._history.slice(-MAX_HISTORY), snapshot(s)] }
      saveState({ ...s, ...next })
      return next
    }),

  removeRelationship: (guestId, relatedId) =>
    set((s) => {
      const guests = s.guests.map((g) => {
        if (g.id === guestId) return { ...g, relationships: g.relationships.filter((id) => id !== relatedId) }
        if (g.id === relatedId) return { ...g, relationships: g.relationships.filter((id) => id !== guestId) }
        return g
      })
      const next = { guests, _history: [...s._history.slice(-MAX_HISTORY), snapshot(s)] }
      saveState({ ...s, ...next })
      return next
    }),

  removeGuest: (id) =>
    set((s) => {
      const tables = s.tables.map((t) => ({ ...t, guestIds: t.guestIds.filter((gid) => gid !== id) }))
      const guests = s.guests.filter((g) => g.id !== id).map((g) => ({ ...g, relationships: g.relationships.filter((r) => r !== id) }))
      const constraints = s.constraints.filter((c) => !c.guestIds.includes(id))
      const next = { guests, tables, constraints, _history: [...s._history.slice(-MAX_HISTORY), snapshot(s)] }
      saveState({ ...s, ...next })
      return next
    }),

  importGuests: (guestArray) =>
    set((s) => {
      const newGuests = guestArray.map((data) => ({ id: uuid(), name: data.name || '', group: data.group || '', headshotUrl: null, relationships: [], tableId: null }))
      const allGuests = [...s.guests, ...newGuests]
      const nameToId = {}
      allGuests.forEach((g) => { nameToId[g.name.toLowerCase().trim()] = g.id })
      const resolved = newGuests.map((g, i) => {
        const raw = guestArray[i]
        const knowsList = raw.knows ? raw.knows.split(',').map((n) => n.trim().toLowerCase()).filter(Boolean) : []
        const relIds = knowsList.map((n) => nameToId[n]).filter((id) => id && id !== g.id)
        return { ...g, relationships: relIds }
      })
      const updatedExisting = s.guests.map((g) => {
        const newRels = resolved.filter((ng) => ng.relationships.includes(g.id)).map((ng) => ng.id)
        return { ...g, relationships: [...new Set([...g.relationships, ...newRels])] }
      })
      const importedGroups = [...new Set(newGuests.map((g) => g.group).filter(Boolean))]
      const groups = [...new Set([...s.groups, ...importedGroups])]
      const next = { guests: [...updatedExisting, ...resolved], groups, _history: [...s._history.slice(-MAX_HISTORY), snapshot(s)] }
      saveState({ ...s, ...next })
      return next
    }),

  // --- Tables ---
  addTable: (data = {}) => {
    const table = { id: uuid(), name: `Table ${get().tables.length + 1}`, shape: 'round', seatCount: 8, isLocked: false, guestIds: [], ...data }
    set((s) => {
      const next = { tables: [...s.tables, table], _history: [...s._history.slice(-MAX_HISTORY), snapshot(s)] }
      saveState({ ...s, ...next })
      return next
    })
    return table.id
  },

  updateTable: (id, changes) =>
    set((s) => {
      const next = { tables: s.tables.map((t) => (t.id === id ? { ...t, ...changes } : t)) }
      saveState({ ...s, ...next })
      return next
    }),

  removeTable: (id) =>
    set((s) => {
      const guests = s.guests.map((g) => (g.tableId === id ? { ...g, tableId: null } : g))
      const tables = s.tables.filter((t) => t.id !== id)
      const next = { guests, tables, _history: [...s._history.slice(-MAX_HISTORY), snapshot(s)] }
      saveState({ ...s, ...next })
      return next
    }),

  setTableCount: (n) =>
    set((s) => {
      let tables = [...s.tables]
      let guests = [...s.guests]
      const current = tables.length
      if (n > current) {
        for (let i = current; i < n; i++) {
          tables.push({ id: uuid(), name: `Table ${i + 1}`, shape: 'round', seatCount: 8, isLocked: false, guestIds: [] })
        }
      } else if (n < current) {
        const removedIds = tables.slice(n).map((t) => t.id)
        guests = guests.map((g) => removedIds.includes(g.tableId) ? { ...g, tableId: null } : g)
        tables = tables.slice(0, n)
      }
      const next = { tables, guests, _history: [...s._history.slice(-MAX_HISTORY), snapshot(s)] }
      saveState({ ...s, ...next })
      return next
    }),

  assignGuestToTable: (guestId, tableId) =>
    set((s) => {
      const guests = s.guests.map((g) => g.id === guestId ? { ...g, tableId } : g)
      const tables = s.tables.map((t) => {
        let ids = t.guestIds.filter((id) => id !== guestId)
        if (t.id === tableId) ids = [...ids, guestId]
        return { ...t, guestIds: ids }
      })
      const next = { guests, tables, _history: [...s._history.slice(-MAX_HISTORY), snapshot(s)] }
      saveState({ ...s, ...next })
      return next
    }),

  unassignGuest: (guestId) =>
    set((s) => {
      const guests = s.guests.map((g) => g.id === guestId ? { ...g, tableId: null } : g)
      const tables = s.tables.map((t) => ({ ...t, guestIds: t.guestIds.filter((id) => id !== guestId) }))
      const next = { guests, tables, _history: [...s._history.slice(-MAX_HISTORY), snapshot(s)] }
      saveState({ ...s, ...next })
      return next
    }),

  // --- Constraints ---
  addConstraint: (type, guestId1, guestId2) => {
    const constraint = { id: uuid(), type, guestIds: [guestId1, guestId2] }
    set((s) => {
      const next = { constraints: [...s.constraints, constraint], _history: [...s._history.slice(-MAX_HISTORY), snapshot(s)] }
      saveState({ ...s, ...next })
      return next
    })
  },

  removeConstraint: (id) =>
    set((s) => {
      const next = { constraints: s.constraints.filter((c) => c.id !== id), _history: [...s._history.slice(-MAX_HISTORY), snapshot(s)] }
      saveState({ ...s, ...next })
      return next
    }),

  reorderTables: (newOrder) =>
    set((s) => {
      const next = { tables: newOrder }
      saveState({ ...s, ...next })
      return next
    }),

  // --- Supabase sync ---
  // Called once after loading chart data from Supabase for authenticated users
  _setFullState: ({ guests, tables, constraints, groups }) => {
    const next = { guests, tables, constraints, groups }
    saveState(next)
    set({ ...next, _history: [] })
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ ...defaultState, _history: [] })
  },
}))

export default useStore
