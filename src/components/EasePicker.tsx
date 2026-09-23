import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { EASE_DIAGONAL, easeCurvePath } from '../lib/easeCurve'
import { EASE_GROUPS as GROUPS, ALL_EASES } from '../lib/eases'

const SHOW_FILTER = ALL_EASES.length > 12

function Curve({ name, selected }: { name: string; selected?: boolean }) {
  return (
    <svg viewBox="-0.15 -0.35 1.3 1.7" width="40" height="28" preserveAspectRatio="none" aria-hidden="true">
      <path d={EASE_DIAGONAL} fill="none" stroke="currentColor" strokeWidth="0.03" opacity="0.12" />
      <path
        d={easeCurvePath(name)}
        fill="none"
        stroke="currentColor"
        strokeWidth={selected ? 0.07 : 0.06}
        className={selected ? 'ease-curve-selected' : undefined}
      />
    </svg>
  )
}

export default function EasePicker({
  value,
  onChange,
  onPreview,
}: {
  value: string
  onChange: (v: string) => void
  onPreview: (v: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeEase, setActiveEase] = useState(value)
  const rootRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLInputElement>(null)

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return GROUPS.map((g) => ({ ...g, eases: g.eases.filter((e) => e.includes(q)) })).filter(
      (g) => g.eases.length > 0,
    )
  }, [query])
  const visibleFlat = useMemo(() => visibleGroups.flatMap((g) => g.eases), [visibleGroups])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActiveEase(value)
    filterRef.current?.focus()
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const commit = (ease: string) => {
    onChange(ease)
    onPreview(null)
    setOpen(false)
  }

  const move = (delta: number) => {
    const list = visibleFlat.length ? visibleFlat : ALL_EASES
    const i = list.indexOf(activeEase)
    const next = list[Math.min(list.length - 1, Math.max(0, (i === -1 ? 0 : i) + delta))]
    setActiveEase(next)
    onPreview(next)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const list = visibleFlat.length ? visibleFlat : ALL_EASES
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      move(1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      move(-1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActiveEase(list[0])
      onPreview(list[0])
    } else if (e.key === 'End') {
      e.preventDefault()
      setActiveEase(list[list.length - 1])
      onPreview(list[list.length - 1])
    } else if (e.key === 'Enter') {
      e.preventDefault()
      commit(activeEase)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onPreview(null)
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="ease-picker">
      <button
        type="button"
        className="ease-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Curve name={value} />
        {value === 'none' ? (
          <span>
            none <span className="ease-linear-note">linear</span>
          </span>
        ) : (
          <span>{value}</span>
        )}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="ease-popover">
          {SHOW_FILTER && (
            <input
              ref={filterRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Filter eases"
              className="ease-filter"
              aria-label="Filter eases"
            />
          )}
          <div role="listbox" aria-activedescendant={`ease-opt-${activeEase}`} className="ease-list" onMouseLeave={() => onPreview(null)}>
            {visibleGroups.map((group) => (
              <div key={group.label} className="ease-group">
                <span className="ease-group-label">{group.label}</span>
                {group.eases.map((ease) => (
                  <div
                    key={ease}
                    id={`ease-opt-${ease}`}
                    role="option"
                    aria-selected={value === ease}
                    className={ease === activeEase ? 'ease-option active' : 'ease-option'}
                    onMouseEnter={() => {
                      setActiveEase(ease)
                      onPreview(ease)
                    }}
                    onClick={() => commit(ease)}
                  >
                    <Curve name={ease} selected={value === ease} />
                    {ease === 'none' ? (
                      <span>
                        none <span className="ease-linear-note">linear</span>
                      </span>
                    ) : (
                      <span>{ease}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
            {visibleFlat.length === 0 && <p className="ease-no-match">No eases match “{query}”.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
