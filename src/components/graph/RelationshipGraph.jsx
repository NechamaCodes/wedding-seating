import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { forceCollide } from 'd3-force'
import useStore from '../../store/useStore'

const PALETTE = [
  '#A855F7', '#38BDF8', '#34D399', '#FB923C',
  '#F87171', '#FBBF24', '#22D3EE', '#818CF8',
  '#E879F9', '#86EFAC',
]

function colorForGroup(group) {
  if (!group) return '#B0B0B0'
  let hash = 0
  for (let i = 0; i < group.length; i++) {
    hash = (hash * 31 + group.charCodeAt(i)) & 0xffffffff
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

const NODE_R = 14

export default function RelationshipGraph() {
  const guests = useStore((s) => s.guests)
  const groups = useStore((s) => s.groups)
  const containerRef = useRef(null)
  const graphRef = useRef(null)
  const [dims, setDims] = useState({ w: 800, h: 600 })

  // Track container size
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setDims({ w: width, h: height })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Callback ref — configure forces the moment the graph mounts, before sim starts
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

  const graphData = useMemo(() => {
    const nodes = guests.map((g) => ({
      id: g.id,
      name: g.name,
      group: g.group,
      headshotUrl: g.headshotUrl,
    }))

    const linkSet = new Set()
    const links = []
    guests.forEach((g) => {
      g.relationships.forEach((relId) => {
        const key = [g.id, relId].sort().join('--')
        if (!linkSet.has(key)) {
          linkSet.add(key)
          links.push({ source: g.id, target: relId })
        }
      })
    })

    return { nodes, links }
  }, [guests])

  // Pre-load headshot images
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
    const color = colorForGroup(node.group)

    // White backing circle
    ctx.beginPath()
    ctx.arc(node.x, node.y, NODE_R, 0, 2 * Math.PI)
    ctx.fillStyle = '#fff'
    ctx.fill()

    // Colored fill
    ctx.beginPath()
    ctx.arc(node.x, node.y, NODE_R, 0, 2 * Math.PI)
    ctx.fillStyle = color + '40'
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    // Headshot or initials
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

    // Label — scaled so it stays ~11px on screen
    const screenFontSize = 11
    const canvasFontSize = screenFontSize / globalScale
    // Skip label if it would be tiny (very zoomed out) or huge (very zoomed in, tooltip is enough)
    if (canvasFontSize < 24) {
      const label = node.name
      ctx.font = `${canvasFontSize}px system-ui`
      const tw = ctx.measureText(label).width
      const pad = 4 / globalScale
      const bx = node.x - tw / 2 - pad
      const by = node.y + NODE_R + 4 / globalScale
      const bw = tw + pad * 2
      const bh = canvasFontSize + pad * 1.5

      // White pill background
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.beginPath()
      ctx.roundRect(bx, by, bw, bh, 3 / globalScale)
      ctx.fill()

      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = '#1E1B2E'
      ctx.fillText(label, node.x, by + pad * 0.75)
    }
  }, [])

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
      {/* Stats + legend */}
      <div style={{ padding: '0.6rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', background: 'var(--surface)', flexShrink: 0 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {guests.length} guests · {graphData.links.length} connections
        </span>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          {groups.map((g) => (
            <div key={g} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: colorForGroup(g), flexShrink: 0 }} />
              <span style={{ textTransform: 'capitalize' }}>{g}</span>
            </div>
          ))}
          {guests.some((g) => !g.group) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#B0B0B0', flexShrink: 0 }} />
              <span>No group</span>
            </div>
          )}
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Scroll to zoom · drag to pan
        </span>
      </div>

      <div ref={containerRef} style={{ flex: 1, overflow: 'hidden' }}>
        <ForceGraph2D
          ref={setGraphRef}
          graphData={graphData}
          width={dims.w}
          height={dims.h}
          nodeCanvasObject={nodeCanvasObject}
          nodeCanvasObjectMode={() => 'replace'}
          nodeRelSize={NODE_R}
          linkColor={() => '#C4B5FD'}
          linkWidth={1.5}
          backgroundColor="#F8F6FF"
          nodeLabel={(n) => `${n.name}${n.group ? ` · ${n.group}` : ''}`}
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
