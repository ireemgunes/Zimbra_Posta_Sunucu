'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useToast } from '@/context/ToastContext'

type ThemeMode = 'dark' | 'light'

interface ThemeContextType {
  theme: ThemeMode
  isDark: boolean
  toggleTheme: () => void
  setThemeMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { addToast } = useToast()
  const [theme, setTheme] = useState<ThemeMode>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('mailos_theme') as ThemeMode
    if (saved === 'light') {
      setTheme('light')
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    } else {
      setTheme('dark')
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
    }
  }, [])

  const applyTheme = (newMode: ThemeMode) => {
    setTheme(newMode)
    localStorage.setItem('mailos_theme', newMode)
    if (newMode === 'dark') {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
      addToast('Theme Switched', 'Dark Command Center theme activated.', 'info')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      addToast('Theme Switched', 'Clean Light Mode theme activated.', 'info')
    }
  }

  const toggleTheme = () => {
    applyTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setThemeMode: applyTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
