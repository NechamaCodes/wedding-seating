import { useDroppable } from '@dnd-kit/core'
import TableCard from '../tables/TableCard'

export default function DroppableTable({ table, onClickInfo }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `table-${table.id}`,
    data: { tableId: table.id },
  })

  return (
    <div ref={setNodeRef}>
      <TableCard
        table={table}
        isOver={isOver}
        onClick={onClickInfo}
      />
    </div>
  )
}
