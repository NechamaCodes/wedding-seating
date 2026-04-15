import { useState } from 'react'
import useStore from '../../store/useStore'
import TableCard from './TableCard'
import TableModal from './TableModal'

export default function TableGrid({ DroppableWrapper, activeTableId }) {
  const tables = useStore((s) => s.tables)
  const [modalTableId, setModalTableId] = useState(null)

  if (tables.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', flexDirection: 'column', gap: '0.5rem',
      }}>
        <div style={{ fontSize: '2rem' }}>🪑</div>
        <div style={{ fontSize: '0.9rem' }}>No tables yet. Go to Setup to add tables.</div>
      </div>
    )
  }

  return (
    <>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '2rem',
        padding: '1.5rem',
        alignContent: 'flex-start',
        flex: 1,
        overflowY: 'auto',
      }}>
        {tables.map((table) =>
          DroppableWrapper ? (
            <DroppableWrapper
              key={table.id}
              table={table}
              onClickInfo={() => setModalTableId(table.id)}
            />
          ) : (
            <TableCard
              key={table.id}
              table={table}
              onClick={() => setModalTableId(table.id)}
            />
          )
        )}
      </div>

      {modalTableId && (
        <TableModal tableId={modalTableId} onClose={() => setModalTableId(null)} />
      )}
    </>
  )
}
