import { useState, useCallback } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import useStore from '../store/useStore'
import { validateAssignment, getMustSitWarnings, getSeatingIssues } from '../utils/validation'
import GuestList from '../components/guests/GuestList'
import GuestCard from '../components/guests/GuestCard'
import TableGrid from '../components/tables/TableGrid'
import DraggableGuest from '../components/dnd/DraggableGuest'
import DroppableTable from '../components/dnd/DroppableTable'
import ValidationToast from '../components/ui/ValidationToast'

function DroppableSidebar({ children }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'sidebar' })
  return (
    <aside
      ref={setNodeRef}
      style={{
        width: 260,
        flexShrink: 0,
        borderRight: '1.5px solid var(--border)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        overflowY: 'auto',
        background: isOver ? 'var(--surface-hover)' : 'var(--surface)',
        transition: 'background 0.15s',
        outline: isOver ? '2px dashed var(--purple-mid)' : 'none',
        outlineOffset: '-4px',
      }}
    >
      {children}
    </aside>
  )
}

export default function SeatingView() {
  const guests = useStore((s) => s.guests)
  const tables = useStore((s) => s.tables)
  const assignGuestToTable = useStore((s) => s.assignGuestToTable)
  const unassignGuest = useStore((s) => s.unassignGuest)
  const state = useStore()

  const [activeGuest, setActiveGuest] = useState(null)
  const [toastMessages, setToastMessages] = useState(null)
  const [celebrationDismissed, setCelebrationDismissed] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const issues = getSeatingIssues(state)
  const errors = issues.filter((i) => i.type === 'error')
  const warnings = issues.filter((i) => i.type === 'warning')

  // Celebration state: all guests seated + no errors
  const totalGuests = guests.length
  const seatedGuests = guests.filter((g) => g.tableId).length
  const allSeated = totalGuests > 0 && seatedGuests === totalGuests && errors.length === 0

  function handleDragStart(event) {
    const guestId = event.active.data.current?.guestId
    if (guestId) setActiveGuest(guests.find((g) => g.id === guestId) || null)
  }

  function handleDragEnd(event) {
    setActiveGuest(null)
    const { active, over } = event
    const guestId = active.data.current?.guestId
    if (!guestId) return

    // Dropped on the sidebar → unassign
    if (over?.id === 'sidebar') {
      unassignGuest(guestId)
      return
    }

    // Dropped on a table
    const tableId = over?.data.current?.tableId
    if (!tableId) return

    // No-op if dropped on the same table they came from
    const sourceTableId = active.data.current?.sourceTableId
    if (sourceTableId === tableId) return

    const { valid, reasons } = validateAssignment(guestId, tableId, state)
    if (!valid) {
      setToastMessages(reasons)
      return
    }

    const mustWarnings = getMustSitWarnings(guestId, tableId, state)
    if (mustWarnings.length > 0) {
      setToastMessages(mustWarnings.map((w) => `⚠️ ${w}`))
    }

    assignGuestToTable(guestId, tableId)
  }

  const dismissToast = useCallback(() => setToastMessages(null), [])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Celebration banner */}
      {allSeated && !celebrationDismissed && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem 1.25rem',
          background: 'linear-gradient(90deg, #f0fdf4, #dcfce7)',
          borderBottom: '1.5px solid #86efac',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🎉</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#166534' }}>
              All {totalGuests} guests are seated — no conflicts!
            </span>
            {warnings.length > 0 && (
              <span style={{ fontSize: '0.78rem', color: '#854D0E' }}>
                ({warnings.length} preference warning{warnings.length > 1 ? 's' : ''})
              </span>
            )}
          </div>
          <button
            onClick={() => setCelebrationDismissed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: '1rem', lineHeight: 1, padding: '0.1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <DroppableSidebar>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Guests
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '0.35rem 0.5rem' }}>
              Drag to seat · drag back to unassign
            </div>
            <GuestList draggable compact DraggableWrapper={DraggableGuest} />
          </DroppableSidebar>

          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {(errors.length > 0 || warnings.length > 0) && (
              <div style={{
                padding: '0.6rem 1rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
                background: errors.length > 0 ? '#FEF2F2' : '#FFFBEB',
              }}>
                {errors.map((issue, i) => (
                  <span key={i} style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>✗ {issue.message}</span>
                ))}
                {warnings.map((issue, i) => (
                  <span key={i} style={{ fontSize: '0.78rem', color: 'var(--warning)' }}>⚠ {issue.message}</span>
                ))}
              </div>
            )}

            <TableGrid DroppableWrapper={DroppableTable} />
          </main>

          <DragOverlay>
            {activeGuest && <GuestCard guest={activeGuest} isDragging compact />}
          </DragOverlay>
        </DndContext>
      </div>

      {toastMessages && (
        <ValidationToast messages={toastMessages} onDismiss={dismissToast} />
      )}
    </div>
  )
}
