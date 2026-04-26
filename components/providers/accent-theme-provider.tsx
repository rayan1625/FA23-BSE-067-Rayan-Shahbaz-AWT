'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  ACCENT_STORAGE_KEY,
  type ColorThemeId,
  isColorThemeId,
} from '@/lib/color-themes'

type AccentContextValue = {
  accent: ColorThemeId
  setAccent: (id: ColorThemeId) => void
}

const AccentContext = createContext<AccentContextValue | null>(null)

export function AccentThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<ColorThemeId>('indigo')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(ACCENT_STORAGE_KEY)
    if (stored && isColorThemeId(stored)) {
      setAccentState(stored)
      document.documentElement.setAttribute('data-accent', stored)
    } else {
      document.documentElement.setAttribute('data-accent', 'indigo')
    }
    setReady(true)
  }, [])

  const setAccent = useCallback((id: ColorThemeId) => {
    setAccentState(id)
    localStorage.setItem(ACCENT_STORAGE_KEY, id)
    document.documentElement.setAttribute('data-accent', id)
  }, [])

  useEffect(() => {
    if (!ready) return
    document.documentElement.setAttribute('data-accent', accent)
  }, [accent, ready])

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>{children}</AccentContext.Provider>
  )
}

export function useAccentTheme() {
  const ctx = useContext(AccentContext)
  if (!ctx) {
    throw new Error('useAccentTheme must be used within AccentThemeProvider')
  }
  return ctx
}
