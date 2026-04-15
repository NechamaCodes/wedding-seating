import useStore from './store/useStore'
import { useAuth } from './hooks/useAuth'
import { useSupabaseSync } from './hooks/useSupabaseSync'
import Header from './components/layout/Header'
import SetupView from './views/SetupView'
import SeatingView from './views/SeatingView'
import GraphView from './views/GraphView'
import SignInPage from './components/auth/SignInPage'

function AppContent({ user, signOut }) {
  const activeView = useStore((s) => s.activeView)
  // Sync store ↔ Supabase whenever user is signed in
  useSupabaseSync(user)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header user={user} onSignOut={signOut} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeView === 'setup'   && <SetupView />}
        {activeView === 'seating' && <SeatingView />}
        {activeView === 'graph'   && <GraphView />}
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
      }}>
        Loading…
      </div>
    )
  }

  if (!user) {
    return <SignInPage onSignIn={signInWithGoogle} />
  }

  return <AppContent user={user} signOut={signOut} />
}
