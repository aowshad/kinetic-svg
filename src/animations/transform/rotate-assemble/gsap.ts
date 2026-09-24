import { gsap } from '../../../lib/gsap'
import { paths } from '../../../lib/paths'
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
  // GSAP resolves an SVG origin against each element's own bounding box.
  // transform-box: fill-box on top would shift what its matrix is relative to.
  gsap.set(parts, { transformOrigin: '50% 50%' })
  const tl = gsap.timeline({ delay: o.delay, onComplete }) // @emit: const tl = gsap.timeline({ delay: o.delay })
  parts.forEach((part, i) => {
    const [x, y, rotate] = SCATTER[i % SCATTER.length]
    tl.from(part, { x, y, rotate, opacity: 0, duration: o.duration, ease: o.ease }, i * o.stagger)
  })

  return () => {
    tl.progress(1).kill() // @emit: tl.kill()
    gsap.set(parts, { clearProps: 'all' })
  }
  // #endregion body
}
