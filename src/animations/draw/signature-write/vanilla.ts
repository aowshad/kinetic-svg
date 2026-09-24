import { capPad, paths, strokeLength } from '../../../lib/paths'
import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const [stroke] = paths(svg).filter((s) => s.getAttribute('stroke'))
  if (!stroke) {
    onComplete?.() // @internal
    return () => {}
  }
  const length = strokeLength(stroke)
  const pad = capPad(stroke)
  const hidden = length + pad
  stroke.style.strokeDasharray = `${length} ${hidden + pad}`
  const animation = stroke.animate([{ strokeDashoffset: hidden }, { strokeDashoffset: 0 }], {
    duration: o.duration * 1000,
    delay: o.delay * 1000,
    easing: LINEAR_EASE_MAP[o.ease] ?? 'linear',
    fill: 'both',
  })
  // Once written, drop the dash so a later resize can't reopen a gap.
  animation.finished.then(() => (stroke.style.strokeDasharray = 'none')).catch(() => {})
  animation.finished.then(() => onComplete?.()).catch(() => {}) // @internal

  return () => {
    animation.cancel()
    stroke.style.strokeDasharray = ''
  }
  // #endregion body
}
