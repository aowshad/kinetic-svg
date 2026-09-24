import { gsap } from '../../../lib/gsap'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  // The outer <svg> is a CSS box, so it takes a true 3D transform, and the
  // perspective travels with it rather than depending on a parent's style.
  const tl = gsap.timeline({ delay: o.delay, onComplete }) // @emit: const tl = gsap.timeline({ delay: o.delay })
  tl.fromTo(svg, { rotationY: -90, transformPerspective: 600 }, { rotationY: 0, duration: o.duration, ease: o.ease })

  return () => {
    tl.progress(1).kill() // @emit: tl.kill()
    gsap.set(svg, { clearProps: 'transform' })
  }
  // #endregion body
}
