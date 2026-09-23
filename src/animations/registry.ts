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
