import { capPad, paths, strokeLength } from '../../../lib/paths'
import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const shapes = paths(svg).filter((s) => s.getAttribute('stroke'))
  const lengths = shapes.map((s) => strokeLength(s))
  const total = lengths.reduce((a, b) => a + b, 0) || 1
  const easing = LINEAR_EASE_MAP[o.ease] ?? 'linear'

  // Each stroke's share of the duration is proportional to its length, so the
  // pen moves at one speed, and each waits for the previous one to finish.
  let start = o.delay * 1000
  const animations = shapes.map((shape, i) => {
    const duration = (o.duration * 1000 * lengths[i]) / total
    const pad = capPad(shape)
    const hidden = lengths[i] + pad
    shape.style.strokeDasharray = `${lengths[i]} ${hidden + pad}`
    const animation = shape.animate([{ strokeDashoffset: hidden }, { strokeDashoffset: 0 }], {
      duration,
      delay: start,
      easing,
      fill: 'both',
    })
    start += duration + o.stagger * 1000
    // Once drawn, drop the dash so a later resize can't reopen a gap.
    animation.finished.then(() => (shape.style.strokeDasharray = 'none')).catch(() => {})
    return animation
  })

  Promise.all(animations.map((a) => a.finished)).then(() => onComplete?.()).catch(() => {}) // @internal

  return () => {
    animations.forEach((a) => a.cancel())
    shapes.forEach((shape) => {
      shape.style.strokeDasharray = ''
    })
  }
  // #endregion body
}
