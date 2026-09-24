import { LINEAR_EASE_MAP } from '../../../lib/linearEases'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const bars = [...svg.querySelectorAll<SVGElement>('.bar')] // @emit: const bars = [...svg.querySelectorAll('.bar')]
  const [top, mid, bottom] = bars
  // Without fill-box, an SVG transform origin resolves against the whole
  // canvas, so each bar would rotate around the SVG's top-left corner.
  bars.forEach((bar) => {
    bar.style.transformBox = 'fill-box'
    bar.style.transformOrigin = 'center'
  })
  const easing = LINEAR_EASE_MAP[o.ease] ?? 'linear'
  const timing = { duration: o.duration * 1000, delay: o.delay * 1000, fill: 'both' as const }

  // One animation per bar, eased per phase: the outer bars converge on the
  // centre, then cross while the middle one fades. Two animations stacked on
  // the same transform would overwrite each other instead of taking turns.
  const cross = (y: number, deg: number) => [ // @emit: const cross = (y, deg) => [
    { transform: 'translateY(0px) rotate(0deg)', easing },
    { transform: `translateY(${y}px) rotate(0deg)`, offset: 0.5, easing },
    { transform: `translateY(${y}px) rotate(${deg}deg)` },
  ]

  const animations = [
    top.animate(cross(17.5, 45), timing),
    bottom.animate(cross(-17.5, -45), timing),
    mid.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5, easing }, { opacity: 0 }], timing),
  ]

  Promise.all(animations.map((a) => a.finished)).then(() => onComplete?.()).catch(() => {}) // @internal

  return () => {
    animations.forEach((a) => a.cancel())
    bars.forEach((bar) => {
      bar.style.transformBox = ''
      bar.style.transformOrigin = ''
    })
  }
  // #endregion body
}
