"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const defaultValue: ThemeContextType = {
  theme: 'dark',
  toggleTheme: () => {}
}

const ThemeContext = createContext<ThemeContextType>(defaultValue)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('dj_flowerz_theme') as Theme
    if (stored) {
      setTheme(stored)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', theme === 'dark')
      localStorage.setItem('dj_flowerz_theme', theme)
    }
  }, [theme, mounted])

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
