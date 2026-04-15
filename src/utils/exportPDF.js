import { jsPDF } from 'jspdf'

const PURPLE = [120, 60, 237]   // var(--purple-dark)
const SILVER = [192, 192, 192]
const LIGHT_PURPLE = [216, 180, 254]
const TEXT = [30, 27, 46]
const TEXT_MUTED = [107, 105, 128]
const BORDER = [226, 217, 243]
const BG = [248, 246, 255]

// Group badge colors (bg rgb, text rgb)
const PALETTE_RGB = [
  [168, 85, 247],   // purple
  [56, 189, 248],   // blue
  [52, 211, 153],   // green
  [251, 146, 60],   // orange
  [248, 113, 113],  // red
  [251, 191, 36],   // yellow
  [34, 211, 238],   // cyan
  [129, 140, 248],  // indigo
  [232, 121, 249],  // pink
  [134, 239, 172],  // lime
]

function colorForGroup(group) {
  if (!group) return [192, 192, 192]
  let hash = 0
  for (let i = 0; i < group.length; i++) {
    hash = (hash * 31 + group.charCodeAt(i)) & 0xffffffff
  }
  return PALETTE_RGB[Math.abs(hash) % PALETTE_RGB.length]
}

export function exportSeatingPDF(guests, tables) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW = 210  // page width
  const PH = 297  // page height
  const margin = 14
  const colW = (PW - margin * 2 - 6) / 2  // two columns with 6mm gap
  const col2x = margin + colW + 6

  function addPage() {
    doc.addPage()
    return margin + 10
  }

  // ── Header ──────────────────────────────────────────────
  // Purple gradient bar
  doc.setFillColor(...PURPLE)
  doc.rect(0, 0, PW, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('💍 Wedding Seating Chart', margin, 14)

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(dateStr, PW - margin, 14, { align: 'right' })

  // ── Summary bar ────────────────────────────────────────
  const seatedCount = guests.filter((g) => g.tableId).length
  const totalSeats = tables.reduce((s, t) => s + t.seatCount, 0)

  doc.setFillColor(...BG)
  doc.rect(0, 22, PW, 12, 'F')
  doc.setFillColor(...BORDER)
  doc.rect(0, 33, PW, 0.4, 'F')

  doc.setTextColor(...TEXT_MUTED)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const stats = [
    `${guests.length} guests`,
    `${seatedCount} seated`,
    `${guests.length - seatedCount} unassigned`,
    `${tables.length} tables`,
    `${totalSeats} total seats`,
  ]
  const statW = (PW - margin * 2) / stats.length
  stats.forEach((s, i) => {
    doc.text(s, margin + statW * i + statW / 2, 29, { align: 'center' })
  })

  // ── Table cards ────────────────────────────────────────
  let y = 40
  let col = 0  // 0 = left, 1 = right

  function x() { return col === 0 ? margin : col2x }

  for (const table of tables) {
    const seatedGuests = table.guestIds
      .map((id) => guests.find((g) => g.id === id))
      .filter(Boolean)

    // Estimate card height: header (10) + guests (5.5 each) + padding (8)
    const cardH = 10 + seatedGuests.length * 5.5 + 8
    const minH = 24  // minimum card height even if empty

    const actualH = Math.max(cardH, minH)

    // Check if we need a new page
    if (y + actualH > PH - margin) {
      if (col === 0) {
        col = 1  // try right column first
        // Reset y to where left column started this row
        // Actually just start a new page
        doc.addPage()
        y = margin + 6
        col = 0
        drawPageHeader(doc, PW, margin)
      } else {
        doc.addPage()
        y = margin + 6
        col = 0
        drawPageHeader(doc, PW, margin)
      }
    }

    const cx = x()

    // Card background
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(cx, y, colW, actualH, 2, 2, 'F')
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.roundedRect(cx, y, colW, actualH, 2, 2, 'S')

    // Table name bar
    const isLocked = table.isLocked
    doc.setFillColor(...(isLocked ? SILVER : LIGHT_PURPLE))
    doc.roundedRect(cx, y, colW, 9, 2, 2, 'F')
    // Cover bottom rounded corners of header
    doc.setFillColor(...(isLocked ? SILVER : LIGHT_PURPLE))
    doc.rect(cx, y + 5, colW, 4, 'F')

    // Table name
    doc.setTextColor(...(isLocked ? [80, 80, 80] : PURPLE))
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(table.name, cx + 3, y + 6)

    // Shape + seat count on right
    const meta = `${table.shape === 'round' ? '○' : '▭'} ${seatedGuests.length}/${table.seatCount}${isLocked ? ' 🔒' : ''}`
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...(isLocked ? [80, 80, 80] : PURPLE))
    doc.text(meta, cx + colW - 3, y + 6, { align: 'right' })

    // Guest list
    let gy = y + 13
    if (seatedGuests.length === 0) {
      doc.setTextColor(...TEXT_MUTED)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7)
      doc.text('No guests seated', cx + 3, gy)
    } else {
      for (const guest of seatedGuests) {
        // Dot in group color
        const gc = colorForGroup(guest.group)
        doc.setFillColor(...gc)
        doc.circle(cx + 4.5, gy - 1, 1.2, 'F')

        // Guest name
        doc.setTextColor(...TEXT)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.text(guest.name, cx + 7.5, gy)

        // Group label
        if (guest.group) {
          doc.setTextColor(...gc)
          doc.setFontSize(6.5)
          doc.text(guest.group, cx + colW - 3, gy, { align: 'right' })
        }

        gy += 5.5
      }
    }

    // Advance position
    if (col === 0) {
      col = 1
    } else {
      col = 0
      y += actualH + 4
    }
  }

  // If we ended on left column, advance y
  if (col === 1) y += 0  // right column card not yet drawn fully, but that's fine

  // ── Unassigned guests section ───────────────────────────
  const unassigned = guests.filter((g) => !g.tableId)
  if (unassigned.length > 0) {
    // Make sure we're on left column and have space
    if (col === 1) {
      col = 0
      y += tables.length > 0 ? 0 : 0
    }
    // Force new row
    if (col !== 0) { col = 0 }

    const neededY = y + 10 + Math.ceil(unassigned.length / 3) * 6 + 8
    if (neededY > PH - margin) {
      doc.addPage()
      y = margin + 6
      drawPageHeader(doc, PW, margin)
    }

    doc.setFillColor(...BG)
    doc.roundedRect(margin, y, PW - margin * 2, 8, 2, 2, 'F')
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, y, PW - margin * 2, 8, 2, 2, 'S')

    doc.setTextColor(...TEXT_MUTED)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(`Unassigned guests (${unassigned.length})`, margin + 3, y + 5.5)
    y += 11

    const nameColW = (PW - margin * 2) / 3
    unassigned.forEach((guest, i) => {
      const col3 = i % 3
      const nx = margin + col3 * nameColW
      if (i > 0 && col3 === 0) y += 6

      const gc = colorForGroup(guest.group)
      doc.setFillColor(...gc)
      doc.circle(nx + 2.5, y - 1, 1.2, 'F')

      doc.setTextColor(...TEXT_MUTED)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.text(guest.name, nx + 5, y)
    })
  }

  // ── Footer on each page ─────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFillColor(...BORDER)
    doc.rect(0, PH - 8, PW, 8, 'F')
    doc.setTextColor(...TEXT_MUTED)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text('Wedding Seating Chart', margin, PH - 3)
    doc.text(`Page ${p} of ${totalPages}`, PW - margin, PH - 3, { align: 'right' })
  }

  const dateStr2 = new Date().toISOString().slice(0, 10)
  doc.save(`wedding-seating-${dateStr2}.pdf`)
}

function drawPageHeader(doc, PW, margin) {
  doc.setFillColor(120, 60, 237)
  doc.rect(0, 0, PW, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Wedding Seating Chart (continued)', margin, 5.5)
}
