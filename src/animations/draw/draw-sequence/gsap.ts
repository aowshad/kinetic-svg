import { gsap } from '../../../lib/gsap'
import { capPad, paths, strokeLength } from '../../../lib/paths'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const shapes = paths(svg).filter((s) => s.getAttribute('stroke'))
  const lengths = shapes.map((s) => strokeLength(s))
  const total = lengths.reduce((a, b) => a + b, 0) || 1
  const tl = gsap.timeline({ delay: o.delay, onComplete }) // @emit: const tl = gsap.timeline({ delay: o.delay })

  // Each stroke's share of the duration is proportional to its length, so the
  // pen moves at one speed, and each waits for the previous one to finish.
  shapes.forEach((shape, i) => {
    const pad = capPad(shape)
    const hidden = lengths[i] + pad
    gsap.set(shape, { strokeDasharray: `${lengths[i]} ${hidden + pad}`, strokeDashoffset: hidden })
    tl.to(shape, { strokeDashoffset: 0, duration: (o.duration * lengths[i]) / total, ease: o.ease }, i ? `>+${o.stagger}` : 0)
  })
  // Once drawn, drop the dash so a later resize can't reopen a gap.
  tl.set(shapes, { strokeDasharray: 'none' })

  return () => {
    tl.progress(1).kill() // @emit: tl.kill()
    gsap.set(shapes, { clearProps: 'strokeDasharray,strokeDashoffset' })
  }
  // #endregion body
}
