export default function SignInPage({ onSignIn }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FAF5FF 0%, #F0F9FF 50%, #FDF2F8 100%)',
      padding: '1.5rem',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 8px 48px rgba(120,60,237,0.12)',
        padding: '3rem 2.5rem',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Ring emoji */}
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💍</div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1.8rem',
          fontWeight: 700,
          color: 'var(--purple-dark)',
          marginBottom: '0.5rem',
          letterSpacing: '-0.01em',
        }}>
          Wedding Seating
        </h1>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          marginBottom: '2rem',
        }}>
          Plan your perfect seating chart — assign guests to tables,
          manage groups, and visualize relationships.
        </p>

        {/* Sign in button */}
        <button
          onClick={onSignIn}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            width: '100%',
            padding: '0.75rem 1.5rem',
            background: '#fff',
            border: '1.5px solid #E2D9F3',
            borderRadius: 12,
            fontSize: '0.9rem',
            fontWeight: 500,
            color: 'var(--text)',
            cursor: 'pointer',
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            transition: 'box-shadow 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(120,60,237,0.15)'
            e.currentTarget.style.borderColor = 'var(--purple-mid)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.07)'
            e.currentTarget.style.borderColor = '#E2D9F3'
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Your seating chart is private to your account.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
