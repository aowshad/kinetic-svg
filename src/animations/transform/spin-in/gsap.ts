import { gsap } from '../../../lib/gsap'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  // One group around the whole drawing, so it turns about its own centre as a
  // single piece. A <title> stays where it is: it names the <svg>, and moving
  // it into a group would take that name away.
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  group.append(...[...svg.children].filter((el) => el.tagName !== 'title'))
  svg.append(group)
  // GSAP resolves an SVG origin against the element's own bounding box.
  gsap.set(group, { transformOrigin: '50% 50%' })
  const tl = gsap.timeline({ delay: o.delay, onComplete }) // @emit: const tl = gsap.timeline({ delay: o.delay })
  tl.from(group, { rotate: -180, scale: 0, duration: o.duration, ease: o.ease })

  return () => {
    tl.progress(1).kill() // @emit: tl.kill()
    group.replaceWith(...group.childNodes)
  }
  // #endregion body
}
