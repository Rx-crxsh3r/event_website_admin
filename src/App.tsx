import { useSuperAdminAuth } from './lib/useSuperAdminAuth'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  const { status, user, error, signIn, signOut } = useSuperAdminAuth()

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500 text-sm">
        Loading…
      </div>
    )
  }

  if (status === 'authorized' && user) {
    return <DashboardPage user={user} onSignOut={signOut} />
  }

  return (
    <LoginPage
      onSignIn={signIn}
      error={error}
      unauthorized={status === 'unauthorized'}
    />
  )
}

export default App
