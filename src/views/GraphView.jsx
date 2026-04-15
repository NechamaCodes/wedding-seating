import RelationshipGraph from '../components/graph/RelationshipGraph'

export default function GraphView() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1.5px solid var(--border)', background: 'var(--surface)' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>Relationship Network</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          See who knows who. Relationships are imported from CSV or set via the guest editor.
        </p>
      </div>
      <RelationshipGraph />
    </div>
  )
}
