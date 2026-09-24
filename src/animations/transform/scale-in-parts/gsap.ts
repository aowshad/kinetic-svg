import { gsap } from '../../../lib/gsap'
import { paths } from '../../../lib/paths'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const parts = paths(svg)
  // GSAP resolves an SVG origin against each element's own bounding box.
  // transform-box: fill-box on top would shift what its matrix is relative to.
  gsap.set(parts, { transformOrigin: '50% 50%' })
  const tl = gsap.timeline({ delay: o.delay, onComplete }) // @emit: const tl = gsap.timeline({ delay: o.delay })
  tl.from(parts, { scale: 0, duration: o.duration, stagger: o.stagger, ease: o.ease })

  return () => {
    tl.progress(1).kill() // @emit: tl.kill()
    gsap.set(parts, { clearProps: 'all' })
  }
  // #endregion body
}
