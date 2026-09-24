import { paths } from '../../../lib/paths'
import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o) => {
  // #region body
  const parts = paths(svg)
  // Periods that share no common beat, so the parts never visibly fall into step.
  const RATES = [1, 1.37, 0.83, 1.19, 0.91]
  const easing = LINEAR_EASE_MAP[o.ease] ?? 'linear'
  const animations = parts.map((part, i) =>
    part.animate(
      [{ transform: 'translate(0px, 0px)' }, { transform: `translate(${i % 2 ? 3 : -3}px, ${i % 3 ? -4 : 4}px)` }],
      { duration: o.duration * 1000 * RATES[i % RATES.length], iterations: Infinity, direction: 'alternate', easing },
    ),
  )

  return () => animations.forEach((a) => a.cancel())
  // #endregion body
}
