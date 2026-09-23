import { Link } from 'react-router-dom'
import ThemeControl from './ThemeControl'
import { CURRENT_SECTION, GITHUB_URL, SECTIONS } from '../lib/links'
import type { ThemeMode } from '../lib/useTheme'

/**
 * Kept byte-identical to the copy in the sibling section. Everything that
 * differs between the two lives in links.ts, so this file can move into a
 * shared package unchanged if a third section ever justifies one.
 *
 * There is no platform home page on purpose: with two sections, a landing
 * page pointing at two destinations is a click nobody wants.
 */
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

        <nav className="topbar-sections" aria-label="Sections">
          {SECTIONS.map((section) =>
            section.id === CURRENT_SECTION ? (
              <Link key={section.id} to="/" className="topbar-section" aria-current="page">
                {section.name}
              </Link>
            ) : (
              <a key={section.id} href={section.url} className="topbar-section">
                {section.name}
              </a>
            ),
          )}
        </nav>

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
