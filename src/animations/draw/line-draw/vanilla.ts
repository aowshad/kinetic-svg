import { paths } from '../../../lib/paths'
import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const shapes = paths(svg)
  const easing = LINEAR_EASE_MAP[o.ease] ?? 'linear'

  const animations = shapes.map((shape, i) => {
    // A non-scaling stroke measures its dash in screen pixels rather than the
    // path's own units, so the length is scaled to match when one is in effect.
    const m = shape.getScreenCTM()
    const nonScaling = getComputedStyle(shape).vectorEffect === 'non-scaling-stroke'
    const length = shape.getTotalLength() * (nonScaling && m ? Math.hypot(m.a, m.b) : 1)
    shape.style.strokeDasharray = String(length) // @emit: shape.style.strokeDasharray = length
    const animation = shape.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
      duration: o.duration * 1000,
      delay: o.delay * 1000 + i * o.stagger * 1000,
      easing,
      fill: 'both',
    })
    // Once drawn, drop the dash: a resize after this point would otherwise
    // leave a screen-pixel dash that no longer covers the path.
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
