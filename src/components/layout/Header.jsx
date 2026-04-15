import { useEffect, useState, useRef } from 'react'
import useStore from '../../store/useStore'
import Button from '../ui/Button'
import { exportSeatingPDF } from '../../utils/exportPDF'

const TABS = [
  { id: 'setup',   label: 'Setup' },
  { id: 'seating', label: 'Seating' },
  { id: 'graph',   label: 'Guest Map' },
]

export default function Header({ user, onSignOut, onSignIn, saveStatus = 'idle' }) {
  const activeView = useStore((s) => s.activeView)
  const setActiveView = useStore((s) => s.setActiveView)
  const clearAll = useStore((s) => s.clearAll)
  const undo = useStore((s) => s.undo)
  const canUndo = useStore((s) => s.canUndo)
  const guests = useStore((s) => s.guests)
  const tables = useStore((s) => s.tables)
  const historyLength = useStore((s) => s._history.length)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

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

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleClear() {
    setMenuOpen(false)
    const input = window.prompt(
      'This will permanently delete all guests, tables, and constraints.\n\nType DELETE to confirm:'
    )
    if (input?.trim().toUpperCase() === 'DELETE') clearAll()
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
      flexShrink: 0,
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
      <nav style={{ display: 'flex', gap: '0.1rem', flex: 1, justifyContent: 'center' }}>
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
        {/* Save status */}
        {saveStatus !== 'idle' && (
          <span style={{
            fontSize: '0.72rem',
            color: saveStatus === 'error' ? 'var(--danger)' : saveStatus === 'saving' ? 'var(--text-muted)' : 'var(--success)',
          }}>
            {saveStatus === 'saving' && '⟳ Saving…'}
            {saveStatus === 'saved' && '✓ Saved'}
            {saveStatus === 'error' && '✗ Save failed'}
          </span>
        )}

        {/* Undo */}
        <button
          onClick={() => canUndoNow && undo()}
          disabled={!canUndoNow}
          title={canUndoNow ? 'Undo last action (⌘Z)' : 'Nothing to undo'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
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

        {/* ⋮ overflow menu */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            title="More options"
            style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: menuOpen ? 'var(--surface-hover)' : 'transparent',
              border: '1.5px solid transparent',
              borderRadius: 'var(--radius)',
              color: 'var(--text-muted)',
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            ⋮
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '110%',
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              minWidth: 180,
              zIndex: 200,
              overflow: 'hidden',
            }}>
              {user ? (
                <>
                  <div style={{
                    padding: '0.6rem 0.85rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--purple-light)', color: 'var(--purple-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                        {(user.user_metadata?.name || user.email || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.user_metadata?.name || user.email}
                    </span>
                  </div>
                  <button onClick={() => { setMenuOpen(false); onSignOut() }} style={menuItemStyle}>
                    Sign out
                  </button>
                  <div style={{ height: '1px', background: 'var(--border)' }} />
                </>
              ) : (
                <>
                  <button onClick={() => { setMenuOpen(false); onSignIn?.() }} style={menuItemStyle}>
                    🔐 Sign in with Google
                  </button>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0 0.85rem 0.6rem', lineHeight: 1.4 }}>
                    Sign in to sync your seating chart to the cloud
                  </div>
                  <div style={{ height: '1px', background: 'var(--border)' }} />
                </>
              )}
              <button onClick={handleClear} style={{ ...menuItemStyle, color: 'var(--danger)' }}>
                🗑 Reset all data…
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

const menuItemStyle = {
  display: 'block', width: '100%', textAlign: 'left',
  padding: '0.55rem 0.85rem',
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '0.82rem', color: 'var(--text)',
  transition: 'background 0.1s',
}
