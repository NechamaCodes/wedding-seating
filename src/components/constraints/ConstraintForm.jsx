import { useState } from 'react'
import useStore from '../../store/useStore'
import Button from '../ui/Button'

function GuestSearch({ value, onChange, placeholder, excludeId }) {
  const guests = useStore((s) => s.guests)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const selected = guests.find((g) => g.id === value)

  const filtered = guests.filter(
    (g) => g.id !== excludeId && g.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8)

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <input
        value={selected ? selected.name : query}
        onFocus={() => { setOpen(true); if (selected) setQuery('') }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(null)
          setOpen(true)
        }}
        placeholder={placeholder}
      />
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          zIndex: 50,
          maxHeight: 200,
          overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No guests found</div>
          ) : (
            filtered.map((g) => (
              <div
                key={g.id}
                onMouseDown={() => { onChange(g.id); setQuery(''); setOpen(false) }}
                style={{
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  borderBottom: '1px solid var(--border)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = ''}
              >
                {g.name}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>({g.group})</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function ConstraintForm() {
  const addConstraint = useStore((s) => s.addConstraint)
  const [type, setType] = useState('cannot-sit-together')
  const [guest1, setGuest1] = useState(null)
  const [guest2, setGuest2] = useState(null)

  function handleAdd() {
    if (!guest1 || !guest2 || guest1 === guest2) return
    addConstraint(type, guest1, guest2)
    setGuest1(null)
    setGuest2(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setType('cannot-sit-together')}
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: 'var(--radius)',
            border: `2px solid ${type === 'cannot-sit-together' ? 'var(--danger)' : 'var(--border)'}`,
            background: type === 'cannot-sit-together' ? '#FEE2E2' : 'var(--surface)',
            color: type === 'cannot-sit-together' ? 'var(--danger)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.82rem',
          }}
        >
          ✗ Cannot sit together
        </button>
        <button
          type="button"
          onClick={() => setType('must-sit-together')}
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: 'var(--radius)',
            border: `2px solid ${type === 'must-sit-together' ? 'var(--success)' : 'var(--border)'}`,
            background: type === 'must-sit-together' ? '#DCFCE7' : 'var(--surface)',
            color: type === 'must-sit-together' ? 'var(--success)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.82rem',
          }}
        >
          ✓ Must sit together
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <GuestSearch value={guest1} onChange={setGuest1} placeholder="First guest..." excludeId={guest2} />
        <span style={{ color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>&</span>
        <GuestSearch value={guest2} onChange={setGuest2} placeholder="Second guest..." excludeId={guest1} />
      </div>

      <Button
        variant="primary"
        onClick={handleAdd}
        disabled={!guest1 || !guest2 || guest1 === guest2}
      >
        Add rule
      </Button>
    </div>
  )
}
