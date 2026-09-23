import { DEMOS } from '../demos'

/**
 * Sits where the text library's sample-text field sat, and does the same job:
 * one page-wide choice of demo content that every animation re-renders
 * against, and that the emitted markup is serialised from.
 *
 * `supported` is the set of shapes anything on this page can actually use —
 * the module's own list on a detail page, the union across the visible cards
 * in the gallery. The rest are disabled rather than hidden, so the range on
 * offer stays visible and nothing renders a preview that was never going to
 * work. A stroke-drawing animation given a solid blob is the case this
 * exists for: it has no stroke to draw, so it would sit there doing nothing.
 */
export default function DemoPicker({
  value,
  onChange,
  supported,
}: {
  value: string
  onChange: (id: string) => void
  supported: string[]
}) {
  return (
    <div className="demo-picker">
      <span className="demo-picker-label">Demo shape</span>
      <div className="demo-picker-row" role="group" aria-label="Demo shape">
        {DEMOS.map((demo) => {
          const allowed = supported.includes(demo.id)
          return (
            <button
              key={demo.id}
              type="button"
              disabled={!allowed}
              aria-pressed={value === demo.id}
              title={allowed ? demo.name : `${demo.name} — not supported here`}
              onClick={() => onChange(demo.id)}
              className="demo-chip"
            >
              <svg viewBox={demo.viewBox} aria-hidden="true" dangerouslySetInnerHTML={{ __html: demo.markup }} />
              <span>{demo.name}</span>
            </button>
          )
        })}
      </div>
      <p className="demo-picker-hint">Every animation on the page redraws with the shape you pick.</p>
    </div>
  )
}
