import { paths } from '../../../lib/paths'
import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o) => {
  // #region body
  const shapes = paths(svg).filter((s) => s.getAttribute('stroke'))
  // One dash and one gap. The gap outruns a round cap's overhang on an 8px
  // stroke, which would otherwise close it up into a solid line.
  const dash = 8
  const gap = 14
  const animations = shapes.map((shape) => {
    shape.style.strokeDasharray = `${dash} ${gap}`
    return shape.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -(dash + gap) }], {
      duration: o.duration * 1000,
      iterations: Infinity,
      easing: LINEAR_EASE_MAP[o.ease] ?? 'linear',
    })
  })

  return () => {
    animations.forEach((a) => a.cancel())
    shapes.forEach((shape) => {
      shape.style.strokeDasharray = ''
    })
  }
  // #endregion body
}
