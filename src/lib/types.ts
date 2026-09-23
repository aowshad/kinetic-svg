export type Category = 'draw' | 'transform' | 'reveal' | 'morph' | 'data' | 'scroll-hover'

/**
 * How the animation is fired, kept separate from `category` on purpose.
 *
 * In the text library the two were the same field, because there the browse
 * group and the trigger happened to coincide. Here they don't: `dash-march`
 * is a Draw animation that loops forever, `orbit` and `pulse-ring` are
 * Transform animations that loop, and the Scroll & hover group holds both
 * scroll-scrubbed and pointer-driven animations. Folding trigger back into
 * category would mislabel all of those.
 */
export type Trigger = 'play' | 'loop' | 'hover' | 'scroll'

/**
 * 'full' — behaves the same with or without GSAP.
 * 'partial' — runs without GSAP but loses something; see vanillaNote.
 * 'none' — no zero-dependency equivalent exists yet.
 */
export type VanillaTier = 'full' | 'partial' | 'none'

export interface AnimationOptions {
  duration: number
  stagger: number
  delay: number
  ease: string
}

/**
 * Takes the <svg> element itself rather than a wrapper, because every
 * technique here reaches for its children — paths to measure, groups to
 * transform, a <defs> to write a clipPath into.
 */
export type AnimationImpl = (svg: SVGSVGElement, o: AnimationOptions, onComplete?: () => void) => () => void

/**
 * How this animation behaves when the visitor prefers reduced motion.
 * 'settle' — plays once, near-instantly, landing on its real authored end
 *            state (a draw animation finishes fully drawn, a reveal finishes
 *            revealed). The default for anything with a duration.
 * 'skip'   — never runs at all: it repeats forever, so a near-zero duration
 *            would strobe rather than stop it, or it's scroll-position-driven
 *            and so has no duration to shrink in the first place.
 */
export type ReducedMotion = 'settle' | 'skip'

export interface AnimationModule {
  id: string
  name: string
  category: Category
  trigger: Trigger
  /** Demo ids this animation can render; demos[0] is its default. */
  demos: string[]
  tags: string[]
  blurb: string
  defaults: AnimationOptions
  plugins: string[]
  vanilla: VanillaTier
  vanillaNote?: string
  reducedMotion: ReducedMotion
  impl: {
    gsap: AnimationImpl
    vanilla?: AnimationImpl
  }
}

export interface CatalogEntry {
  module: AnimationModule
  source: string
  vanillaSource?: string
  css?: string
  path: string
}
