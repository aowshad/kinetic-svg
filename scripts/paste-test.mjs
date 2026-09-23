#!/usr/bin/env node
/**
 * The test this whole library stands or falls on: take what the Copy button
 * actually produces, paste it into a blank HTML file with no build step and
 * no packages, and check that it runs.
 *
 * It reads the snippet out of the running site rather than calling the
 * emitter directly, so what's tested is what a visitor gets, not what the
 * emitter thinks it emitted.
 *
 * Usage:
 *   node scripts/paste-test.mjs                 # every animation, JS tab
 *   node scripts/paste-test.mjs --tab jsGsap    # the GSAP tab instead
 *   node scripts/paste-test.mjs --only line-draw
 *   node scripts/paste-test.mjs --keep          # leave the pasted files behind
 */
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { readCatalog } from './lib/catalog.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const animationsDir = join(root, 'src/animations')
const outDir = join(root, '.capture/paste')

const args = process.argv.slice(2)
const only = args.reduce((acc, a, i) => (a === '--only' && args[i + 1] ? [...acc, args[i + 1]] : acc), [])
const tabLabel = args[args.indexOf('--tab') + 1] === 'jsGsap' ? 'JS + GSAP' : 'JS'
const keep = args.includes('--keep')

/** Splits the emitted snippet back into the three blocks it advertises. */
function splitBlocks(code) {
  const markup = code.match(/<!-- 1\. Markup -->\n([\s\S]*?)(?=\n\n\/\* \d\. CSS \*\/|\n\n\/\/ \d\. JS)/)
  const css = code.match(/\/\* \d\. CSS \*\/\n([\s\S]*?)(?=\n\n\/\/ \d\. JS)/)
  const js = code.match(/\/\/ \d\. JS\n([\s\S]*)$/)
  if (!markup || !js) throw new Error('snippet did not contain the advertised blocks')
  return { markup: markup[1].trim(), css: css ? css[1].trim() : '', js: js[1].trim() }
}

/** A blank HTML file. Nothing here but the three pasted blocks. */
function pasteInto({ markup, css, js }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>paste test</title>
    <style>
      body { background: #111; color: #eee; display: grid; place-items: center; min-height: 100vh; margin: 0; }
      svg { width: 240px; height: auto; }
${css ? `\n${css}\n` : ''}    </style>
  </head>
  <body>
${markup}
    <script>
${js}
    </script>
  </body>
</html>
`
}

async function main() {
  const catalog = (await readCatalog(animationsDir)).filter((e) => only.length === 0 || only.includes(e.id))
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  const server = await createServer({ root, logLevel: 'warn' })
  await server.listen()
  const base = server.resolvedUrls.local[0]
  const browser = await chromium.launch()

  const results = []

  for (const entry of catalog) {
    // 1. Read the snippet the Copy button would hand over.
    const reader = await browser.newContext({ reducedMotion: 'no-preference' })
    const page = await reader.newPage()
    await page.goto(`${base}a/${entry.id}`, { waitUntil: 'load' })
    await page.waitForSelector('.detail-title')
    await page.getByRole('tab', { name: tabLabel, exact: true }).click()
    const code = await page.locator('.code-pre code').innerText()
    await reader.close()

    const blocks = splitBlocks(code)
    const file = join(outDir, entry.id, 'index.html')
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, pasteInto(blocks))

    // 2. Open that file on its own. No dev server, no bundler, no imports.
    const context = await browser.newContext({ reducedMotion: 'no-preference' })
    const pasted = await context.newPage()
    const errors = []
    pasted.on('pageerror', (e) => errors.push(e.message))
    pasted.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    await pasted.goto(`file://${file}`, { waitUntil: 'load' })
    await pasted.waitForTimeout(150)

    const check = await pasted.evaluate(() => {
      const svg = document.querySelector('svg')
      if (!svg) return { ok: false, why: 'no svg in the document' }
      const animated = [...svg.querySelectorAll('*')].flatMap((el) =>
        el.getAnimations().map((a) => ({ a, el })),
      )
      if (animated.length === 0) return { ok: false, why: 'the pasted JS created no animation' }

      // Scrubbed rather than watched: whether the compositor advances a
      // timeline is a property of the window this runs in, but whether the
      // animation interpolates is a property of the snippet.
      //
      // Every animation is scrubbed together across one shared span, because
      // a snippet may stack several fill:'both' animations on one element —
      // move only one of them and the others simply overwrite what it did.
      const span = Math.max(
        ...animated.map(({ a }) => {
          const t = a.effect.getTiming()
          return Number(t.delay || 0) + Number(t.duration || 0)
        }),
      )
      animated.forEach(({ a }) => a.pause())
      const elements = [...new Set(animated.map(({ el }) => el))]
      const frames = [0, 0.5, 1].map((f) => {
        animated.forEach(({ a }) => {
          a.currentTime = span * f
        })
        return elements
          .map((el) => {
            const cs = getComputedStyle(el)
            return [cs.transform, cs.opacity, cs.strokeDashoffset].join('|')
          })
          .join(' ')
      })
      return { ok: true, frames, animations: animated.length, elements: elements.length, span }
    })

    // Does it also run on its own, unscrubbed?
    const advanced = await pasted.evaluate(async () => {
      const svg = document.querySelector('svg')
      const a = [...svg.querySelectorAll('*')].flatMap((el) => el.getAnimations())[0]
      if (!a) return null
      a.cancel()
      a.play()
      const before = Number(a.currentTime ?? 0)
      await new Promise((r) => setTimeout(r, 400))
      return Math.round(Number(a.currentTime ?? 0) - before)
    })

    await context.close()

    const distinct = check.ok ? new Set(check.frames).size : 0
    const pass = check.ok && errors.length === 0 && distinct > 1
    results.push({ id: entry.id, pass, errors, check, advanced })
    console.log(
      `  ${pass ? 'PASS' : 'FAIL'}  ${entry.id.padEnd(20)} ${
        check.ok ? `${check.animations} anim / ${check.elements} el, ${check.span}ms, ${distinct} distinct frames` : check.why
      }${errors.length ? `  errors: ${errors.join('; ')}` : ''}`,
    )
    if (advanced !== null) console.log(`        unscrubbed: advanced ${advanced}ms in 400ms of wall clock`)
  }

  await browser.close()
  await server.close()
  if (!keep) await rm(outDir, { recursive: true, force: true })

  const failed = results.filter((r) => !r.pass)
  console.log(`\n${results.length - failed.length}/${results.length} pasted and ran`)
  if (failed.length) process.exit(1)
}

main().catch((err) => {
  console.error(`\n${err.message}`)
  process.exit(1)
})
