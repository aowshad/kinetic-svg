import { capPad, paths, strokeLength } from '../../../lib/paths'
import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const shapes = paths(svg).filter((s) => s.getAttribute('stroke'))
  const easing = LINEAR_EASE_MAP[o.ease] ?? 'linear'

  // Draw, hold, erase — one animation per stroke with the ease on each phase.
  const animations = shapes.map((shape, i) => {
    const length = strokeLength(shape)
    const pad = capPad(shape)
    const hidden = length + pad
    shape.style.strokeDasharray = `${length} ${hidden + pad}`
    const animation = shape.animate(
      [
        { strokeDashoffset: hidden, easing },
        { strokeDashoffset: 0, offset: 0.42 },
        { strokeDashoffset: 0, offset: 0.58, easing },
        { strokeDashoffset: -hidden },
      ],
      { duration: o.duration * 1000, delay: o.delay * 1000 + i * o.stagger * 1000, fill: 'both' },
    )
    // Erased is the end state. A screen-pixel dash can stop covering the path
    // if the drawing is resized later, so hide it outright rather than trust it.
    animation.finished.then(() => (shape.style.visibility = 'hidden')).catch(() => {})
    return animation
  })

  Promise.all(animations.map((a) => a.finished)).then(() => onComplete?.()).catch(() => {}) // @internal

  return () => {
    animations.forEach((a) => a.cancel())
    shapes.forEach((shape) => {
      shape.style.strokeDasharray = ''
      shape.style.visibility = ''
    })
  }
  // #endregion body
}
