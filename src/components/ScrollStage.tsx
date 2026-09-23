import { forwardRef, useState } from 'react'

/**
 * Shared stage shell for scroll-category animations: an internal scroll
 * container (matched by scrollScrub/ScrollTrigger via `[data-scroll-demo]`)
 * so the motion scrubs against a small box instead of the real page, which
 * doesn't reliably pass through a fixed-height card or scroll far enough on
 * the detail page either. Used by both the gallery card and the detail page
 * so the two stay in sync.
 */
const ScrollStage = forwardRef<
  HTMLDivElement,
  {
    className?: string
    hint?: string
    onTrackScroll?: (el: HTMLDivElement) => void
    children: React.ReactNode
  }
>(({ className, hint = 'Scroll inside this box', onTrackScroll, children }, ref) => {
  const [scrolled, setScrolled] = useState(false)

  return (
    <div className={className ? `stage stage-scroll ${className}` : 'stage stage-scroll'}>
      <div
        className="scroll-demo-track"
        data-scroll-demo
        ref={ref}
        onScroll={(e) => {
          if (!scrolled) setScrolled(true)
          onTrackScroll?.(e.currentTarget)
        }}
      >
        <div className="scroll-demo-pad" aria-hidden="true" />
        {children}
        <div className="scroll-demo-pad" aria-hidden="true" />
      </div>
      <span className="stage-hint stage-hint-scroll" data-faded={scrolled}>
        {hint}
      </span>
    </div>
  )
})

ScrollStage.displayName = 'ScrollStage'

export default ScrollStage
