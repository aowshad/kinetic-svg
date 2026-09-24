import { gsap } from '../../../lib/gsap'
import { paths } from '../../../lib/paths'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const parts = paths(svg)
  const tl = gsap.timeline({ delay: o.delay, onComplete }) // @emit: const tl = gsap.timeline({ delay: o.delay })
  parts.forEach((part, i) => {
    tl.from(part, { y: -70, duration: o.duration, ease: o.ease }, i * o.stagger)
    tl.from(part, { opacity: 0, duration: o.duration * 0.25, ease: 'power1.out' }, i * o.stagger)
  })

  return () => {
    tl.progress(1).kill() // @emit: tl.kill()
    gsap.set(parts, { clearProps: 'all' })
  }
  // #endregion body
}
