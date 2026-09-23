import { DEMOS } from '../demos'

/**
 * Sits where the text library's sample-text field sat, and does the same job:
 * one page-wide choice of demo content that every animation re-renders
 * against, and that the emitted markup is serialised from.
 */
export default function DemoPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="demo-picker">
      <span className="demo-picker-label">Demo shape</span>
      <div className="demo-picker-row" role="group" aria-label="Demo shape">
        {DEMOS.map((demo) => (
          <button
            key={demo.id}
            type="button"
            aria-pressed={value === demo.id}
            title={demo.name}
            onClick={() => onChange(demo.id)}
            className="demo-chip"
          >
            <svg viewBox={demo.viewBox} aria-hidden="true" dangerouslySetInnerHTML={{ __html: demo.markup }} />
            <span>{demo.name}</span>
          </button>
        ))}
      </div>
      <p className="demo-picker-hint">Every animation on the page redraws with the shape you pick.</p>
    </div>
  )
}
