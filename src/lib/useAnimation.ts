import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import type { Engine } from './usePreviewEngine'
import type { AnimationModule, AnimationOptions } from './types'

// Under reduced motion a 'settle' animation jumps to its true end state in
// one near-instant step instead of playing.
const REDUCED_DURATION = 0.01

/**
 * No fitText here: the text library measured and re-measured because type had
 * to be sized to its box in pixels. An <svg> with a viewBox scales itself, so
 * the stage sets a width and the artwork follows — nothing to measure, and no
 * resize observer driving a re-run.
 */
export function useAnimation(
  module: AnimationModule,
  options: AnimationOptions,
  active: boolean,
  playKey: string,
  engine: Engine,
  onPlaying?: (playing: boolean) => void,
) {
  const ref = useRef<SVGSVGElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const svg = ref.current
    if (!active || !svg) return
    let cancelled = false
    let cleanup: (() => void) | undefined

    document.fonts.ready.then(() => {
      if (cancelled) return
      const impl = engine === 'vanilla' && module.impl.vanilla ? module.impl.vanilla : module.impl.gsap

      if (prefersReducedMotion && module.reducedMotion === 'skip') {
        onPlaying?.(false)
        return
      }

      const effectiveOptions = prefersReducedMotion
        ? { ...options, duration: REDUCED_DURATION, stagger: 0, delay: 0 }
        : options

      onPlaying?.(true)
      cleanup = impl(svg, effectiveOptions, () => onPlaying?.(false))
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, playKey, engine, prefersReducedMotion])

  return ref
}
