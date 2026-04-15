import { useState } from 'react'
import { parseGuestCSV } from '../../utils/csvParser'
import useStore from '../../store/useStore'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

export default function CSVImport({ onClose }) {
  const importGuests = useStore((s) => s.importGuests)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)

  async function handleChange(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const rows = await parseGuestCSV(file)
      if (rows.length === 0) {
        setError('No guests found. Make sure your file has a "name" column.')
        setPreview(null)
      } else {
        setPreview(rows)
        setError(null)
      }
    } catch (e) {
      setError('Could not read file: ' + e.message)
      setPreview(null)
    }
  }

  function downloadSampleCSV() {
    const rows = [
      'name,group,knows',
      'Sarah Cohen,Bride Side,David Cohen',
      'David Cohen,Bride Side,Sarah Cohen',
      'James Miller,Groom Side,Emma Miller',
      'Emma Miller,Groom Side,James Miller',
      'Rachel Green,Family,',
      'Tom White,Friends,',
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'guests-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport() {
    if (!preview) return
    importGuests(preview)
    onClose?.()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Only these columns are used: <strong>name</strong>, <strong>group</strong>, <strong>knows</strong>. Any other columns are ignored.
        </div>
        <button
          onClick={downloadSampleCSV}
          style={{
            background: 'none',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '0.25rem 0.65rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          ⬇ Download sample CSV
        </button>
      </div>

      {/* Plain file input — most reliable across all browsers */}
      <div style={{
        border: '2px dashed var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1.5rem',
        textAlign: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>📄</div>
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleChange}
          style={{
            fontSize: '0.875rem',
            color: 'var(--text)',
            width: '100%',
          }}
        />
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '0.85rem', padding: '0.6rem 0.75rem', background: '#FEE2E2', borderRadius: 'var(--radius)' }}>
          {error}
        </div>
      )}

      {preview && (
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Preview — {preview.length} guests found
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {['Name', 'Group', 'Knows'].map((h) => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.45rem 0.75rem' }}>{row.name}</td>
                    <td style={{ padding: '0.45rem 0.75rem' }}><Badge group={row.group} /></td>
                    <td style={{ padding: '0.45rem 0.75rem', color: 'var(--text-muted)' }}>{row.knows || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setPreview(null)}>Clear</Button>
            <Button variant="primary" onClick={handleImport}>
              Import {preview.length} guests
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
