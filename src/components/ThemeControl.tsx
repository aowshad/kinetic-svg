import { Monitor, Moon, Sun } from 'lucide-react'
import type { ThemeMode } from '../lib/useTheme'

const OPTIONS: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: 'system', label: 'System', Icon: Monitor },
  { mode: 'light', label: 'Light', Icon: Sun },
  { mode: 'dark', label: 'Dark', Icon: Moon },
]

export default function ThemeControl({
  mode,
  onChange,
}: {
  mode: ThemeMode
  onChange: (m: ThemeMode) => void
}) {
  return (
    <div className="theme-control" role="radiogroup" aria-label="Theme">
      {OPTIONS.map(({ mode: m, label, Icon }) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          aria-pressed={mode === m}
          aria-label={label}
          title={label}
          onClick={() => onChange(m)}
          className="theme-control-btn"
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}
