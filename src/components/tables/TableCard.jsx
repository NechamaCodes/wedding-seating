import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import useStore from '../../store/useStore'
import { groupColor } from '../../utils/groupColor'

function DraggableSeat({ guest, tableId, style }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `seated-${guest.id}`,
    data: { guestId: guest.id, sourceTableId: tableId },
  })

  const initials = guest.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const color = groupColor(guest.group)

  // Combine the seat's positioning transform with the drag offset
  const positionTransform = style.transform || ''
  const dragTransform = CSS.Translate.toString(transform) || ''
  const combinedTransform = [positionTransform, dragTransform].filter(Boolean).join(' ')

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title={guest.name + (guest.group ? ` (${guest.group})` : '')}
      style={{
        ...style,
        opacity: isDragging ? 0.35 : 1,
        cursor: 'grab',
        transform: combinedTransform,
        zIndex: isDragging ? 100 : 1,
        background: `${color}22`,
        border: `2px solid ${color}`,
        color: color,
      }}
    >
      {guest.headshotUrl ? (
        <img src={guest.headshotUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

function EmptySeat({ style }) {
  return <div title="Empty seat" style={style} />
}

export default function TableCard({ table, isOver = false, flash = false, onClick, droppableProps = {}, zoom = 1 }) {
  const [hovered, setHovered] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(table.name)
  const guests = useStore((s) => s.guests)
  const updateTable = useStore((s) => s.updateTable)
  const constraints = useStore((s) => s.constraints)
  const seatedGuests = table.guestIds.map((id) => guests.find((g) => g.id === id)).filter(Boolean)
  const emptySeats = Math.max(0, table.seatCount - seatedGuests.length)

  const isRound = table.shape === 'round'
  const size = Math.round((isRound ? 140 : 160) * zoom)
  const height = Math.round((isRound ? 140 : 110) * zoom)
  const isFull = seatedGuests.length >= table.seatCount
  const isEmpty = seatedGuests.length === 0
  const fillRatio = seatedGuests.length / table.seatCount

  // Constraint violation check for this table
  const hasViolation = (() => {
    const cannotPairs = constraints.filter((c) => c.type === 'cannot-sit-together')
    for (const pair of cannotPairs) {
      const [a, b] = pair.guestIds
      if (seatedGuests.find((g) => g.id === a) && seatedGuests.find((g) => g.id === b)) return true
    }
    return false
  })()

  function getSeatPositions() {
    const positions = []
    const total = table.seatCount
    if (isRound) {
      for (let i = 0; i < total; i++) {
        const angle = (360 / total) * i - 90
        const x = Math.cos((angle * Math.PI) / 180) * 58
        const y = Math.sin((angle * Math.PI) / 180) * 58
        positions.push({ x, y, size: 32 })
      }
    } else {
      const half = Math.ceil(total / 2)
      for (let i = 0; i < total; i++) {
        const isTop = i < half
        const idx = isTop ? i : i - half
        const count = isTop ? half : total - half
        const x = (idx / Math.max(count - 1, 1) - 0.5) * (size - 40)
        const y = isTop ? -50 : 50
        positions.push({ x, y, size: 28 })
      }
    }
    return positions
  }

  const positions = getSeatPositions()
  const allSlots = [
    ...seatedGuests.map((g, i) => ({ guest: g, pos: positions[i] })),
    ...Array(emptySeats).fill(null).map((_, i) => ({
      guest: null,
      pos: positions[seatedGuests.length + i],
    })),
  ]

  function seatBaseStyle(pos, isOccupied) {
    return {
      position: 'absolute',
      width: pos.size,
      height: pos.size,
      borderRadius: '50%',
      left: '50%',
      top: '50%',
      transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
      background: isOccupied ? 'var(--purple-light)' : 'var(--silver-light)',
      border: `2px solid ${isOccupied ? 'var(--purple-mid)' : 'var(--silver)'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: pos.size <= 28 ? '0.6rem' : '0.65rem',
      fontWeight: 700,
      color: 'var(--purple-dark)',
      overflow: 'hidden',
      userSelect: 'none',
    }
  }

  // Table surface border/bg based on state
  let tableBorderColor = 'var(--border)'
  let tableBg = 'var(--surface)'
  if (flash) { tableBorderColor = 'var(--success)'; tableBg = '#dcfce7' }
  else if (isOver) { tableBorderColor = 'var(--purple-mid)'; tableBg = 'var(--purple-light)' }
  else if (hasViolation) { tableBorderColor = 'var(--danger)'; tableBg = '#FFF0F0' }
  else if (isFull) { tableBorderColor = '#9CA3AF'; tableBg = 'var(--silver-light)' }
  else if (table.isLocked) { tableBorderColor = 'var(--silver-dark)'; tableBg = 'var(--silver-light)' }
  else if (hovered) { tableBorderColor = 'var(--purple-mid)' }

  return (
    <div
      {...droppableProps}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: size,
        height: height + 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'transform 0.12s',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* Table surface */}
      <div style={{ position: 'relative', width: size, height, flexShrink: 0 }}>
        {/* Table shape */}
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: isRound ? 70 : 100,
          height: isRound ? 70 : 50,
          borderRadius: isRound ? '50%' : 8,
          background: tableBg,
          border: `2.5px solid ${tableBorderColor}`,
          boxShadow: hovered || isOver ? 'var(--shadow)' : 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
          zIndex: 0,
        }}>
          {table.isLocked && <span style={{ fontSize: '0.75rem' }}>🔒</span>}
        </div>

        {/* Constraint violation indicator */}
        {hasViolation && (
          <div
            title="Constraint violation at this table"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(18px, -42px)',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'var(--danger)',
              border: '2px solid white',
              zIndex: 10,
              fontSize: '0.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
            }}
          >
            !
          </div>
        )}

        {/* Seats */}
        {allSlots.map(({ guest, pos }, i) => {
          if (!pos) return null
          const base = seatBaseStyle(pos, !!guest)
          if (guest) {
            return (
              <DraggableSeat
                key={guest.id}
                guest={guest}
                tableId={table.id}
                style={base}
              />
            )
          }
          return <EmptySeat key={`empty-${i}`} style={base} />
        })}
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center', marginTop: 4 }} onClick={(e) => e.stopPropagation()}>
        {editingName ? (
          <input
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={() => {
              const trimmed = nameValue.trim()
              if (trimmed) updateTable(table.id, { name: trimmed })
              else setNameValue(table.name)
              setEditingName(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.target.blur()
              if (e.key === 'Escape') { setNameValue(table.name); setEditingName(false) }
            }}
            style={{
              fontSize: '0.8rem', fontWeight: 600, textAlign: 'center',
              border: 'none', borderBottom: '1.5px solid var(--purple-mid)',
              background: 'transparent', outline: 'none', width: '100%',
              color: 'var(--text)',
            }}
          />
        ) : (
          <div
            title="Click to rename"
            onClick={() => setEditingName(true)}
            style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', cursor: 'text' }}
          >
            {table.name}
          </div>
        )}
        <div style={{
          fontSize: '0.7rem',
          color: hasViolation ? 'var(--danger)' : isFull ? 'var(--text-muted)' : isEmpty ? '#CBD5E1' : 'var(--text-muted)',
          fontWeight: hasViolation ? 600 : 400,
        }}>
          {hasViolation ? '⚠ conflict' : isFull ? `Full (${table.seatCount})` : `${seatedGuests.length}/${table.seatCount} seats`}
        </div>
      </div>  {/* end label */}
    </div>
  )
}
