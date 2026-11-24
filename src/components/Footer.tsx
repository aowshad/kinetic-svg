import { GITHUB_URL } from '../lib/links'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-meta">
        <span>MIT licence</span>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
      </div>
    </footer>
  )
}
