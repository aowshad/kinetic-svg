import { forwardRef } from 'react'
import type { Demo } from '../demos'

/**
 * Renders the demo artwork as the live stage.
 *
 * The markup is injected as a string rather than written as JSX because that
 * same string is what the snippet emits — one source for what runs and what
 * gets copied, so the two can't drift. It goes straight into the <svg> with
 * no wrapper element: a stray <g> would change what the animation's own
 * queries match and shift every transform-box origin, which is precisely the
 * drift this is meant to prevent. It is repo-authored content, never
 * anything a visitor supplies.
 */
const Stage = forwardRef<SVGSVGElement, { demo: Demo; className: string }>(({ demo, className }, ref) => {
  const a11y = demo.title ? ({ role: 'img' } as const) : ({ 'aria-hidden': true } as const)
  const inner = demo.title ? `<title>${demo.title}</title>\n${demo.markup}` : demo.markup
  return (
    <svg
      ref={ref}
      viewBox={demo.viewBox}
      className={`stage-svg ${className}`}
      {...a11y}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  )
})

Stage.displayName = 'Stage'

export default Stage
