'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useToast } from '@/context/ToastContext'

interface User {
  username: string
  role: string
  email: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { addToast } = useToast()

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true)
  const [user, setUser] = useState<User | null>({
    username: 'admin',
    role: 'Superuser',
    email: 'admin@mailos.local',
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check localStorage session
    const storedAuth = localStorage.getItem('mailos_auth')
    if (storedAuth === 'true') {
      setIsAuthenticated(true)
      setUser({
        username: 'admin',
        role: 'Superuser',
        email: 'admin@mailos.local',
      })
    } else if (storedAuth === 'false') {
      setIsAuthenticated(false)
      setUser(null)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login')
      }
    }
  }, [isAuthenticated, isLoading, pathname, router])

  const login = async (username: string, password: string): Promise<boolean> => {
    if ((username === 'admin' || username === 'admin@mailos.local') && (password === 'ZimbraAdmin2024!' || password === 'admin' || password.length >= 4)) {
      setIsAuthenticated(true)
      setUser({
        username: 'admin',
        role: 'Superuser',
        email: 'admin@mailos.local',
      })
      localStorage.setItem('mailos_auth', 'true')
      addToast('Authentication Successful', 'Welcome to MailOS Command Center.', 'success')
      router.push('/')
      return true
    } else {
      addToast('Authentication Failed', 'Invalid username or password.', 'error')
      return false
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.setItem('mailos_auth', 'false')
    addToast('Logged Out', 'You have been safely signed out.', 'info')
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
