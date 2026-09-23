import { gsap } from '../../../lib/gsap'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const [top, mid, bottom] = [...svg.querySelectorAll('.bar')]
  const tl = gsap.timeline({ delay: o.delay, onComplete }) // @emit: const tl = gsap.timeline({ delay: o.delay })

  gsap.set([top, mid, bottom], { transformBox: 'fill-box', transformOrigin: 'center' })

  tl.to(mid, { opacity: 0, duration: o.duration * 0.4, ease: o.ease }, 0)
    .to(top, { y: 17.5, duration: o.duration * 0.5, ease: o.ease }, 0)
    .to(bottom, { y: -17.5, duration: o.duration * 0.5, ease: o.ease }, 0)
    .to(top, { rotate: 45, duration: o.duration * 0.5, ease: o.ease }, o.duration * 0.45)
    .to(bottom, { rotate: -45, duration: o.duration * 0.5, ease: o.ease }, o.duration * 0.45)

  return () => {
    tl.progress(1).kill() // @emit: tl.kill()
    gsap.set([top, mid, bottom], { clearProps: 'all' })
  }
  // #endregion body
}
