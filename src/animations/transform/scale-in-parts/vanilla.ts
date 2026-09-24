import { paths } from '../../../lib/paths'
import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const parts = paths(svg)
  // Without fill-box an SVG origin resolves against the whole canvas, and each
  // part would turn about the SVG's top-left corner instead of itself.
  parts.forEach((part) => {
    part.style.transformBox = 'fill-box'
    part.style.transformOrigin = 'center'
  })
  const easing = LINEAR_EASE_MAP[o.ease] ?? 'linear'
  const animations = parts.map((part, i) =>
    part.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
      duration: o.duration * 1000,
      delay: o.delay * 1000 + i * o.stagger * 1000,
      easing,
      fill: 'both',
    }),
  )

  Promise.all(animations.map((a) => a.finished)).then(() => onComplete?.()).catch(() => {}) // @internal

  return () => {
    animations.forEach((a) => a.cancel())
    parts.forEach((part) => {
      part.style.transformBox = ''
      part.style.transformOrigin = ''
    })
  }
  // #endregion body
}
