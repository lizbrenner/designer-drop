import { Agentation } from 'agentation'
import { AuthProvider } from '@/hooks/useAuth'
import { Routes } from '@/routes'

function App() {
  return (
    <>
      <AuthProvider>
        <Routes />
      </AuthProvider>
      <Agentation />
    </>
  )
}

export default App
