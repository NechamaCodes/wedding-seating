import { useState } from 'react'
import useStore from '../../store/useStore'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

export default function GuestForm({ onClose, editId }) {
  const guests = useStore((s) => s.guests)
  const groups = useStore((s) => s.groups)
  const addGuest = useStore((s) => s.addGuest)
  const updateGuest = useStore((s) => s.updateGuest)
  const addRelationship = useStore((s) => s.addRelationship)
  const removeRelationship = useStore((s) => s.removeRelationship)

  const existing = editId ? guests.find((g) => g.id === editId) : null

  const [name, setName] = useState(existing?.name || '')
  const [groupInput, setGroupInput] = useState(existing?.group || '')
  const [showGroupSuggestions, setShowGroupSuggestions] = useState(false)
  const [headshotUrl, setHeadshotUrl] = useState(existing?.headshotUrl || null)

  // Relationship search state
  const [relSearch, setRelSearch] = useState('')
  const [showRelSuggestions, setShowRelSuggestions] = useState(false)

  const groupSuggestions = groups.filter(
    (g) => g.toLowerCase().includes(groupInput.toLowerCase()) && g !== groupInput
  )

  // Guests that can be connected: not self, not already connected
  const currentRelIds = existing?.relationships || []
  const relSuggestions = guests.filter(
    (g) =>
      g.id !== editId &&
      !currentRelIds.includes(g.id) &&
      g.name.toLowerCase().includes(relSearch.toLowerCase())
  ).slice(0, 8)

  function selectGroup(val) {
    setGroupInput(val)
    setShowGroupSuggestions(false)
  }

  function handleHeadshot(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const max = 200
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        setHeadshotUrl(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  function handleAddRelationship(relatedId) {
    if (!editId) return  // relationships only editable after guest exists
    addRelationship(editId, relatedId)
    setRelSearch('')
    setShowRelSuggestions(false)
  }

  function handleRemoveRelationship(relatedId) {
    if (!editId) return
    removeRelationship(editId, relatedId)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    const trimmedGroup = groupInput.trim().toLowerCase()
    if (editId) {
      updateGuest(editId, { name: name.trim(), group: trimmedGroup, headshotUrl })
    } else {
      addGuest({ name: name.trim(), group: trimmedGroup, headshotUrl })
    }
    onClose?.()
  }

  // Re-read current relationships from store (they update in real-time as we add/remove)
  const liveGuest = editId ? guests.find((g) => g.id === editId) : null
  const connectedGuests = (liveGuest?.relationships || [])
    .map((id) => guests.find((g) => g.id === id))
    .filter(Boolean)

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Name */}
      <div>
        <label style={labelStyle}>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Guest name"
          autoFocus
          required
        />
      </div>

      {/* Group */}
      <div>
        <label style={labelStyle}>
          Group <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional — type to create new)</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            value={groupInput}
            onChange={(e) => { setGroupInput(e.target.value); setShowGroupSuggestions(true) }}
            onFocus={() => setShowGroupSuggestions(true)}
            onBlur={() => setTimeout(() => setShowGroupSuggestions(false), 150)}
            placeholder="e.g. Bride's side, College friends…"
          />
          {showGroupSuggestions && (groups.length > 0 || groupInput) && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', zIndex: 50, marginTop: 2,
            }}>
              {groupSuggestions.map((g) => (
                <div key={g} onMouseDown={() => selectGroup(g)}
                  style={{ padding: '0.45rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = ''}
                >
                  <Badge group={g} />
                </div>
              ))}
              {groupInput.trim() && !groups.includes(groupInput.trim().toLowerCase()) && (
                <div onMouseDown={() => selectGroup(groupInput.trim().toLowerCase())}
                  style={{ padding: '0.45rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--purple-dark)', fontWeight: 500 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = ''}
                >
                  + Create "{groupInput.trim()}"
                </div>
              )}
              {groups.length === 0 && !groupInput.trim() && (
                <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Type a group name to create one
                </div>
              )}
            </div>
          )}
        </div>
        {groupInput.trim() && (
          <div style={{ marginTop: '0.4rem' }}>
            <Badge group={groupInput.trim().toLowerCase()} />
          </div>
        )}
      </div>

      {/* Headshot */}
      <div>
        <label style={labelStyle}>Headshot <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {headshotUrl && (
            <img src={headshotUrl} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
          )}
          <input type="file" accept="image/*" onChange={handleHeadshot} style={{ border: 'none', padding: 0, fontSize: '0.8rem' }} />
        </div>
      </div>

      {/* Relationships — only shown when editing an existing guest */}
      {editId && (
        <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: '0.85rem' }}>
          <label style={labelStyle}>
            Knows <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
          </label>

          {/* Connected guests chips */}
          {connectedGuests.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
              {connectedGuests.map((g) => (
                <span key={g.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.2rem 0.5rem 0.2rem 0.6rem',
                  background: 'var(--surface-hover)', border: '1.5px solid var(--border)',
                  borderRadius: '999px', fontSize: '0.8rem', fontWeight: 500,
                }}>
                  {g.headshotUrl && (
                    <img src={g.headshotUrl} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
                  )}
                  {g.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveRelationship(g.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0 0.1rem', lineHeight: 1 }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search to add */}
          <div style={{ position: 'relative' }}>
            <input
              value={relSearch}
              onChange={(e) => { setRelSearch(e.target.value); setShowRelSuggestions(true) }}
              onFocus={() => setShowRelSuggestions(true)}
              onBlur={() => setTimeout(() => setShowRelSuggestions(false), 150)}
              placeholder="Search guests to connect…"
            />
            {showRelSuggestions && relSearch && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--surface)', border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', zIndex: 50, marginTop: 2,
              }}>
                {relSuggestions.length === 0 ? (
                  <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    No guests found
                  </div>
                ) : (
                  relSuggestions.map((g) => (
                    <div key={g.id} onMouseDown={() => handleAddRelationship(g.id)}
                      style={{ padding: '0.45rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = ''}
                    >
                      {g.headshotUrl ? (
                        <img src={g.headshotUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'var(--purple-dark)', flexShrink: 0 }}>
                          {g.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                      <span>{g.name}</span>
                      {g.group && <Badge group={g.group} />}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {!editId && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Save the guest first, then edit to add connections.
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
        {onClose && (
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        )}
        <Button type="submit" variant="primary">
          {editId ? 'Save changes' : 'Add guest'}
        </Button>
      </div>
    </form>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '0.35rem',
}
