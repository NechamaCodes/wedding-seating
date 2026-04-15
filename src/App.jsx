import useStore from './store/useStore'
import { useAuth } from './hooks/useAuth'
import { useSupabaseSync } from './hooks/useSupabaseSync'
import Header from './components/layout/Header'
import SetupView from './views/SetupView'
import SeatingView from './views/SeatingView'
import GraphView from './views/GraphView'
function AppContent({ user, signOut, signIn }) {
  const activeView = useStore((s) => s.activeView)
  const { saveStatus } = useSupabaseSync(user)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header user={user} onSignOut={signOut} onSignIn={signIn} saveStatus={saveStatus} />
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

  // Always show the app — sign-in is optional (for cloud sync only)
  return <AppContent user={loading ? null : user} signOut={signOut} signIn={signInWithGoogle} />
}
