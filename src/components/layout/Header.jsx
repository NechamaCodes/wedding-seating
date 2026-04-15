import { useEffect } from 'react'
import useStore from '../../store/useStore'
import Button from '../ui/Button'
import { exportSeatingPDF } from '../../utils/exportPDF'

const TABS = [
  { id: 'setup',   label: 'Setup' },
  { id: 'seating', label: 'Seating' },
  { id: 'graph',   label: 'Connections' },
]

export default function Header({ user, onSignOut }) {
  const activeView = useStore((s) => s.activeView)
  const setActiveView = useStore((s) => s.setActiveView)
  const clearAll = useStore((s) => s.clearAll)
  const undo = useStore((s) => s.undo)
  const canUndo = useStore((s) => s.canUndo)
  const guests = useStore((s) => s.guests)
  const tables = useStore((s) => s.tables)
  const historyLength = useStore((s) => s._history.length)

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo()) undo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, canUndo])

  function handleClear() {
    const input = window.prompt(
      'This will permanently delete all guests, tables, and constraints.\n\nType DELETE to confirm:'
    )
    if (input?.trim().toUpperCase() === 'DELETE') {
      clearAll()
    }
  }

  function handleExport() {
    exportSeatingPDF(guests, tables)
  }

  const canUndoNow = historyLength > 0

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1.5px solid var(--border)',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Logo / title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        <span style={{ fontSize: '1.4rem' }}>💍</span>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 700,
          fontSize: '1.1rem',
          color: 'var(--purple-dark)',
          letterSpacing: '-0.01em',
        }}>
          Wedding Seating
        </span>
      </div>

      {/* Tab bar */}
      <nav style={{ display: 'flex', gap: '0.25rem' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            style={{
              padding: '0.75rem 1.1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeView === tab.id
                ? '2.5px solid var(--purple-mid)'
                : '2.5px solid transparent',
              borderRadius: 0,
              color: activeView === tab.id ? 'var(--purple-dark)' : 'var(--text-muted)',
              fontWeight: activeView === tab.id ? 600 : 400,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <button
          onClick={() => canUndoNow && undo()}
          disabled={!canUndoNow}
          title={canUndoNow ? 'Undo last action (⌘Z)' : 'Nothing to undo'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.3rem 0.6rem',
            background: canUndoNow ? 'var(--surface)' : 'transparent',
            border: `1.5px solid ${canUndoNow ? 'var(--border)' : 'transparent'}`,
            borderRadius: 'var(--radius)',
            color: canUndoNow ? 'var(--text-muted)' : 'var(--border)',
            fontSize: '0.8rem',
            cursor: canUndoNow ? 'pointer' : 'default',
            transition: 'all 0.15s',
          }}
        >
          ↩ Undo
        </button>

        <div style={{ width: '1px', height: '1.2rem', background: 'var(--border)' }} />

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          disabled={tables.length === 0}
          title={tables.length === 0 ? 'Add tables first' : 'Export seating chart as PDF'}
        >
          📄 Export PDF
        </Button>

        <button
          onClick={handleClear}
          title="Reset all data"
          style={{
            padding: '0.3rem 0.6rem',
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius)',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            opacity: 0.6,
            transition: 'opacity 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--danger)' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          Reset
        </button>

        {user && (
          <>
            <div style={{ width: '1px', height: '1.2rem', background: 'var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid var(--border)' }}
                />
              ) : (
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--purple-light)', color: 'var(--purple-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700,
                }}>
                  {(user.user_metadata?.name || user.email || '?')[0].toUpperCase()}
                </div>
              )}
              <button
                onClick={onSignOut}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.75rem', color: 'var(--text-muted)', padding: 0,
                }}
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
