import { AuthProvider } from '@/hooks/useAuth'
import { Routes } from '@/routes'

function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  )
}

export default App
