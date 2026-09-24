import { gsap } from '../../../lib/gsap'
import { capPad, paths, strokeLength } from '../../../lib/paths'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const shapes = paths(svg).filter((s) => s.getAttribute('stroke'))
  const tl = gsap.timeline({ delay: o.delay, onComplete }) // @emit: const tl = gsap.timeline({ delay: o.delay })

  shapes.forEach((shape, i) => {
    const length = strokeLength(shape)
    const pad = capPad(shape)
    const hidden = length + pad
    gsap.set(shape, { strokeDasharray: `${length} ${hidden + pad}`, strokeDashoffset: hidden })
    tl.to(shape, { strokeDashoffset: 0, duration: o.duration * 0.42, ease: o.ease }, i * o.stagger)
    tl.to(shape, { strokeDashoffset: -hidden, duration: o.duration * 0.42, ease: o.ease }, i * o.stagger + o.duration * 0.58)
  })
  // Erased is the end state. A screen-pixel dash can stop covering the path if
  // the drawing is resized later, so hide it outright rather than trust it.
  tl.set(shapes, { visibility: 'hidden' })

  return () => {
    tl.progress(1).kill() // @emit: tl.kill()
    gsap.set(shapes, { clearProps: 'strokeDasharray,strokeDashoffset,visibility' })
  }
  // #endregion body
}
