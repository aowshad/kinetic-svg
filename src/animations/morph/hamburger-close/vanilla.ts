import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const [top, mid, bottom] = [...svg.querySelectorAll('.bar')]
  const easing = LINEAR_EASE_MAP[o.ease] ?? 'linear'
  const ms = o.duration * 1000
  const delay = o.delay * 1000
  const opts = { easing, fill: 'both' as const }

  const animations = [
    mid.animate([{ opacity: 1 }, { opacity: 0 }], { ...opts, duration: ms * 0.4, delay }),
    top.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(17.5px)' }], {
      ...opts,
      duration: ms * 0.5,
      delay,
    }),
    bottom.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-17.5px)' }], {
      ...opts,
      duration: ms * 0.5,
      delay,
    }),
    top.animate([{ transform: 'translateY(17.5px)' }, { transform: 'translateY(17.5px) rotate(45deg)' }], {
      ...opts,
      duration: ms * 0.5,
      delay: delay + ms * 0.45,
    }),
    bottom.animate([{ transform: 'translateY(-17.5px)' }, { transform: 'translateY(-17.5px) rotate(-45deg)' }], {
      ...opts,
      duration: ms * 0.5,
      delay: delay + ms * 0.45,
    }),
  ]

  Promise.all(animations.map((a) => a.finished)).then(() => onComplete?.()).catch(() => {}) // @internal

  return () => animations.forEach((a) => a.cancel())
  // #endregion body
}
