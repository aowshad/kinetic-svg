import { gsap } from '../../../lib/gsap'
import { paths } from '../../../lib/paths'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o) => {
  // #region body
  const parts = paths(svg)
  // Periods that share no common beat, so the parts never visibly fall into step.
  const RATES = [1, 1.37, 0.83, 1.19, 0.91]
  const tweens = parts.map((part, i) =>
    gsap.to(part, {
      x: i % 2 ? 3 : -3,
      y: i % 3 ? -4 : 4,
      duration: o.duration * RATES[i % RATES.length],
      ease: o.ease,
      repeat: -1,
      yoyo: true,
    }),
  )

  return () => {
    tweens.forEach((t) => t.kill())
    gsap.set(parts, { clearProps: 'all' })
  }
  // #endregion body
}
