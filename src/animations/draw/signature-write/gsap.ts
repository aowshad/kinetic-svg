import { gsap } from '../../../lib/gsap'
import { capPad, paths, strokeLength } from '../../../lib/paths'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const [stroke] = paths(svg).filter((s) => s.getAttribute('stroke'))
  if (!stroke) {
    onComplete?.() // @internal
    return () => {}
  }
  const length = strokeLength(stroke)
  const pad = capPad(stroke)
  const hidden = length + pad
  gsap.set(stroke, { strokeDasharray: `${length} ${hidden + pad}`, strokeDashoffset: hidden })
  const tl = gsap.timeline({ delay: o.delay, onComplete }) // @emit: const tl = gsap.timeline({ delay: o.delay })
  tl.to(stroke, { strokeDashoffset: 0, duration: o.duration, ease: o.ease })
  // Once written, drop the dash so a later resize can't reopen a gap.
  tl.set(stroke, { strokeDasharray: 'none' })

  return () => {
    tl.progress(1).kill() // @emit: tl.kill()
    gsap.set(stroke, { clearProps: 'strokeDasharray,strokeDashoffset' })
  }
  // #endregion body
}
