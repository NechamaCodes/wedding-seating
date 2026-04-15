export default function Button({ children, variant = 'primary', size = 'md', style, ...props }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontWeight: 500,
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'background 0.15s, box-shadow 0.15s, opacity 0.15s',
    whiteSpace: 'nowrap',
  }

  const sizes = {
    sm: { padding: '0.3rem 0.7rem', fontSize: '0.8rem' },
    md: { padding: '0.5rem 1.1rem', fontSize: '0.875rem' },
    lg: { padding: '0.65rem 1.4rem', fontSize: '1rem' },
  }

  const variants = {
    primary: {
      background: 'var(--purple-mid)',
      color: '#fff',
      boxShadow: 'var(--shadow-sm)',
    },
    secondary: {
      background: 'var(--surface)',
      color: 'var(--text)',
      border: '1.5px solid var(--border)',
    },
    danger: {
      background: '#FEE2E2',
      color: 'var(--danger)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-muted)',
    },
    success: {
      background: '#DCFCE7',
      color: 'var(--success)',
    },
  }

  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant], ...style }} {...props}>
      {children}
    </button>
  )
}
