import useStore from '../../store/useStore'
import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

export default function TableModal({ tableId, onClose }) {
  const tables = useStore((s) => s.tables)
  const guests = useStore((s) => s.guests)
  const updateTable = useStore((s) => s.updateTable)
  const unassignGuest = useStore((s) => s.unassignGuest)

  const table = tables.find((t) => t.id === tableId)
  if (!table) return null

  const seatedGuests = table.guestIds
    .map((id) => guests.find((g) => g.id === id))
    .filter(Boolean)

  const emptyCount = Math.max(0, table.seatCount - seatedGuests.length)

  return (
    <Modal title={table.name} onClose={onClose} width={520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Table meta */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>Shape: <strong style={{ color: 'var(--text)' }}>{table.shape}</strong></span>
          <span>Seats: <strong style={{ color: 'var(--text)' }}>{table.seatCount}</strong></span>
          <span>Filled: <strong style={{ color: seatedGuests.length >= table.seatCount ? 'var(--danger)' : 'var(--success)' }}>
            {seatedGuests.length}/{table.seatCount}
          </strong></span>
          <span>Status: <strong style={{ color: table.isLocked ? 'var(--warning)' : 'var(--success)' }}>
            {table.isLocked ? '🔒 Locked' : 'Unlocked'}
          </strong></span>
        </div>

        <Button
          variant={table.isLocked ? 'success' : 'secondary'}
          size="sm"
          onClick={() => updateTable(tableId, { isLocked: !table.isLocked })}
          style={{ alignSelf: 'flex-start' }}
        >
          {table.isLocked ? '🔓 Unlock table' : '🔒 Lock table'}
        </Button>

        {/* Guest headshots grid */}
        {seatedGuests.length > 0 && (
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Seated guests
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
              {seatedGuests.map((guest) => (
                <div key={guest.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', textAlign: 'center' }}>
                  {guest.headshotUrl ? (
                    <img
                      src={guest.headshotUrl}
                      alt={guest.name}
                      style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid var(--purple-light)' }}
                    />
                  ) : (
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: 'var(--purple-light)', color: 'var(--purple-dark)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: 700,
                      border: '2.5px solid var(--border)',
                    }}>
                      {guest.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                  )}
                  <div style={{ fontSize: '0.78rem', fontWeight: 500, lineHeight: 1.3 }}>{guest.name}</div>
                  <Badge group={guest.group} />
                  <button
                    onClick={() => unassignGuest(guest.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--danger)', padding: '0.1rem' }}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {/* Empty seat placeholders */}
              {Array(emptyCount).fill(null).map((_, i) => (
                <div key={`empty-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'var(--silver-light)',
                    border: '2px dashed var(--silver)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--silver-dark)', fontSize: '1.2rem',
                  }}>
                    +
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Empty</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {seatedGuests.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', fontSize: '0.875rem' }}>
            No guests seated here yet. Drag guests from the sidebar to assign them.
          </div>
        )}
      </div>
    </Modal>
  )
}
