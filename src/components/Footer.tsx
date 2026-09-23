import { GITHUB_URL, otherSection } from '../lib/links'

/** Byte-identical to the copy in the sibling section; see TopBar. */
export default function Footer() {
  const other = otherSection()
  return (
    <footer className="site-footer">
      <a href={other.url} className="site-footer-other">
        Kinetic {other.name}
        <span>{other.count} animations</span>
      </a>
      <div className="site-footer-meta">
        <span>MIT licence</span>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
      </div>
    </footer>
  )
}
