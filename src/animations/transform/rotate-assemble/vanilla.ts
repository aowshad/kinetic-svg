import { paths } from '../../../lib/paths'
import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const parts = paths(svg)
  // A fixed scatter rather than Math.random, so every replay flies in the same way.
  const SCATTER = [
    [-38, -30, -140],
    [34, -26, 120],
    [-30, 34, 160],
    [36, 30, -110],
    [0, -44, 90],
  ]
  // Without fill-box an SVG origin resolves against the whole canvas, and each
  // part would turn about the SVG's top-left corner instead of itself.
  parts.forEach((part) => {
    part.style.transformBox = 'fill-box'
    part.style.transformOrigin = 'center'
  })
  const easing = LINEAR_EASE_MAP[o.ease] ?? 'linear'
  const animations = parts.map((part, i) => {
    const [x, y, rotate] = SCATTER[i % SCATTER.length]
    return part.animate(
      [
        { transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)`, opacity: 0 },
        { transform: 'translate(0px, 0px) rotate(0deg)', opacity: 1 },
      ],
      { duration: o.duration * 1000, delay: o.delay * 1000 + i * o.stagger * 1000, easing, fill: 'both' },
    )
  })

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
