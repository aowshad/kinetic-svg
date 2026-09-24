import { gsap } from '../../../lib/gsap'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const [top, mid, bottom] = [...svg.querySelectorAll('.bar')]
  const tl = gsap.timeline({ delay: o.delay, onComplete }) // @emit: const tl = gsap.timeline({ delay: o.delay })

  // GSAP resolves an SVG transformOrigin against the element's own bounding
  // box and bakes it into the matrix it writes. Adding transform-box: fill-box
  // on top shifts what that matrix is relative to, and the bars miss centre.
  gsap.set([top, mid, bottom], { transformOrigin: '50% 50%' })

  // Converge on the centre, then cross while the middle bar fades.
  const half = o.duration * 0.5
  tl.to(top, { y: 17.5, duration: half, ease: o.ease }, 0)
    .to(bottom, { y: -17.5, duration: half, ease: o.ease }, 0)
    .to(top, { rotate: 45, duration: half, ease: o.ease }, half)
    .to(bottom, { rotate: -45, duration: half, ease: o.ease }, half)
    .to(mid, { opacity: 0, duration: half, ease: o.ease }, half)

  return () => {
    tl.progress(1).kill() // @emit: tl.kill()
    gsap.set([top, mid, bottom], { clearProps: 'all' })
  }
  // #endregion body
}
