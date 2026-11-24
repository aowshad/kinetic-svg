import { Link } from 'react-router-dom'
import ThemeControl from './ThemeControl'
import { GITHUB_URL } from '../lib/links'
import type { ThemeMode } from '../lib/useTheme'

export default function TopBar({
  theme,
  onThemeChange,
}: {
  theme: ThemeMode
  onThemeChange: (m: ThemeMode) => void
}) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="topbar-mark">
          KINETIC
        </Link>

        <div className="topbar-right">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="topbar-github">
            GitHub ↗
          </a>
          <ThemeControl mode={theme} onChange={onThemeChange} />
        </div>
      </div>
    </header>
  )
}
