import Badge from '../ui/Badge'
import useStore from '../../store/useStore'
import { groupColor } from '../../utils/groupColor'

export default function GuestCard({ guest, onEdit, compact = false, dragHandleProps = {}, isDragging = false }) {
  const removeGuest = useStore((s) => s.removeGuest)
  const tables = useStore((s) => s.tables)
  const assignedTable = tables.find((t) => t.id === guest.tableId)

  const initials = guest.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const color = groupColor(guest.group)

  // Slim drag-friendly row for the seating sidebar
  if (compact) {
    return (
      <div
        {...dragHandleProps}
        title={guest.name + (guest.group ? ` · ${guest.group}` : '')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.6rem',
          background: isDragging ? 'var(--surface-hover)' : 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1.5px solid var(--border)',
          boxShadow: isDragging ? 'var(--shadow-lg)' : 'none',
          cursor: 'grab',
          userSelect: 'none',
          transition: 'box-shadow 0.1s',
        }}
      >
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: '0.8rem',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: 'var(--text)',
          flex: 1,
          minWidth: 0,
        }}>
          {guest.name}
        </span>
      </div>
    )
  }

  // Full card for setup view
  return (
    <div
      {...dragHandleProps}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.65rem 0.9rem',
        background: isDragging ? 'var(--surface-hover)' : 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1.5px solid var(--border)',
        boxShadow: isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        cursor: 'grab',
        transition: 'box-shadow 0.15s',
        userSelect: 'none',
      }}
    >
      {/* Avatar */}
      {guest.headshotUrl ? (
        <img
          src={guest.headshotUrl}
          alt=""
          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }}
        />
      ) : (
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: `${color}22`, color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700,
          border: `2px solid ${color}44`,
        }}>
          {initials}
        </div>
      )}

      {/* Name and meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {guest.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
          <Badge group={guest.group} />
          {assignedTable && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {assignedTable.name}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(guest.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '0.2rem', color: 'var(--text-muted)' }}
            title="Edit"
          >
            ✏️
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); removeGuest(guest.id) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '0.2rem', color: 'var(--text-muted)' }}
          title="Remove"
        >
          🗑
        </button>
      </div>
    </div>
  )
}
