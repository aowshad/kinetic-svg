import { useEffect, useState } from 'react'
import { DEMOS } from '../demos'

const KEY = 'kinetic-svg-demo'
export const DEFAULT_DEMO = DEMOS[0].id

function read(): string {
  try {
    return sessionStorage.getItem(KEY) ?? DEFAULT_DEMO
  } catch {
    return DEFAULT_DEMO
  }
}

/**
 * The chosen demo shape, shared across the page — the same live-update model
 * the text library used for its sample text. Each module declares which demos
 * it supports, so a card falls back to its own first demo when the page-wide
 * choice isn't one of them, rather than rendering something broken.
 */
export function useDemo() {
  const [value, setValue] = useState(read)

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, value)
    } catch {
      // ignore
    }
  }, [value])

  return [value, setValue] as const
}

export const resolveDemo = (supported: string[], chosen: string): string =>
  supported.includes(chosen) ? chosen : supported[0]
