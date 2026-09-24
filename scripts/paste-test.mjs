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
 * What counts as "it ran" has to be right, and two rules make it so:
 *
 *   - Only a change in appearance on an unchanged DOM counts as motion.
 *     clip-wipe once passed on nothing more than its <defs> appearing; setup
 *     like that happens whether or not the animation that follows works.
 *
 *   - The "never ran" baseline is measured, not assumed. Each animation is
 *     also opened with its JS removed and the same trigger applied, so any
 *     motion its CSS produces unaided is known, and a snippet has to beat it.
 *
 * Motion is not correctness, though. A hamburger that ends as two stray
 * strokes still moves, so end states are checked by eye as well — see
 * CLAUDE.md.
 *
 * Usage:
 *   node scripts/paste-test.mjs                 # every animation, both tabs
 *   node scripts/paste-test.mjs --tab jsGsap    # only the GSAP tab
 *   node scripts/paste-test.mjs --tab js        # only the zero-dependency tab
 *   node scripts/paste-test.mjs --only line-draw
 *   node scripts/paste-test.mjs --keep          # leave the pasted files behind
 */
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { readCatalog } from './lib/catalog.mjs'
import { checkStylesheets } from './lib/stylesheets.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const animationsDir = join(root, 'src/animations')
const outDir = join(root, '.capture/paste')
const TABS = { js: 'JS', jsGsap: 'JS + GSAP' }

const args = process.argv.slice(2)
const only = args.reduce((acc, a, i) => (a === '--only' && args[i + 1] ? [...acc, args[i + 1]] : acc), [])
const tabArg = args.includes('--tab') ? args[args.indexOf('--tab') + 1] : null
const tabs = tabArg ? [TABS[tabArg]] : Object.values(TABS)
const keep = args.includes('--keep')

/**
 * Splits the snippet on its own numbered headers rather than on fixed block
 * positions, since the GSAP tab carries an import map the vanilla tab has no
 * need for, and the numbering shifts with it.
 */
function splitBlocks(code) {
  const header = /^(?:<!-- (\d+)\. (.*?) -->|\/\* (\d+)\. (.*?) \*\/|\/\/ (\d+)\. (.*?))$/gm
  const found = []
  for (const m of code.matchAll(header)) {
    found.push({ kind: m[1] ? 'html' : m[3] ? 'css' : 'js', start: m.index, bodyStart: m.index + m[0].length })
  }
  if (found.length === 0) throw new Error('snippet carried no numbered blocks')
  return found.map((b, i) => ({
    kind: b.kind,
    body: code.slice(b.bodyStart, i + 1 < found.length ? found[i + 1].start : undefined).trim(),
  }))
}

