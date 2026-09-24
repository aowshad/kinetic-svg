import type { AnimationModule, CatalogEntry } from '../lib/types'

const modules = import.meta.glob<{ default: AnimationModule }>('./**/meta.ts', { eager: true })
const gsapSources = import.meta.glob<string>('./**/gsap.ts', {
  eager: true,
  query: '?raw',
  import: 'default',
})
const vanillaSources = import.meta.glob<string>('./**/vanilla.ts', {
  eager: true,
  query: '?raw',
  import: 'default',
})
const styles = import.meta.glob<string>('./**/style.css', {
  eager: true,
  query: '?raw',
  import: 'default',
})

// The same stylesheets again, this time applied to the page. The ?raw copy
// above only feeds the emitter, so without this the live preview ran without
// the CSS its own snippet ships with — hamburger-close lost transform-box:
// fill-box and rotated its bars around the SVG's top-left corner, while the
// pasted snippet, which does carry the CSS, rendered correctly. Selectors are
// all scoped to a .k-<id> class, so loading every one globally is safe.
import.meta.glob('./**/style.css', { eager: true })

const catalog: CatalogEntry[] = Object.entries(modules)
  .map(([path, mod]) => {
    const dir = path.replace(/\/meta\.ts$/, '')
    return {
      module: mod.default,
      source: gsapSources[`${dir}/gsap.ts`],
      vanillaSource: mod.default.vanilla !== 'none' ? vanillaSources[`${dir}/vanilla.ts`] : undefined,
      css: styles[`${dir}/style.css`],
      path,
    }
  })
  .sort((a, b) => a.module.name.localeCompare(b.module.name))

export default catalog
