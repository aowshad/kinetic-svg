import { sampleEase } from './sampleEase'

/**
 * Converts a GSAP ease name into a CSS `linear()` easing function string,
 * by sampling the curve and handing WAAPI/CSS the same shape point-for-point.
 * This is how elastic/back/bounce eases — impossible to express as a single
 * cubic-bezier — survive the move to a zero-dependency implementation.
 */
export function toLinearEase(name: string, samples = 40): string {
  if (name === 'none') return 'linear'
  const points = sampleEase(name, samples).map((v) => v.toFixed(4))
  return `linear(${points.join(',')})`
}
