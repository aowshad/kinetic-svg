import { useEffect, useState } from 'react'

const THEME_KEY = 'kinetic-svg-theme'
export type ThemeMode = 'system' | 'light' | 'dark'

function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function readMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'
  } catch {
    return 'system'
  }
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(readMode)

  useEffect(() => {
    const apply = () => document.documentElement.setAttribute('data-theme', resolve(mode))
    apply()
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [mode])

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, mode)
    } catch {
      // ignore
    }
  }, [mode])

  return { mode, setMode }
}
