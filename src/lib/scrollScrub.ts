/**
 * Ties an animation's progress directly to `subject`'s scroll position,
 * using the native View Timeline API where supported (Chrome/Edge 115+,
 * Firefox 136+) — the same compositor-driven, perfectly smooth scrubbing
 * GSAP's ScrollTrigger provides, with no JS in the per-frame loop at all.
 *
 * Falls back to an IntersectionObserver with fine-grained thresholds on
 * browsers without support (notably Safari before 26): progress only
 * updates when the intersection ratio crosses a threshold, not
 * continuously, so scrubbing is visibly coarser there — this is why every
 * scroll animation built on this helper is tier 'partial', not 'full'.
 *
 * `startVh`/`endVh` name the trigger points the same way GSAP's
 * ScrollTrigger does here: "subject's top edge is at this fraction of the
 * viewport height" (so `start: 'top 85%'` is `startVh = 0.85`). Internally
 * this is converted to the CSS `cover` named range's percentages, which —
 * unlike `entry` — spans roughly the full viewport height regardless of
 * the subject's own size, matching GSAP's actual scroll distance instead
 * of a window scaled to the subject's height (which, for a single line of
 * text, is only a few dozen pixels — far narrower than GSAP's default).
 *
 * `windowStart`/`windowEnd` (0–100) further slice that envelope, for
 * staggering multiple elements against the same overall trigger window —
 * scroll-driven timelines don't support a time-based `delay` at all
 * (browsers throw: "Effect duration 'auto' with time-based delays is not
 * yet implemented when used with Scroll Timelines"), so per-character
 * staggering happens by shifting *where in the scroll range* each
 * character's own window sits, not by ms.
 *
 * A `[data-scroll-demo]` ancestor means this is running inside the
 * gallery's own scoped demo box, not a real page — cards can't be scrubbed
 * against actual page scroll, so every measurement below (the "viewport"
 * height, and — for the IntersectionObserver fallback — the subject's
 * position) uses that box instead of the real one. Every other caller,
 * including a copy-pasted snippet on someone else's site, has no such
 * ancestor and gets the real page-scroll behavior this is actually for.
 */
export function scrollScrub(
  target: Element,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
  subject: HTMLElement,
  startVh: number,
  endVh: number,
  windowStart = 0,
  windowEnd = 100,
): () => void {
  const container = subject.closest('[data-scroll-demo]') as HTMLElement | null
  const vh = (container ? container.clientHeight : window.innerHeight) || document.documentElement.clientHeight
  const h = subject.getBoundingClientRect().height || 1
  // "cover" progress at the moment subject.top === vhFraction * vh, clamped
  // to the range's actual 0–100 bounds (a caller can pass an extreme endVh
  // like -10 to mean "all the way to cover 100%", i.e. fully exited).
  const coverAt = (vhFraction: number) => Math.min(100, Math.max(0, (((1 - vhFraction) * vh) / (vh + h)) * 100))
  const coverStart = coverAt(startVh)
  const coverEnd = coverAt(endVh)
  const span = coverEnd - coverStart
  const rangeStartPercent = coverStart + (windowStart / 100) * span
  const rangeEndPercent = coverStart + (windowEnd / 100) * span

  const ViewTimelineCtor = (window as { ViewTimeline?: new (o: { subject: Element; axis: string }) => AnimationTimeline })
    .ViewTimeline

  if (ViewTimelineCtor) {
    const timeline = new ViewTimelineCtor({ subject, axis: 'block' })
    const anim = target.animate(keyframes, {
      fill: 'both',
      ...options,
      timeline,
      rangeStart: `cover ${rangeStartPercent}%`,
      rangeEnd: `cover ${rangeEndPercent}%`,
    } as KeyframeAnimationOptions)
    return () => anim.cancel()
  }

  const anim = target.animate(keyframes, { ...options, duration: 1000, fill: 'both' })
  anim.pause()
  const update = (rect: DOMRectReadOnly) => {
    // boundingClientRect is always viewport-relative, regardless of root —
    // subtract the container's own top so "top" means "top of the demo box"
    // instead of "top of the browser window" when one is in play.
    const containerTop = container ? container.getBoundingClientRect().top : 0
    const relativeTop = rect.top - containerTop
    const rawPercent = ((vh - relativeTop) / (vh + rect.height)) * 100
    const windowed = (rawPercent - rangeStartPercent) / (rangeEndPercent - rangeStartPercent)
    anim.currentTime = Math.min(1, Math.max(0, windowed)) * 1000
  }
  const observer = new IntersectionObserver(([entry]) => update(entry.boundingClientRect), {
    root: container,
    threshold: Array.from({ length: 41 }, (_, i) => i / 40),
  })
  observer.observe(subject)
  return () => {
    observer.disconnect()
    anim.cancel()
  }
}
