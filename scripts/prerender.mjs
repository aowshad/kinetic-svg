#!/usr/bin/env node
/**
 * Writes a real static HTML file for every route, so `/a/<id>/` is a document
 * the server can hand a crawler directly — no 404.html redirect hack, no
 * empty <div id="root"> waiting on JavaScript.
 *
 * The app leans on the DOM everywhere (GSAP, matchMedia, sessionStorage,
 * Intl.Segmenter, ResizeObserver, fitText measuring real boxes), so rather
 * than fight that in a Node SSR pass, this renders each route in a real
 * browser against the built bundle and serialises the result.
 *
 * Run after `vite build` — `npm run build` does both.
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { preview } from 'vite'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const distDir = join(root, 'dist')
const animationsDir = join(root, 'src/animations')

async function routeIds() {
  const ids = []
  for (const category of await readdir(animationsDir, { withFileTypes: true })) {
    if (!category.isDirectory()) continue
    for (const dir of await readdir(join(animationsDir, category.name))) {
      const metaPath = join(animationsDir, category.name, dir, 'meta.ts')
      if (!existsSync(metaPath)) continue
      ids.push((await readFile(metaPath, 'utf8')).match(/\bid:\s*'([^']*)'/)?.[1] ?? dir)
    }
  }
  return ids.sort()
}

/**
 * Freezes the page into something worth serving: the stage is a live demo
 * whose DOM at any given instant is split spans carrying mid-flight inline
 * styles (a half-faded character is `opacity: 0`), which is neither readable
 * or meaningful to a crawler. It gets reset to its plain text. The theme
 * attribute goes too — the inline script in <head> sets it per visitor, and
 * baking one in would flash the wrong theme at anyone who prefers the other.
 */
async function freeze(page) {
  return page.evaluate(() => {
    // The rendered text is whatever the animation is doing this millisecond —
    // scrambled letters, a half-typed line, characters hoisted out into spans
    // — so the sample text is taken from the store that drives it instead.
    let sample = ''
    try {
      sample = sessionStorage.getItem('kinetic-sample-text') ?? ''
    } catch {
      /* ignore */
    }
    for (const stage of document.querySelectorAll('.stage')) {
      const text = stage.querySelector('.stage-heading, .stage-paragraph, .stage-button, .stage-link, .stage-counter')
      if (!text) continue
      text.removeAttribute('style')
      text.removeAttribute('aria-label')
      text.textContent = sample || text.getAttribute('aria-label') || text.textContent || ''
    }
    document.documentElement.removeAttribute('data-theme')
    return `<!doctype html>\n${document.documentElement.outerHTML}`
  })
}

async function main() {
  if (!existsSync(join(distDir, 'index.html'))) {
    throw new Error('dist/index.html is missing — run `vite build` first.')
  }

  const ids = await routeIds()
  const routes = ['', ...ids.map((id) => `a/${id}/`)]

  const server = await preview({ root, preview: { port: 0 } })
  const base = server.resolvedUrls.local[0]
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  const failures = []
  page.on('pageerror', (err) => failures.push(err.message))

  console.log(`Pre-rendering ${routes.length} routes…`)
  for (const route of routes) {
    failures.length = 0
    await page.goto(`${base}${route}`, { waitUntil: 'networkidle' })
    // The detail route renders its heading only once the catalog resolves.
    await page.waitForSelector(route === '' ? '.k-card' : '.detail-title')
    await page.evaluate(() => document.fonts.ready.then(() => true))

    const html = await freeze(page)
    const outDir = route === '' ? distDir : join(distDir, route)
    await mkdir(outDir, { recursive: true })
    await writeFile(join(outDir, 'index.html'), html)

    if (failures.length) throw new Error(`Page errors on /${route}: ${failures.join('; ')}`)
    process.stdout.write('.')
  }

  await browser.close()
  await server.close()
  console.log(`\nWrote ${routes.length} static HTML files to dist/`)
}

main().catch((err) => {
  console.error(`\n${err.message}`)
  process.exit(1)
})
