import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  // The outer <svg> is a CSS box, so it takes a true 3D transform, and the
  // perspective travels with it rather than depending on a parent's style.
  const animation = svg.animate(
    [{ transform: 'perspective(600px) rotateY(-90deg)' }, { transform: 'perspective(600px) rotateY(0deg)' }],
    { duration: o.duration * 1000, delay: o.delay * 1000, easing: LINEAR_EASE_MAP[o.ease] ?? 'linear', fill: 'both' },
  )
  animation.finished.then(() => onComplete?.()).catch(() => {}) // @internal

  return () => animation.cancel()
  // #endregion body
}
