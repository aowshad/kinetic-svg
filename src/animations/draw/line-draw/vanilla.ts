import { paths } from '../../../lib/paths'
import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const shapes = paths(svg)
  const easing = LINEAR_EASE_MAP[o.ease] ?? 'linear'

  const animations = shapes.map((shape, i) => {
    const length = shape.getTotalLength()
    shape.style.strokeDasharray = String(length) // @emit: shape.style.strokeDasharray = length
    return shape.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
      duration: o.duration * 1000,
      delay: o.delay * 1000 + i * o.stagger * 1000,
      easing,
      fill: 'both',
    })
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
