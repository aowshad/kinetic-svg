import { paths } from '../../../lib/paths'
import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o) => {
  // #region body
  const [, ...orbiters] = paths(svg)
  const box = svg.viewBox.baseVal
  // One pivot shared by every orbiter: the centre of the canvas. view-box is
  // the right reference for that, and its origin is the user-space origin,
  // which is why the centre is given in the drawing's own coordinates.
  orbiters.forEach((part) => {
    part.style.transformBox = 'view-box'
    part.style.transformOrigin = `${box.x + box.width / 2}px ${box.y + box.height / 2}px`
  })
  const animations = orbiters.map((part) =>
    part.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
      duration: o.duration * 1000,
      iterations: Infinity,
      easing: LINEAR_EASE_MAP[o.ease] ?? 'linear',
    }),
  )

  return () => {
    animations.forEach((a) => a.cancel())
    orbiters.forEach((part) => {
      part.style.transformBox = ''
      part.style.transformOrigin = ''
    })
  }
  // #endregion body
}
