import { groupBadgeColors } from '../../utils/groupColor'

export default function Badge({ group, style }) {
  if (!group) return null
  const { bg, text } = groupBadgeColors(group)
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.15rem 0.55rem',
      borderRadius: '999px',
      fontSize: '0.72rem',
      fontWeight: 600,
      letterSpacing: '0.03em',
      background: bg,
      color: text,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {group}
    </span>
  )
}
