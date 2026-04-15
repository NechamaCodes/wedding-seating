import { useState, useRef } from 'react'
import useStore from '../../store/useStore'
import TableCard from './TableCard'
import TableModal from './TableModal'

const MIN_ZOOM = 0.4
const MAX_ZOOM = 1.4
const ZOOM_STEP = 0.15

export default function TableGrid({ DroppableWrapper, activeTableId, flashTableId }) {
  const tables = useStore((s) => s.tables)
  const guests = useStore((s) => s.guests)
  const [modalTableId, setModalTableId] = useState(null)
  const [zoom, setZoom] = useState(1)

  function zoomIn() { setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2))) }
  function zoomOut() { setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2))) }
  function zoomReset() { setZoom(1) }

  if (tables.length === 0 || guests.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', flexDirection: 'column', gap: '0.75rem',
        padding: '2rem',
      }}>
        <div style={{ fontSize: '2.5rem' }}>🪑</div>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>
          {tables.length === 0 ? 'No tables yet' : 'No guests yet'}
        </div>
        <div style={{ fontSize: '0.875rem', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
          {tables.length === 0
            ? 'Go to Setup → Step 2 to add tables, then come back here to seat your guests.'
            : 'Go to Setup → Step 1 to add guests, then drag them to tables here.'}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Zoom controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.4rem 1rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
      }}>
        <button onClick={zoomOut} disabled={zoom <= MIN_ZOOM} style={zoomBtnStyle}>−</button>
        <button onClick={zoomReset} style={{ ...zoomBtnStyle, minWidth: 48, fontSize: '0.72rem' }}>
          {Math.round(zoom * 100)}%
        </button>
        <button onClick={zoomIn} disabled={zoom >= MAX_ZOOM} style={zoomBtnStyle}>+</button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'auto',
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: `${2 * zoom}rem`,
          padding: `${1.5 * zoom}rem`,
          alignContent: 'flex-start',
          transformOrigin: 'top left',
          minHeight: '100%',
        }}>
          {tables.map((table) =>
            DroppableWrapper ? (
              <DroppableWrapper
                key={table.id}
                table={table}
                flash={flashTableId === table.id}
                onClickInfo={() => setModalTableId(table.id)}
                zoom={zoom}
              />
            ) : (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => setModalTableId(table.id)}
                zoom={zoom}
              />
            )
          )}
        </div>
      </div>

      {modalTableId && (
        <TableModal tableId={modalTableId} onClose={() => setModalTableId(null)} />
      )}
    </>
  )
}

const zoomBtnStyle = {
  width: 28, height: 28,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'var(--surface)',
  border: '1.5px solid var(--border)',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: '0.9rem',
  color: 'var(--text)',
  fontWeight: 600,
  transition: 'background 0.1s',
}
