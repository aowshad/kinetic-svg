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
  /** True when the art is a single continuous stroke, which draw animations want. */
  stroked?: boolean
}

const STROKE = 'fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"'

const mark: Demo = {
  id: 'mark',
  name: 'Mark',
  viewBox: '0 0 120 120',
  stroked: true,
  markup: `  <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" stroke-width="8" />
  <line x1="60" y1="12" x2="60" y2="38" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
  <line x1="60" y1="82" x2="60" y2="108" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
  <circle cx="60" cy="60" r="10" fill="currentColor" />`,
}

const wave: Demo = {
  id: 'wave',
  name: 'Wave',
  viewBox: '0 0 120 120',
  stroked: true,
  markup: `  <path d="M10 60 Q 27.5 22, 45 60 T 80 60 T 114 60" ${STROKE} />`,
}

const signature: Demo = {
  id: 'signature',
  name: 'Signature',
  viewBox: '0 0 120 120',
  stroked: true,
  markup: `  <path d="M14 80 C 26 46, 36 38, 42 54 C 48 70, 39 88, 46 92 C 54 96, 66 66, 74 50
           C 80 38, 90 42, 87 56 C 84 70, 73 76, 84 79 C 93 81, 101 71, 110 56"
        fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />`,
}

const chart: Demo = {
  id: 'chart',
  name: 'Chart',
  viewBox: '0 0 120 120',
  title: 'Line chart rising from left to right across eight points',
  stroked: true,
  markup: `  <polyline points="12,92 26,74 40,80 54,54 68,62 82,36 96,44 110,18"
            fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />`,
}

const blob: Demo = {
  id: 'blob',
  name: 'Blob',
  viewBox: '0 0 120 120',
  markup: `  <path d="M60 14 C 84 14, 105 30, 106 54 C 107 78, 91 102, 66 106
           C 41 110, 18 94, 14 70 C 10 46, 36 14, 60 14 Z" fill="currentColor" />`,
}

const check: Demo = {
  id: 'check',
  name: 'Check',
  viewBox: '0 0 120 120',
  stroked: true,
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

const play: Demo = {
  id: 'play',
  name: 'Play',
  viewBox: '0 0 120 120',
  markup: `  <path d="M44 32 L90 60 L44 88 Z" fill="currentColor" stroke="currentColor" stroke-width="10"
        stroke-linejoin="round" />`,
}

export const DEMOS: Demo[] = [mark, wave, signature, chart, blob, check, menu, play]

export const demoById = (id: string): Demo => DEMOS.find((d) => d.id === id) ?? DEMOS[0]

/** Every demo made of strokes — what a draw animation can actually draw. */
export const STROKED_DEMOS = DEMOS.filter((d) => d.stroked).map((d) => d.id)

/** The <svg> wrapper every stage and every emitted snippet shares. */
export function demoSvg(demo: Demo, className: string): string {
  const a11y = demo.title ? `role="img"` : `aria-hidden="true"`
  const title = demo.title ? `\n  <title>${demo.title}</title>` : ''
  return `<svg viewBox="${demo.viewBox}" class="${className}" ${a11y}>${title}\n${demo.markup}\n</svg>`
}
