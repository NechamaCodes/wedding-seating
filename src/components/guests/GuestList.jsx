import { useState, useRef } from 'react'
import useStore from '../../store/useStore'
import GuestCard from './GuestCard'
import GuestForm from './GuestForm'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function GuestList({ draggable = false, DraggableWrapper, compact = false }) {
  const guests = useStore((s) => s.guests)
  const groups = useStore((s) => s.groups)
  const addGuest = useStore((s) => s.addGuest)
  const [editId, setEditId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [seatedOpen, setSeatedOpen] = useState(false)
  const [quickName, setQuickName] = useState('')
  const quickInputRef = useRef(null)

  const filtered = guests.filter((g) => {
    const matchName = g.name.toLowerCase().includes(filter.toLowerCase())
    const matchGroup = groupFilter === 'all' || g.group === groupFilter
    return matchName && matchGroup
  })

  const unassigned = filtered.filter((g) => !g.tableId)
  const assigned = filtered.filter((g) => g.tableId)

  function renderGuest(g) {
    if (draggable && DraggableWrapper) {
      return <DraggableWrapper key={g.id} guest={g} onEdit={setEditId} compact={compact} />
    }
    return <GuestCard key={g.id} guest={g} onEdit={setEditId} compact={compact} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minHeight: 0 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search guests..."
          style={{ flex: 1 }}
        />
        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} style={{ width: 'auto', flexShrink: 0 }}>
          <option value="all">All groups</option>
          {groups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
          <option value="">No group</option>
        </select>
      </div>

      {/* Stats */}
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
        <span>{guests.length} total</span>
        <span style={{ color: 'var(--success)' }}>{assigned.length} seated</span>
        <span style={{ color: 'var(--warning)' }}>{unassigned.length} unassigned</span>
      </div>

      {/* Guest list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {unassigned.length === 0 && assigned.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.875rem' }}>
            No guests yet. Add one below or import a CSV.
          </div>
        )}

        {unassigned.length > 0 && (
          <>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Unassigned ({unassigned.length})
            </div>
            {unassigned.map(renderGuest)}
          </>
        )}

        {assigned.length > 0 && (
          <>
            <button
              onClick={() => setSeatedOpen((o) => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: '0.5rem',
                marginBottom: seatedOpen ? '0.25rem' : 0,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span style={{ display: 'inline-block', transition: 'transform 0.15s', transform: seatedOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
              Seated ({assigned.length})
            </button>
            {seatedOpen && assigned.map(renderGuest)}
          </>
        )}
      </div>

      {!compact && (
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          <input
            ref={quickInputRef}
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && quickName.trim()) {
                addGuest({ name: quickName.trim() })
                setQuickName('')
                quickInputRef.current?.focus()
              }
            }}
            placeholder="Quick add — type name, press Enter"
            style={{ flex: 1, fontSize: '0.82rem' }}
          />
          <Button variant="secondary" size="sm" onClick={() => setShowAdd(true)} title="Add with full details">
            ⋯
          </Button>
        </div>
      )}

      {showAdd && (
        <Modal title="Add guest" onClose={() => setShowAdd(false)}>
          <GuestForm onClose={() => setShowAdd(false)} />
        </Modal>
      )}

      {editId && (
        <Modal title="Edit guest" onClose={() => setEditId(null)}>
          <GuestForm editId={editId} onClose={() => setEditId(null)} />
        </Modal>
      )}
    </div>
  )
}
