import { gsap } from '../../../lib/gsap'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const NS = 'http://www.w3.org/2000/svg'
  const box = svg.viewBox.baseVal
  const id = `wipe-${Math.random().toString(36).slice(2, 9)}`

  // The clip lives in the JS, not the markup, so the artwork block stays
  // plain art that any other animation here can also be pointed at.
  const defs = document.createElementNS(NS, 'defs')
  const clip = document.createElementNS(NS, 'clipPath')
  clip.setAttribute('id', id)
  const rect = document.createElementNS(NS, 'rect')
  rect.setAttribute('x', String(box.x)) // @emit: rect.setAttribute('x', box.x)
  rect.setAttribute('y', String(box.y)) // @emit: rect.setAttribute('y', box.y)
  rect.setAttribute('height', String(box.height)) // @emit: rect.setAttribute('height', box.height)
  rect.setAttribute('width', '0')
  clip.appendChild(rect)
  defs.appendChild(clip)

  const art = [...svg.children]
  art.forEach((el) => el.setAttribute('clip-path', `url(#${id})`))
  svg.appendChild(defs)

  const tl = gsap.timeline({ delay: o.delay, onComplete }) // @emit: const tl = gsap.timeline({ delay: o.delay })
  tl.to(rect, { attr: { width: box.width }, duration: o.duration, ease: o.ease })

  return () => {
    tl.progress(1).kill() // @emit: tl.kill()
    art.forEach((el) => el.removeAttribute('clip-path'))
    defs.remove()
  }
  // #endregion body
}
