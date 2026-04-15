/**
 * Validates whether a guest can be assigned to a table.
 * Returns { valid: boolean, reasons: string[] }
 */
export function validateAssignment(guestId, tableId, state) {
  const { guests, tables, constraints } = state
  const guest = guests.find((g) => g.id === guestId)
  const table = tables.find((t) => t.id === tableId)
  const reasons = []

  if (!guest || !table) {
    return { valid: false, reasons: ['Guest or table not found.'] }
  }

  // Locked table
  if (table.isLocked) {
    reasons.push(`"${table.name}" is locked and cannot be changed.`)
  }

  // Table full
  const currentGuests = table.guestIds.filter((id) => id !== guestId)
  if (currentGuests.length >= table.seatCount) {
    reasons.push(`"${table.name}" is full (${table.seatCount} seats).`)
  }

  // Cannot-sit-together constraints
  const cannotPairs = constraints.filter((c) => c.type === 'cannot-sit-together')
  for (const pair of cannotPairs) {
    if (!pair.guestIds.includes(guestId)) continue
    const otherId = pair.guestIds.find((id) => id !== guestId)
    const other = guests.find((g) => g.id === otherId)
    if (!other) continue
    if (currentGuests.includes(otherId)) {
      reasons.push(`${guest.name} and ${other.name} cannot sit together.`)
    }
  }

  return { valid: reasons.length === 0, reasons }
}

/**
 * Returns warnings (not blockers) about must-sit-together constraints being split.
 */
export function getMustSitWarnings(guestId, tableId, state) {
  const { guests, tables, constraints } = state
  const guest = guests.find((g) => g.id === guestId)
  const warnings = []

  const mustPairs = constraints.filter((c) => c.type === 'must-sit-together')
  for (const pair of mustPairs) {
    if (!pair.guestIds.includes(guestId)) continue
    const otherId = pair.guestIds.find((id) => id !== guestId)
    const other = guests.find((g) => g.id === otherId)
    if (!other) continue
    // If the other person is assigned to a different table
    if (other.tableId && other.tableId !== tableId) {
      const otherTable = tables.find((t) => t.id === other.tableId)
      warnings.push(
        `${guest.name} must sit with ${other.name}, who is at "${otherTable?.name || 'another table'}".`
      )
    }
  }

  return warnings
}

/**
 * Checks the entire current seating for all violations.
 * Returns array of { type, message } objects.
 */
export function getSeatingIssues(state) {
  const { guests, tables, constraints } = state
  const issues = []

  for (const table of tables) {
    const seated = table.guestIds
      .map((id) => guests.find((g) => g.id === id))
      .filter(Boolean)

    // Over capacity
    if (seated.length > table.seatCount) {
      issues.push({
        type: 'error',
        message: `"${table.name}" has ${seated.length} guests but only ${table.seatCount} seats.`,
      })
    }

    // Cannot-sit-together at same table
    const cannotPairs = constraints.filter((c) => c.type === 'cannot-sit-together')
    for (const pair of cannotPairs) {
      const [a, b] = pair.guestIds
      if (seated.find((g) => g.id === a) && seated.find((g) => g.id === b)) {
        const gA = guests.find((g) => g.id === a)
        const gB = guests.find((g) => g.id === b)
        issues.push({
          type: 'error',
          message: `${gA?.name} and ${gB?.name} cannot sit together but are both at "${table.name}".`,
        })
      }
    }
  }

  // Must-sit-together split across tables
  const mustPairs = constraints.filter((c) => c.type === 'must-sit-together')
  for (const pair of mustPairs) {
    const [aId, bId] = pair.guestIds
    const a = guests.find((g) => g.id === aId)
    const b = guests.find((g) => g.id === bId)
    if (!a || !b) continue
    if (a.tableId && b.tableId && a.tableId !== b.tableId) {
      issues.push({
        type: 'warning',
        message: `${a.name} and ${b.name} must sit together but are at different tables.`,
      })
    }
  }

  return issues
}
