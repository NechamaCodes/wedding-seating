const PALETTE = [
  '#A855F7', '#38BDF8', '#34D399', '#FB923C',
  '#F87171', '#FBBF24', '#22D3EE', '#818CF8',
  '#E879F9', '#86EFAC',
]

const PALETTE_BG = [
  '#D8B4FE', '#BAE6FD', '#BBF7D0', '#FED7AA',
  '#FECACA', '#FEF08A', '#A5F3FC', '#DDD6FE',
  '#FBCFE8', '#D9F99D',
]

const PALETTE_TEXT = [
  '#5B21B6', '#0369A1', '#166534', '#92400E',
  '#991B1B', '#854D0E', '#164E63', '#4C1D95',
  '#9D174D', '#3F6212',
]

function hashGroup(group) {
  if (!group) return -1
  let hash = 0
  for (let i = 0; i < group.length; i++) {
    hash = (hash * 31 + group.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(hash) % PALETTE.length
}

/** Returns a hex color string for use on dark backgrounds (graph nodes, etc.) */
export function groupColor(group) {
  if (!group) return '#B0B0B0'
  return PALETTE[hashGroup(group)]
}

/** Returns { bg, text } for badge-style pill */
export function groupBadgeColors(group) {
  if (!group) return { bg: '#E8E8E8', text: '#909090' }
  const i = hashGroup(group)
  return { bg: PALETTE_BG[i], text: PALETTE_TEXT[i] }
}
