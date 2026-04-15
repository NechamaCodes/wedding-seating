import useStore from '../../store/useStore'

export default function ConstraintList() {
  const constraints = useStore((s) => s.constraints)
  const guests = useStore((s) => s.guests)
  const removeConstraint = useStore((s) => s.removeConstraint)

  if (constraints.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem 0', textAlign: 'center' }}>
        No rules yet. Add some above.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {constraints.map((c) => {
        const [a, b] = c.guestIds.map((id) => guests.find((g) => g.id === id))
        const isCannot = c.type === 'cannot-sit-together'

        return (
          <div key={c.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.55rem 0.75rem',
            background: isCannot ? '#FEF2F2' : '#F0FDF4',
            border: `1.5px solid ${isCannot ? '#FECACA' : '#BBF7D0'}`,
            borderRadius: 'var(--radius)',
            fontSize: '0.85rem',
          }}>
            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{isCannot ? '✗' : '✓'}</span>
            <span style={{ fontWeight: 600, color: isCannot ? 'var(--danger)' : 'var(--success)', flexShrink: 0 }}>
              {isCannot ? 'Cannot' : 'Must'}
            </span>
            <span style={{ flex: 1 }}>
              {a?.name || '(removed)'} &amp; {b?.name || '(removed)'}
            </span>
            <button
              onClick={() => removeConstraint(c.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.1rem', flexShrink: 0 }}
              title="Remove rule"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}
