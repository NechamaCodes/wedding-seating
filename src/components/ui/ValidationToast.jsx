import { useEffect, useState } from 'react'

export default function ValidationToast({ messages, onDismiss }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 4000)
    return () => clearTimeout(t)
  }, [messages, onDismiss])

  if (!messages || messages.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : '1rem'})`,
      opacity: visible ? 1 : 0,
      transition: 'transform 0.3s, opacity 0.3s',
      background: '#1E1B2E',
      color: '#fff',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      padding: '0.85rem 1.25rem',
      maxWidth: 380,
      width: 'calc(100vw - 3rem)',
      zIndex: 2000,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
            Can't place guest here
          </div>
          {messages.map((m, i) => (
            <div key={i} style={{ fontSize: '0.8rem', opacity: 0.85 }}>• {m}</div>
          ))}
        </div>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }}
          style={{
            background: 'none', border: 'none', color: '#fff',
            cursor: 'pointer', marginLeft: 'auto', fontSize: '0.9rem',
            opacity: 0.7, flexShrink: 0,
          }}
        >✕</button>
      </div>
    </div>
  )
}
