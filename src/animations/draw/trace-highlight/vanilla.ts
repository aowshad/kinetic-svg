import { capPad, paths, strokeLength } from '../../../lib/paths'
import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const shapes = paths(svg).filter((s) => s.getAttribute('stroke'))
  const easing = LINEAR_EASE_MAP[o.ease] ?? 'linear'
  // The dash runs on a copy laid over each stroke, so the drawing itself can
  // dim underneath it rather than disappear.
  const traces = shapes.map((shape) => {
    const trace = shape.cloneNode(true) as SVGGeometryElement // @emit: const trace = shape.cloneNode(true)
    shape.after(trace)
    return trace
  })

  const ms = o.duration * 1000
  const lag = o.stagger * 1000
  const travel = ms * 0.85
  // Dim for 12%, hold until the last dash has run, then come back up.
  const total = (traces.length - 1) * lag + ms
  const dimmed = (ms * 0.12) / total
  const restore = ((traces.length - 1) * lag + travel) / total

  const animations = [
    ...shapes.map((shape) =>
      shape.animate(
        [{ opacity: 1 }, { opacity: 0.25, offset: dimmed }, { opacity: 0.25, offset: restore }, { opacity: 1 }],
        { duration: total, delay: o.delay * 1000, fill: 'both' },
      ),
    ),
    ...traces.map((trace, i) => {
      const length = strokeLength(trace)
      const pad = capPad(trace)
      const dash = length * 0.14
      trace.style.strokeDasharray = `${dash} ${length + 2 * pad}`
      return trace.animate([{ strokeDashoffset: dash + pad }, { strokeDashoffset: -(length + pad) }], {
        duration: travel,
        delay: o.delay * 1000 + i * lag,
        easing,
        fill: 'both',
      })
    }),
  ]
  Promise.all(animations.map((a) => a.finished))
    .then(() => traces.forEach((trace) => trace.remove()))
    .catch(() => {})
  Promise.all(animations.map((a) => a.finished)).then(() => onComplete?.()).catch(() => {}) // @internal

  return () => {
    animations.forEach((a) => a.cancel())
    traces.forEach((trace) => trace.remove())
  }
  // #endregion body
}
