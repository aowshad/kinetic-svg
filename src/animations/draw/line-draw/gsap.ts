import { gsap } from '../../../lib/gsap'
import { paths } from '../../../lib/paths'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const shapes = paths(svg)
  const tl = gsap.timeline({ delay: o.delay, onComplete }) // @emit: const tl = gsap.timeline({ delay: o.delay })

  shapes.forEach((shape, i) => {
    // A non-scaling stroke measures its dash in screen pixels rather than the
    // path's own units, so the length is scaled to match when one is in effect.
    const m = shape.getScreenCTM()
    const nonScaling = getComputedStyle(shape).vectorEffect === 'non-scaling-stroke'
    const length = shape.getTotalLength() * (nonScaling && m ? Math.hypot(m.a, m.b) : 1)
    gsap.set(shape, { strokeDasharray: length, strokeDashoffset: length })
    tl.to(shape, { strokeDashoffset: 0, duration: o.duration, ease: o.ease }, i * o.stagger)
  })
  // Once drawn, drop the dash: a resize after this point would otherwise
  // leave a screen-pixel dash that no longer covers the path.
  tl.set(shapes, { strokeDasharray: 'none' })

  return () => {
    tl.progress(1).kill() // @emit: tl.kill()
    gsap.set(shapes, { clearProps: 'strokeDasharray,strokeDashoffset' })
  }
  // #endregion body
}
