/**
 * Every cross-section URL in one place, so moving to a custom domain is one
 * edit rather than a find-and-replace across components and meta tags.
 *
 * The two sections are deliberately separate codebases. Nothing here is
 * shared at build time — this file is duplicated in kinetic (text) with its own
 * CURRENT_SECTION and GITHUB_URL, and TopBar/Footer are byte-identical in
 * both so they lift cleanly into a shared package if a third section ever
 * makes that worth doing.
 */
export interface Section {
  id: string
  /** Shown in the top bar. */
  name: string
  url: string
  /**
   * Hardcoded, and only ever shown for the *other* section in the footer.
   * Fetching a count across sites would couple two deployments that have no
   * reason to know about each other. Bump it by hand when that section grows.
   */
  count: number
}

export const SECTIONS: Section[] = [
  { id: 'text', name: 'Text', url: 'https://aowshad.github.io/kinetic/', count: 45 },
  { id: 'svg', name: 'SVG', url: 'https://aowshad.github.io/kinetic-svg/', count: 16 },
]

export const CURRENT_SECTION = 'svg'

export const GITHUB_URL = 'https://github.com/aowshad/kinetic-svg'

export const otherSection = (): Section => SECTIONS.find((s) => s.id !== CURRENT_SECTION) ?? SECTIONS[0]
