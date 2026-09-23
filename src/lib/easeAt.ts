/**
 * Samples a precomputed ease curve (see EASE_POINTS in linearEases.ts) at
 * progress `t` (0–1) via linear interpolation between the two nearest
 * points. This is what drives an ease curve for a value Element.animate()
 * can't touch directly — a counter's number, a revealed character count —
 * without needing GSAP or a tween engine: just rAF and this lookup.
 */
export function easeAt(points: number[], t: number): number {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t
  const scaled = clamped * (points.length - 1)
  const i = Math.floor(scaled)
  const frac = scaled - i
  const a = points[i]
  const b = points[Math.min(i + 1, points.length - 1)]
  return a + (b - a) * frac
}
