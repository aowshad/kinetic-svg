import { gsap } from '../../../lib/gsap'
import { paths } from '../../../lib/paths'
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
  // GSAP resolves an SVG origin against each copy's own bounding box.
  gsap.set(copies, { transformOrigin: '50% 50%' })
  const tween = gsap.fromTo(
    copies,
    { scale: 1, opacity: 0.6 },
    { scale: 1.8, opacity: 0, duration: o.duration, ease: o.ease, stagger: { each: o.duration / 2, repeat: -1 } },
  )

  return () => {
    tween.kill()
    copies.forEach((copy) => copy.remove())
  }
  // #endregion body
}
