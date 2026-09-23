import { gsap } from './gsap'

/**
 * Samples a GSAP ease at `count` evenly spaced points from t=0 to t=1
 * inclusive. Shared by the ease-picker curve thumbnails and the build-time
 * toLinearEase() converter — one source of truth for what an ease curve
 * looks like everywhere in the app.
 */
export function sampleEase(name: string, count: number): number[] {
  const fn = gsap.parseEase(name) ?? ((t: number) => t)
  return Array.from({ length: count }, (_, i) => fn(i / (count - 1)))
}
