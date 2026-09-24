import { gsap } from '../../../lib/gsap'
import { capPad, paths, strokeLength } from '../../../lib/paths'
import type { AnimationImpl } from '../../../lib/types'

export const run: AnimationImpl = (svg, o, onComplete) => {
  // #region body
  const shapes = paths(svg).filter((s) => s.getAttribute('stroke'))
  // The dash runs on a copy laid over each stroke, so the drawing itself can
  // dim underneath it rather than disappear.
  const traces = shapes.map((shape) => {
    const trace = shape.cloneNode(true) as SVGGeometryElement // @emit: const trace = shape.cloneNode(true)
    shape.after(trace)
    return trace
  })
  const tl = gsap.timeline({ delay: o.delay, onComplete }) // @emit: const tl = gsap.timeline({ delay: o.delay })

  tl.to(shapes, { opacity: 0.25, duration: o.duration * 0.12, ease: 'none' }, 0)
  traces.forEach((trace, i) => {
    const length = strokeLength(trace)
    const pad = capPad(trace)
    const dash = length * 0.14
    gsap.set(trace, { strokeDasharray: `${dash} ${length + 2 * pad}`, strokeDashoffset: dash + pad })
    tl.to(trace, { strokeDashoffset: -(length + pad), duration: o.duration * 0.85, ease: o.ease }, i * o.stagger)
  })
  tl.to(shapes, { opacity: 1, duration: o.duration * 0.15, ease: 'none' }, '>')
  tl.call(() => traces.forEach((trace) => trace.remove()))

  return () => {
    tl.progress(1).kill() // @emit: tl.kill()
    traces.forEach((trace) => trace.remove())
    gsap.set(shapes, { clearProps: 'opacity' })
  }
  // #endregion body
}
