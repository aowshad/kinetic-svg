/**
 * Plain-JS versions of the helpers the implementations depend on, for
 * inlining directly above an emitted function — a copied snippet that
 * imports these from the repo is the exact failure mode this whole approach
 * exists to avoid.
 *
 * Kept in sync BY HAND with paths.ts / easeAt.ts / scrollScrub.ts: identical
 * logic, TypeScript-only syntax removed, since the emitted snippet is plain
 * JS with no build step. If those files' logic changes, update these strings
 * to match.
 */

export const PATHS_SOURCE = `function paths(svg) {
  return [...svg.querySelectorAll('path, line, polyline, polygon, circle, ellipse, rect')].filter(
    (el) => !el.closest('defs, clipPath, mask'),
  )
}`

export const STROKE_LENGTH_SOURCE = `function strokeLength(el) {
  const m = el.getScreenCTM()
  const nonScaling = getComputedStyle(el).vectorEffect === 'non-scaling-stroke'
  return el.getTotalLength() * (nonScaling && m ? Math.hypot(m.a, m.b) : 1)
}`

export const CAP_PAD_SOURCE = `function capPad(el) {
  const s = getComputedStyle(el)
  return s.strokeLinecap === 'butt' ? 0 : (parseFloat(s.strokeWidth) || 0) / 2 + 1
}`

export const EASE_AT_SOURCE = `function easeAt(points, t) {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t
  const scaled = clamped * (points.length - 1)
  const i = Math.floor(scaled)
  const frac = scaled - i
  const a = points[i]
  const b = points[Math.min(i + 1, points.length - 1)]
  return a + (b - a) * frac
}`
