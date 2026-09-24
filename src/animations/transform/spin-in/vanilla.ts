import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  // One group around the whole drawing, so it turns about its own centre as a
  // single piece. A <title> stays where it is: it names the <svg>, and moving
  // it into a group would take that name away.
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  group.append(...[...svg.children].filter((el) => el.tagName !== 'title'))
  svg.append(group)
  // Without fill-box the group would turn about the SVG's top-left corner.
  group.style.transformBox = 'fill-box'
  group.style.transformOrigin = 'center'
  const animation = group.animate([{ transform: 'rotate(-180deg) scale(0)' }, { transform: 'rotate(0deg) scale(1)' }], {
    duration: o.duration * 1000,
    delay: o.delay * 1000,
    easing: LINEAR_EASE_MAP[o.ease] ?? 'linear',
    fill: 'both',
  })
  animation.finished.then(() => onComplete?.()).catch(() => {}) // @internal

  return () => {
    animation.cancel()
    group.replaceWith(...group.childNodes)
  }
  // #endregion body
}
