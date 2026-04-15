import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { forceCollide } from 'd3-force'
import useStore from '../../store/useStore'
import { groupColor } from '../../utils/groupColor'

const NODE_R = 14

export default function RelationshipGraph() {
  const guests = useStore((s) => s.guests)
  const groups = useStore((s) => s.groups)
  const containerRef = useRef(null)
  const graphRef = useRef(null)
  const [dims, setDims] = useState({ w: 800, h: 600 })
  const [selectedId, setSelectedId] = useState(null)
  const [groupFilter, setGroupFilter] = useState('all')

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setDims({ w: width, h: height })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const setGraphRef = useCallback((node) => {
    graphRef.current = node
    if (!node) return
    node.d3Force('charge').strength(-400)
    node.d3Force('link').distance(120)
    node.d3Force('collision', forceCollide(NODE_R + 8))
  }, [])

  const handleEngineStop = useCallback(() => {
    graphRef.current?.zoomToFit(400, 80)
  }, [])

  const filteredGuests = useMemo(() =>
    groupFilter === 'all' ? guests : guests.filter((g) => g.group === groupFilter),
  [guests, groupFilter])

  const graphData = useMemo(() => {
    const nodeIds = new Set(filteredGuests.map((g) => g.id))
    const nodes = filteredGuests.map((g) => ({
      id: g.id, name: g.name, group: g.group, headshotUrl: g.headshotUrl,
    }))
    const linkSet = new Set()
    const links = []
    filteredGuests.forEach((g) => {
      g.relationships.forEach((relId) => {
        if (!nodeIds.has(relId)) return
        const key = [g.id, relId].sort().join('--')
        if (!linkSet.has(key)) {
          linkSet.add(key)
          links.push({ source: g.id, target: relId })
        }
      })
    })
    return { nodes, links }
  }, [filteredGuests])

  // Set of highlighted node IDs when a node is selected
  const highlightIds = useMemo(() => {
    if (!selectedId) return null
    const connected = new Set([selectedId])
    graphData.links.forEach((link) => {
      const src = typeof link.source === 'object' ? link.source.id : link.source
      const tgt = typeof link.target === 'object' ? link.target.id : link.target
      if (src === selectedId) connected.add(tgt)
      if (tgt === selectedId) connected.add(src)
    })
    return connected
  }, [selectedId, graphData.links])

  useMemo(() => {
    graphData.nodes.forEach((node) => {
      if (node.headshotUrl && !node._img) {
        const img = new Image()
        img.src = node.headshotUrl
        node._img = img
      }
    })
  }, [graphData])

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const color = groupColor(node.group)
    const dimmed = highlightIds && !highlightIds.has(node.id)
    const selected = node.id === selectedId
    const alpha = dimmed ? 0.2 : 1

    ctx.globalAlpha = alpha

    ctx.beginPath()
    ctx.arc(node.x, node.y, NODE_R, 0, 2 * Math.PI)
    ctx.fillStyle = '#fff'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(node.x, node.y, NODE_R, 0, 2 * Math.PI)
    ctx.fillStyle = color + '40'
    ctx.fill()
    ctx.strokeStyle = selected ? color : color
    ctx.lineWidth = selected ? 3 : 2
    ctx.stroke()

    if (selected) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, NODE_R + 4, 0, 2 * Math.PI)
      ctx.strokeStyle = color + '60'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    if (node.headshotUrl && node._img?.complete) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(node.x, node.y, NODE_R - 2, 0, 2 * Math.PI)
      ctx.clip()
      ctx.drawImage(node._img, node.x - NODE_R + 2, node.y - NODE_R + 2, (NODE_R - 2) * 2, (NODE_R - 2) * 2)
      ctx.restore()
    } else {
      const initials = node.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = color
      ctx.font = `bold ${NODE_R * 0.75}px system-ui`
      ctx.fillText(initials, node.x, node.y)
    }

    const screenFontSize = 11
    const canvasFontSize = screenFontSize / globalScale
    if (canvasFontSize < 24) {
      const label = node.name
      ctx.font = `${canvasFontSize}px system-ui`
      const tw = ctx.measureText(label).width
      const pad = 4 / globalScale
      const bx = node.x - tw / 2 - pad
      const by = node.y + NODE_R + 4 / globalScale
      const bw = tw + pad * 2
      const bh = canvasFontSize + pad * 1.5

      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.beginPath()
      ctx.roundRect(bx, by, bw, bh, 3 / globalScale)
      ctx.fill()

      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = dimmed ? '#aaa' : '#1E1B2E'
      ctx.fillText(label, node.x, by + pad * 0.75)
    }

    ctx.globalAlpha = 1
  }, [highlightIds, selectedId])

  const linkCanvasObject = useCallback((link, ctx) => {
    const src = link.source
    const tgt = link.target
    if (!src?.x || !tgt?.x) return
    const srcId = typeof src === 'object' ? src.id : src
    const tgtId = typeof tgt === 'object' ? tgt.id : tgt
    const highlighted = highlightIds && (highlightIds.has(srcId) && highlightIds.has(tgtId))
    const dimmed = highlightIds && !highlighted
    ctx.globalAlpha = dimmed ? 0.08 : 1
    ctx.beginPath()
    ctx.moveTo(src.x, src.y)
    ctx.lineTo(tgt.x, tgt.y)
    ctx.strokeStyle = highlighted ? '#A855F7' : '#C4B5FD'
    ctx.lineWidth = highlighted ? 2.5 : 1.5
    ctx.stroke()
    ctx.globalAlpha = 1
  }, [highlightIds])

  if (guests.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '2rem' }}>🕸</div>
        <div>Add guests, then use the ✏️ edit button to connect them.</div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '0.6rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: 'var(--surface)', flexShrink: 0 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {filteredGuests.length} guests · {graphData.links.length} connections
        </span>

        {/* Group filter */}
        <select
          value={groupFilter}
          onChange={(e) => { setGroupFilter(e.target.value); setSelectedId(null) }}
          style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', width: 'auto' }}
        >
          <option value="all">All groups</option>
          {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          <option value="">No group</option>
        </select>

        {/* Clear selection */}
        {selectedId && (
          <button
            onClick={() => setSelectedId(null)}
            style={{ fontSize: '0.75rem', color: 'var(--purple-mid)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            ✕ Clear selection
          </button>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setGroupFilter(groupFilter === g ? 'all' : g)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                fontSize: '0.72rem', background: 'none', border: 'none', cursor: 'pointer',
                padding: '0.1rem 0.3rem', borderRadius: 4,
                opacity: groupFilter !== 'all' && groupFilter !== g ? 0.4 : 1,
              }}
            >
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: groupColor(g), flexShrink: 0 }} />
              <span style={{ textTransform: 'capitalize' }}>{g}</span>
            </button>
          ))}
          {guests.some((g) => !g.group) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#B0B0B0', flexShrink: 0 }} />
              <span>No group</span>
            </div>
          )}
        </div>
      </div>

      {selectedId && (
        <div style={{ padding: '0.4rem 1.25rem', background: '#FAF5FF', borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--purple-dark)' }}>
          {(() => {
            const g = guests.find((g) => g.id === selectedId)
            return g ? `${g.name} knows ${g.relationships.filter((r) => graphData.nodes.find((n) => n.id === r)).length} people in this view` : null
          })()}
        </div>
      )}

      <div ref={containerRef} style={{ flex: 1, overflow: 'hidden' }}>
        <ForceGraph2D
          ref={setGraphRef}
          graphData={graphData}
          width={dims.w}
          height={dims.h}
          nodeCanvasObject={nodeCanvasObject}
          nodeCanvasObjectMode={() => 'replace'}
          linkCanvasObject={linkCanvasObject}
          linkCanvasObjectMode={() => 'replace'}
          nodeRelSize={NODE_R}
          backgroundColor="#F8F6FF"
          nodeLabel={(n) => `${n.name}${n.group ? ` · ${n.group}` : ''}`}
          onNodeClick={(node) => setSelectedId((prev) => prev === node.id ? null : node.id)}
          onBackgroundClick={() => setSelectedId(null)}
          onEngineStop={handleEngineStop}
          cooldownTicks={200}
          d3AlphaDecay={0.015}
          d3VelocityDecay={0.25}
          enableZoomInteraction
          enablePanInteraction
        />
      </div>
    </div>
  )
}
