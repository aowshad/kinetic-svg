import { gsap } from '../../../lib/gsap'
import { paths } from '../../../lib/paths'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o) => {
  // #region body
  const shapes = paths(svg).filter((s) => s.getAttribute('stroke'))
  // One dash and one gap. The gap outruns a round cap's overhang on an 8px
  // stroke, which would otherwise close it up into a solid line.
  const dash = 8
  const gap = 14
  gsap.set(shapes, { strokeDasharray: `${dash} ${gap}`, strokeDashoffset: 0 })
  const tween = gsap.to(shapes, { strokeDashoffset: -(dash + gap), duration: o.duration, ease: o.ease, repeat: -1 })

  return () => {
    tween.kill()
    gsap.set(shapes, { clearProps: 'strokeDasharray,strokeDashoffset' })
  }
  // #endregion body
}
