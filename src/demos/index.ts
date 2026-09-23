/**
 * Demo artwork, stored as inline SVG source rather than files, because the
 * markup is part of what gets copied — an animation snippet that points at
 * an asset the reader doesn't have is no more useful than one that points at
 * an element they don't have.
 *
 * Everything here is drawn from scratch. No company's logo, icon set or
 * loader is reproduced or approximated, deliberately: a morph demo is exactly
 * where that temptation shows up, and a trademark in a copy-paste gallery is
 * a problem inherited by everyone who pastes it.
 *
 * `stroke` and `fill` are always `currentColor` so one drawing serves both
 * themes, and stroked art carries `vector-effect: non-scaling-stroke` (see
 * each animation's style.css) so weight doesn't change with card width.
 */
export interface Demo {
  id: string
  name: string
  viewBox: string
  /** Inner SVG, indented two spaces, as it should appear when copied. */
  markup: string
  /**
   * Decorative by default — `aria-hidden` on the <svg>. Art that carries
   * meaning sets this and gets role="img" plus a <title> instead.
   */
  title?: string
}

const check: Demo = {
  id: 'check',
  name: 'Check',
  viewBox: '0 0 120 120',
  markup: `  <path d="M24 62 L50 88 L96 34" fill="none" stroke="currentColor" stroke-width="10"
        stroke-linecap="round" stroke-linejoin="round" />`,
}

const menu: Demo = {
  id: 'menu',
  name: 'Menu',
  viewBox: '0 0 120 120',
  markup: `  <rect class="bar bar-top" x="26" y="38" width="68" height="9" rx="4.5" fill="currentColor" />
  <rect class="bar bar-mid" x="26" y="55.5" width="68" height="9" rx="4.5" fill="currentColor" />
  <rect class="bar bar-bottom" x="26" y="73" width="68" height="9" rx="4.5" fill="currentColor" />`,
}

const mark: Demo = {
  id: 'mark',
  name: 'Mark',
  viewBox: '0 0 120 120',
  markup: `  <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" stroke-width="8" />
  <line x1="60" y1="12" x2="60" y2="38" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
  <line x1="60" y1="82" x2="60" y2="108" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
  <circle cx="60" cy="60" r="10" fill="currentColor" />`,
}

export const DEMOS: Demo[] = [check, menu, mark]

export const demoById = (id: string): Demo => DEMOS.find((d) => d.id === id) ?? DEMOS[0]

/** The <svg> wrapper every stage and every emitted snippet shares. */
export function demoSvg(demo: Demo, className: string): string {
  const a11y = demo.title
    ? `role="img"`
    : `aria-hidden="true"`
  const title = demo.title ? `\n  <title>${demo.title}</title>` : ''
  return `<svg viewBox="${demo.viewBox}" class="${className}" ${a11y}>${title}\n${demo.markup}\n</svg>`
}
