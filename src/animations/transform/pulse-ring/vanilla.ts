import { paths } from '../../../lib/paths'
import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o) => {
  // #region body
  const [ring] = paths(svg)
  if (!ring) return () => {}
  // Two copies behind the original, which never moves.
  const copies = [0, 1].map(() => {
    const copy = ring.cloneNode(true) as SVGGeometryElement // @emit: const copy = ring.cloneNode(true)
    ring.before(copy)
    return copy
  })
  const ms = o.duration * 1000
  const animations = copies.map((copy, i) => {
    // Without fill-box each copy would swell out from the SVG's top-left corner.
    copy.style.transformBox = 'fill-box'
    copy.style.transformOrigin = 'center'
    return copy.animate([{ transform: 'scale(1)', opacity: 0.6 }, { transform: 'scale(1.8)', opacity: 0 }], {
      duration: ms,
      delay: (ms / 2) * i,
      iterations: Infinity,
      easing: LINEAR_EASE_MAP[o.ease] ?? 'linear',
    })
  })

  return () => {
    animations.forEach((a) => a.cancel())
    copies.forEach((copy) => copy.remove())
  }
  // #endregion body
}
