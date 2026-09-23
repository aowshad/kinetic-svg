import { gsap } from '../../../lib/gsap'
import { paths } from '../../../lib/paths'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const shapes = paths(svg)
  const tl = gsap.timeline({ delay: o.delay, onComplete }) // @emit: const tl = gsap.timeline({ delay: o.delay })

  shapes.forEach((shape, i) => {
    const length = shape.getTotalLength()
    gsap.set(shape, { strokeDasharray: length, strokeDashoffset: length })
    tl.to(shape, { strokeDashoffset: 0, duration: o.duration, ease: o.ease }, i * o.stagger)
  })

  return () => {
    tl.progress(1).kill() // @emit: tl.kill()
    gsap.set(shapes, { clearProps: 'strokeDasharray,strokeDashoffset' })
  }
  // #endregion body
}
