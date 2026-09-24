import { gsap } from '../../../lib/gsap'
import { paths } from '../../../lib/paths'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o) => {
  // #region body
  const [, ...orbiters] = paths(svg)
  const box = svg.viewBox.baseVal
  // svgOrigin is GSAP's shared pivot in the SVG's own coordinates.
  const tween = gsap.to(orbiters, {
    rotate: 360,
    svgOrigin: `${box.x + box.width / 2} ${box.y + box.height / 2}`,
    duration: o.duration,
    ease: o.ease,
    repeat: -1,
  })

  return () => {
    tween.kill()
    gsap.set(orbiters, { clearProps: 'all' })
  }
  // #endregion body
}
