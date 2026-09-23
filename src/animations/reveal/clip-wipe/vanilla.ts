import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const NS = 'http://www.w3.org/2000/svg'
  const box = svg.viewBox.baseVal
  const id = `wipe-${Math.random().toString(36).slice(2, 9)}`

  const defs = document.createElementNS(NS, 'defs')
  const clip = document.createElementNS(NS, 'clipPath')
  clip.setAttribute('id', id)
  const rect = document.createElementNS(NS, 'rect')
  rect.setAttribute('x', String(box.x)) // @emit: rect.setAttribute('x', box.x)
  rect.setAttribute('y', String(box.y)) // @emit: rect.setAttribute('y', box.y)
  rect.setAttribute('width', String(box.width)) // @emit: rect.setAttribute('width', box.width)
  rect.setAttribute('height', String(box.height)) // @emit: rect.setAttribute('height', box.height)
  // Scaled rather than resized: x/y/width/height only became animatable CSS
  // properties in Safari 16.4, while a transform on a clip path's contents
  // has always worked, and the wipe is indistinguishable either way.
  rect.style.transformOrigin = 'left'
  clip.appendChild(rect)
  defs.appendChild(clip)

  const art = [...svg.children]
  art.forEach((el) => el.setAttribute('clip-path', `url(#${id})`))
  svg.appendChild(defs)

  const animation = rect.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
    duration: o.duration * 1000,
    delay: o.delay * 1000,
    easing: LINEAR_EASE_MAP[o.ease] ?? 'linear',
    fill: 'both',
  })

  animation.finished.then(() => onComplete?.()).catch(() => {}) // @internal

  return () => {
    animation.cancel()
    art.forEach((el) => el.removeAttribute('clip-path'))
    defs.remove()
  }
  // #endregion body
}
