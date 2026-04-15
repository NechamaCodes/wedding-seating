import useStore from '../../store/useStore'
import Button from '../ui/Button'

export default function TableSettings() {
  const tables = useStore((s) => s.tables)
  const guests = useStore((s) => s.guests)
  const setTableCount = useStore((s) => s.setTableCount)
  const updateTable = useStore((s) => s.updateTable)
  const addTable = useStore((s) => s.addTable)
  const removeTable = useStore((s) => s.removeTable)

  const totalSeats = tables.reduce((sum, t) => sum + t.seatCount, 0)
  const totalGuests = guests.length
  const seatedGuests = guests.filter((g) => g.tableId).length

  function handleCountChange(e) {
    const n = parseInt(e.target.value, 10)
    if (n >= 0 && n <= 100) setTableCount(n)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Summary row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.75rem',
      }}>
        {[
          { label: 'Guests', value: totalGuests, color: 'var(--purple-mid)' },
          { label: 'Seated', value: seatedGuests, color: 'var(--success)' },
          { label: 'Total seats', value: totalSeats, color: totalSeats < totalGuests ? 'var(--danger)' : 'var(--success)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '0.75rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table count control */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <label style={labelStyle}>Number of tables</label>
        <input
          type="number"
          min={0}
          max={100}
          value={tables.length}
          onChange={handleCountChange}
          style={{ width: 80, flexShrink: 0 }}
        />
        <Button variant="secondary" size="sm" onClick={() => addTable()}>+ Add table</Button>
      </div>

      {/* Per-table settings */}
      {tables.length > 0 && (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Table details
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 320, overflowY: 'auto' }}>
            {tables.map((table) => (
              <div key={table.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.6rem 0.75rem',
                background: 'var(--surface)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                flexWrap: 'wrap',
              }}>
                <input
                  value={table.name}
                  onChange={(e) => updateTable(table.id, { name: e.target.value })}
                  style={{ width: 120, flexShrink: 0 }}
                />

                <select
                  value={table.shape}
                  onChange={(e) => updateTable(table.id, { shape: e.target.value })}
                  style={{ width: 120, flexShrink: 0 }}
                >
                  <option value="round">Round</option>
                  <option value="rectangular">Rectangular</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Seats:</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={table.seatCount}
                    onChange={(e) => updateTable(table.id, { seatCount: parseInt(e.target.value, 10) || 1 })}
                    style={{ width: 60 }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={table.isLocked}
                    onChange={(e) => updateTable(table.id, { isLocked: e.target.checked })}
                    style={{ width: 'auto' }}
                  />
                  Locked
                </label>

                <button
                  onClick={() => removeTable(table.id)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.85rem' }}
                  title="Remove table"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--text)',
  flexShrink: 0,
}
