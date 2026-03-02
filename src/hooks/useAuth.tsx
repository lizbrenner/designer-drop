import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { User } from '@/types/user'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  login: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const MOCK_USER: User = {
  id: 'current-user-1',
  displayName: 'Current User',
  avatarUrl: undefined,
  email: 'user@cognite.com',
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(MOCK_USER)

  const setUser = useCallback((u: User | null) => setUserState(u), [])
  const login = useCallback((u: User) => setUserState(u), [])
  const logout = useCallback(() => setUserState(null), [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      setUser,
      login,
      logout,
    }),
    [user, setUser, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
