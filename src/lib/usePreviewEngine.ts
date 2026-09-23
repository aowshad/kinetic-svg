import { useEffect, useState } from 'react'

const KEY = 'kinetic-engine'
export type Engine = 'vanilla' | 'gsap'

function read(): Engine {
  try {
    const v = sessionStorage.getItem(KEY)
    return v === 'vanilla' || v === 'gsap' ? v : 'vanilla'
  } catch {
    return 'vanilla'
  }
}

export function usePreviewEngine() {
  const [engine, setEngine] = useState<Engine>(read)

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, engine)
    } catch {
      // ignore
    }
  }, [engine])

  return [engine, setEngine] as const
}
