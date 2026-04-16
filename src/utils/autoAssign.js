/**
 * Auto-assign guests to tables based on constraints and groups.
 *
 * Priority:
 * 1. Hard constraint: must-sit-together pairs go to the same table
 * 2. Hard constraint: cannot-sit-together pairs go to different tables
 * 3. Soft preference: guests in the same group sit together
 */
export function autoAssign(guests, tables, constraints) {
  if (!guests.length || !tables.length) return {}

  // Build constraint lookup maps
  const mustWith = {}   // guestId -> Set<guestId>
  const cannotWith = {} // guestId -> Set<guestId>

  for (const c of constraints) {
    const [a, b] = c.guestIds
    if (c.type === 'must-sit-together') {
      if (!mustWith[a]) mustWith[a] = new Set()
      if (!mustWith[b]) mustWith[b] = new Set()
      mustWith[a].add(b)
      mustWith[b].add(a)
    } else if (c.type === 'cannot-sit-together') {
      if (!cannotWith[a]) cannotWith[a] = new Set()
      if (!cannotWith[b]) cannotWith[b] = new Set()
      cannotWith[a].add(b)
      cannotWith[b].add(a)
    }
  }

  // Find connected components via must-sit-together edges (BFS)
  const visited = new Set()
  const mustClusters = [] // groups that MUST be at the same table

  for (const guest of guests) {
    if (visited.has(guest.id) || !mustWith[guest.id]) continue
    const cluster = []
    const queue = [guest.id]
    while (queue.length) {
      const id = queue.shift()
      if (visited.has(id)) continue
      visited.add(id)
      cluster.push(id)
      for (const neighbor of (mustWith[id] || [])) {
        if (!visited.has(neighbor)) queue.push(neighbor)
      }
    }
    mustClusters.push(cluster)
  }

  // Guests not connected to any must-sit constraint
  const singles = guests.filter(g => !visited.has(g.id)).map(g => g.id)

  // Track assignments: tableId -> [guestId]
  const tableSlots = {}
  for (const t of tables) tableSlots[t.id] = []

  // Check if a set of guests can be added to a table
  function canPlace(guestIds, tableId) {
    const table = tables.find(t => t.id === tableId)
    if (!table) return false
    if (tableSlots[tableId].length + guestIds.length > table.seatCount) return false
    for (const gid of guestIds) {
      const forbidden = cannotWith[gid]
      if (!forbidden) continue
      for (const existing of tableSlots[tableId]) {
        if (forbidden.has(existing)) return false
      }
      // Also check within the group being placed
      for (const other of guestIds) {
        if (other !== gid && forbidden.has(other)) return false
      }
    }
    return true
  }

  function place(guestIds, tableId) {
    for (const id of guestIds) tableSlots[tableId].push(id)
  }

  // Sort tables by capacity descending so large groups fit first
  const byCapacity = [...tables].sort((a, b) => b.seatCount - a.seatCount)

  // Assign must-clusters (largest first)
  const sortedClusters = [...mustClusters].sort((a, b) => b.length - a.length)
  const failedClusters = []

  for (const cluster of sortedClusters) {
    let placed = false
    for (const table of byCapacity) {
      if (canPlace(cluster, table.id)) {
        place(cluster, table.id)
        placed = true
        break
      }
    }
    if (!placed) {
      // Cluster is too big or blocked — fall back to placing individually
      failedClusters.push(...cluster)
    }
  }

  // Combine singles + failed cluster members
  const remaining = [...singles, ...failedClusters]

  // Group remaining guests by their group category for soft preference
  const guestById = Object.fromEntries(guests.map(g => [g.id, g]))
  const byGroup = {}
  for (const id of remaining) {
    const group = guestById[id]?.group || ''
    if (!byGroup[group]) byGroup[group] = []
    byGroup[group].push(id)
  }

  // Assign each group's guests, preferring tables that already have that group
  for (const groupGuests of Object.values(byGroup)) {
    for (const gid of groupGuests) {
      // Score each table: prefer same-group guests, prefer fuller tables (pack them in)
      let bestTable = null
      let bestScore = -Infinity

      for (const table of byCapacity) {
        if (!canPlace([gid], table.id)) continue
        const sameGroup = tableSlots[table.id].filter(id => guestById[id]?.group === guestById[gid]?.group).length
        const fillRatio = tableSlots[table.id].length / table.seatCount
        // Weight same-group strongly, then prefer tables that are more full (keeps empties empty)
        const score = sameGroup * 10 + fillRatio
        if (score > bestScore) {
          bestScore = score
          bestTable = table
        }
      }

      if (bestTable) place([gid], bestTable.id)
    }
  }

  // Build result map: guestId -> tableId
  const result = {}
  for (const [tableId, guestIds] of Object.entries(tableSlots)) {
    for (const gid of guestIds) result[gid] = tableId
  }
  return result
}
