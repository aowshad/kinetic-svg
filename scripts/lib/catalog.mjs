import { existsSync } from 'node:fs'
import { readFile, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Per text role, because the default sample text has no digits — a counter
 * animation given "I Love Bangladesh" correctly does nothing at all.
 */
export const SAMPLE_TEXT = {
  heading: 'Kinetic',
  paragraph: 'Text that moves with intent.',
  button: 'Get started',
  link: 'Read more',
  label: 'NEW',
  counter: '1,260',
}

export const sampleFor = (role) => SAMPLE_TEXT[role] ?? SAMPLE_TEXT.heading

/** Reads id/name/category/role/defaults straight out of each meta.ts. */
export async function readCatalog(animationsDir) {
  const entries = []
  for (const category of await readdir(animationsDir)) {
    const categoryDir = join(animationsDir, category)
    if (!(await stat(categoryDir)).isDirectory()) continue
    for (const id of await readdir(categoryDir)) {
      const metaPath = join(categoryDir, id, 'meta.ts')
      if (!existsSync(metaPath)) continue
      const src = await readFile(metaPath, 'utf8')
      const pick = (key) => src.match(new RegExp(`\\b${key}:\\s*'([^']*)'`))?.[1]
      const num = (key) => Number(src.match(new RegExp(`\\b${key}:\\s*([\\d.]+)`))?.[1] ?? 0)
      entries.push({
        id: pick('id') ?? id,
        name: pick('name') ?? id,
        category: pick('category') ?? category,
        trigger: pick('trigger') ?? 'play',
        vanilla: pick('vanilla') ?? 'full',
        role: src.match(/roles:\s*\['([^']*)'/)?.[1] ?? 'heading',
        duration: num('duration'),
        stagger: num('stagger'),
        delay: num('delay'),
      })
    }
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name))
}