/** A blank page holding the pasted blocks — or, for the control, everything but the JS. */
function pasteInto(blocks, { trigger, control = false }) {
  const css = blocks.filter((b) => b.kind === 'css').map((b) => b.body)
  const html = blocks.filter((b) => b.kind === 'html')
  const importMaps = html.filter((b) => b.body.includes('type="importmap"'))
  const markup = html.filter((b) => !importMaps.includes(b)).map((b) => b.body)
  const js = control ? [] : blocks.filter((b) => b.kind === 'js')
  const isModule = importMaps.length > 0 || js.some((b) => /^\s*import\s/m.test(b.body))
  const spacer = trigger === 'scroll' ? '<div style="height: 150vh"></div>' : ''
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>paste test</title>
${control ? '' : importMaps.map((b) => b.body).join('\n')}
    <style>
      body { background: #111; color: #eee; display: grid; place-items: center; min-height: 100vh; margin: 0; }
      svg { width: 240px; height: auto; }
${css.length ? `\n${css.join('\n')}\n` : ''}    </style>
  </head>
  <body>
${spacer}
${markup.join('\n')}
${spacer}
${js.length ? `    <script${isModule ? ' type="module"' : ''}>\n${js.map((b) => b.body).join('\n')}\n    </script>` : ''}
  </body>
</html>
`
}

/**
 * Records every frame as the DOM's shape and how it looks. Geometry
 * attributes sit alongside computed style because a clip wipe moves a rect's
 * width, which no style on the artwork reflects.
 */
function installRecorder() {
  window.__frames = []
  const sample = () => {
    const svg = document.querySelector('svg')
    if (svg) {
      const els = [svg, ...svg.querySelectorAll('*')]
      const shape = `${els.length}:${els.map((el) => el.tagName).join(',')}`
      const look = els
        .map((el) => {
          const s = getComputedStyle(el)
          const attrs = ['width', 'height', 'x', 'y', 'r', 'd', 'points', 'transform', 'clip-path'].map(
            (a) => el.getAttribute(a) ?? '',
          )
          return [s.transform, s.opacity, s.strokeDashoffset, s.strokeDasharray, s.fillOpacity, ...attrs].join('|')
        })
        .join(' ')
      window.__frames.push({ shape, look })
    }
    if (window.__frames.length < 600) requestAnimationFrame(sample)
  }
  requestAnimationFrame(sample)
}

/** Frames where appearance changed while the DOM's shape stayed the same. */
function motionSteps(frames) {
  let steps = 0
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].shape === frames[i - 1].shape && frames[i].look !== frames[i - 1].look) steps++
  }
  return steps
}

async function run(browser, file, entry) {
  const context = await browser.newContext({ reducedMotion: 'no-preference' })
  await context.addInitScript(installRecorder)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(`file://${file}`, { waitUntil: 'load' })
  await page.waitForTimeout(600)

  // Fired the way its trigger says it fires: a hover animation that is never
  // hovered would read as broken when the harness simply didn't trigger it.
  if (entry.trigger === 'hover') {
    await page.hover('svg').catch(() => {})
  } else if (entry.trigger === 'scroll') {
    await page.evaluate(async () => {
      const end = document.body.scrollHeight - window.innerHeight
      for (let i = 0; i <= 20; i++) {
        window.scrollTo(0, (end * i) / 20)
        await new Promise((r) => requestAnimationFrame(r))
      }
    })
  }
  await page.waitForTimeout(2600)

  const frames = await page.evaluate(() => window.__frames ?? [])
  await context.close()
  return { frames: frames.length, motion: motionSteps(frames), errors }
}

async function main() {
  const catalog = (await readCatalog(animationsDir)).filter((e) => only.length === 0 || only.includes(e.id))
  if (only.length && catalog.length !== only.length) {
    throw new Error(`--only named ${only.length} id(s) but ${catalog.length} matched the catalog`)
  }
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  const server = await createServer({ root, logLevel: 'warn' })
  await server.listen()
  const base = server.resolvedUrls.local[0]
  const browser = await chromium.launch()

  // 0. Every rule a snippet ships with has to be live on the site too.
  const sheets = await checkStylesheets(browser, base, animationsDir, catalog.map((e) => e.id))
  const sheetFailures = sheets.filter((s) => s.missing.length)
  console.log(
    `\nStylesheets: ${sheets.length} style.css file(s), ${sheets.reduce((n, s) => n + s.rules, 0)} rule(s)` +
      (sheetFailures.length ? '' : ' — all live on the page'),
  )
  sheetFailures.forEach((s) => console.log(`  FAIL  ${s.id.padEnd(20)} not on the page: ${s.missing.join(', ')}`))

  const results = []
  const controls = new Map()

  for (const tabLabel of tabs) {
    console.log(`\n${tabLabel}`)
    for (const entry of catalog) {
      // 1. Read the snippet the Copy button would hand over.
      const reader = await browser.newContext({ reducedMotion: 'no-preference' })
      const page = await reader.newPage()
      await page.goto(`${base}a/${entry.id}`, { waitUntil: 'load' })
      await page.waitForSelector('.detail-title')
      const tab = page.getByRole('tab', { name: tabLabel, exact: true })
      const hasTab = (await tab.count()) > 0
      let code = ''
      if (hasTab) {
        await tab.click()
        code = await page.locator('.code-pre code').innerText()
      }
      await reader.close()

      // Never skipped silently: a missing zero-dependency tab is only correct
      // for a 'none'-tier animation, and anywhere else it is a failure.
      if (!hasTab) {
        const legit = tabLabel === TABS.js && entry.vanilla === 'none'
        results.push({ id: entry.id, tab: tabLabel, status: legit ? 'skip' : 'fail', why: 'no such tab' })
        console.log(`  ${legit ? 'SKIP' : 'FAIL'}  ${entry.id.padEnd(20)} no ${tabLabel} tab${legit ? " ('none' tier)" : ''}`)
        continue
      }

      const blocks = splitBlocks(code)

      // 2. The measured "never ran" baseline, shared by both tabs.
      if (!controls.has(entry.id)) {
        const file = join(outDir, 'control', entry.id, 'index.html')
        await mkdir(dirname(file), { recursive: true })
        await writeFile(file, pasteInto(blocks, { trigger: entry.trigger, control: true }))
        controls.set(entry.id, await run(browser, file, entry))
      }
      const control = controls.get(entry.id)

      // 3. The snippet itself, opened from disk.
      const file = join(outDir, tabLabel.replace(/\W+/g, '-').toLowerCase(), entry.id, 'index.html')
      await mkdir(dirname(file), { recursive: true })
      await writeFile(file, pasteInto(blocks, { trigger: entry.trigger }))
      const result = await run(browser, file, entry)

      let why = ''
      if (result.frames < 2) why = `only ${result.frames} rendered frames — the animation clock is frozen, nothing here is measurable`
      else if (result.errors.length) why = `errors: ${result.errors.slice(0, 2).join('; ')}`
      else if (result.motion === 0) why = 'no motion — the DOM may have been set up, but nothing then animated'
      else if (result.motion <= control.motion) why = `no motion beyond what its CSS does alone (${result.motion} vs ${control.motion})`

      const status = why ? 'fail' : 'pass'
      results.push({ id: entry.id, tab: tabLabel, status, why })
      console.log(`  ${status.toUpperCase()}  ${entry.id.padEnd(20)} ${why || `${result.motion} motion steps (control ${control.motion})`}`)
    }
  }

  await browser.close()
  await server.close()
  if (!keep) await rm(outDir, { recursive: true, force: true })

  const expected = catalog.length * tabs.length
  const passed = results.filter((r) => r.status === 'pass')
  const failed = results.filter((r) => r.status === 'fail')
  const skipped = results.filter((r) => r.status === 'skip')
  const cssMotion = [...controls].filter(([, c]) => c.motion > 0)

  console.log(`\nCoverage: ${results.length}/${expected} (${catalog.length} animations × ${tabs.length} tab${tabs.length > 1 ? 's' : ''})`)
  console.log(`${passed.length} passed, ${failed.length} failed, ${skipped.length} skipped`)
  if (cssMotion.length) console.log(`CSS moves unaided in: ${cssMotion.map(([id, c]) => `${id} (${c.motion})`).join(', ')}`)
  failed.forEach((f) => console.log(`  FAILED  ${f.tab.padEnd(10)} ${f.id}: ${f.why}`))

  if (results.length !== expected) {
    console.error(`\nCoverage gap: expected ${expected} results, got ${results.length}`)
    process.exit(1)
  }
  if (failed.length || sheetFailures.length) process.exit(1)
}

main().catch((err) => {
  console.error(`\n${err.message}`)
  process.exit(1)
})
