import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import GuestCard from '../guests/GuestCard'

export default function DraggableGuest({ guest, onEdit, compact = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `guest-${guest.id}`,
    data: { guestId: guest.id },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
    position: isDragging ? 'relative' : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <GuestCard guest={guest} isDragging={isDragging} onEdit={onEdit} compact={compact} />
    </div>
  )
}
