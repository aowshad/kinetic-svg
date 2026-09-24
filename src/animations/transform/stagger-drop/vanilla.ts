import { paths } from '../../../lib/paths'
import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const parts = paths(svg)
  const easing = LINEAR_EASE_MAP[o.ease] ?? 'linear'
  const ms = o.duration * 1000
  // Position and opacity are separate animations because they want different
  // eases — a bounce on the fade would flicker. They touch different
  // properties, so neither overwrites the other.
  const animations = parts.flatMap((part, i) => {
    const delay = o.delay * 1000 + i * o.stagger * 1000
    return [
      part.animate([{ transform: 'translateY(-70px)' }, { transform: 'translateY(0px)' }], { duration: ms, delay, easing, fill: 'both' }),
      part.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: ms * 0.25,
        delay,
        easing: LINEAR_EASE_MAP['power1.out'] ?? 'linear',
        fill: 'both',
      }),
    ]
  })

  Promise.all(animations.map((a) => a.finished)).then(() => onComplete?.()).catch(() => {}) // @internal

  return () => animations.forEach((a) => a.cancel())
  // #endregion body
}
