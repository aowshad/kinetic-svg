#!/usr/bin/env node
/**
 * Records every animation in the registry and writes an optimised gif per
 * animation to docs/gifs/.
 *
 * Each animation is recorded on its own detail page, in its own browser
 * context, as a full-viewport webm; the stage is then cropped out of that
 * webm by ffmpeg (Playwright records the viewport, not an element) and
 * palette-quantised to a gif.
 *
 * Usage:
 *   node scripts/capture-gifs.mjs                 # all animations
 *   node scripts/capture-gifs.mjs --only blur-in  # one, by id (repeatable)
 *   node scripts/capture-gifs.mjs --from-cache    # re-encode, skip recording
 *   node scripts/capture-gifs.mjs --width 640     # gif width, default 480
 *   node scripts/capture-gifs.mjs --headed        # watch it work
 */
import { execFile } from 'node:child_process'
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import ffmpegPath from 'ffmpeg-static'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { readCatalog, sampleFor } from './lib/catalog.mjs'

const execFileAsync = promisify(execFile)
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const animationsDir = join(root, 'src/animations')
const gifDir = join(root, 'docs/gifs')
const webmDir = join(root, '.capture/webm')

const VIEWPORT = { width: 1100, height: 800 }
const FPS = 18
const SETTLE_MS = 900 // after load: fonts, fitText, and the on-mount run
const MARKER_EPSILON_S = 0.04 // one frame past the marker, so no white edge survives
const TAIL_MS = 500 // hold the end state before cutting
const END_HOLD_S = 0.45 // how much of that hold survives into the gif
const SCROLL_MS = 2200 // how long a scroll animation takes to scrub end to end
const MAX_ANIM_MS = 4000

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const value = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const only = args.reduce((acc, a, i) => (a === '--only' && args[i + 1] ? [...acc, args[i + 1]] : acc), [])
const GIF_WIDTH = Number(value('width', '480'))

/**
 * CLAUDE.md: a throttled clock invalidates every timing decision below — the
 * trigger waits, the trim offsets, all of it. Fail loudly instead of writing
 * 45 subtly wrong gifs.
 */
async function assertClockIsHonest(page, id) {
  const elapsed = await page.evaluate(async () => {
    const t0 = performance.now()
    await new Promise((r) => setTimeout(r, 200))
    return performance.now() - t0
  })
  if (elapsed > 300) {
    throw new Error(
      `Clock is throttled on ${id}: setTimeout(200) took ${Math.round(elapsed)}ms. ` +
        `Recording would be unusable — aborting rather than producing bad gifs.`,
    )
  }
}

const MARKER_ID = '__kinetic_capture_marker'

/** Covers the viewport in white so the video carries a findable sync point. */
async function raiseMarker(page) {
  await page.evaluate((id) => {
    const el = document.createElement('div')
    el.id = id
    Object.assign(el.style, { position: 'fixed', inset: '0', background: '#fff', zIndex: '2147483647' })
    document.body.appendChild(el)
  }, MARKER_ID)
  await page.waitForTimeout(400) // ~10 frames at Playwright's 25fps
}

async function dropMarker(page) {
  await page.evaluate((id) => document.getElementById(id)?.remove(), MARKER_ID)
}

/** Plays the animation the way its category is meant to be triggered. */
async function trigger(page, entry, text) {
  const { category, duration, stagger, delay } = entry
  const oneShotMs = Math.min(MAX_ANIM_MS, (delay + duration + stagger * text.length) * 1000)

  if (category === 'scroll') {
    await dropMarker(page)
    await page.waitForTimeout(250)
    await page.evaluate(async (ms) => {
      const el = document.querySelector('.scroll-demo-track')
      const max = el.scrollHeight - el.clientHeight
      const start = performance.now()
      await new Promise((resolve) => {
        const step = (now) => {
          const t = Math.min(1, (now - start) / ms)
          el.scrollTop = t * max
          if (t < 1) requestAnimationFrame(step)
          else resolve()
        }
        requestAnimationFrame(step)
      })
    }, SCROLL_MS)
    return
  }

  if (category === 'hover') {
    await dropMarker(page)
    const target = page.locator('.stage > *').first()
    await target.hover()
    await page.waitForTimeout(oneShotMs + 400)
    await page.mouse.move(10, 10) // and back out, so the gif shows the return
    await page.waitForTimeout(oneShotMs + 200)
    return
  }

  if (category === 'loop') {
    // Already running on mount; just hold the camera on it.
    await dropMarker(page)
    await page.waitForTimeout(Math.min(MAX_ANIM_MS, duration * 1000 * 2 + 600))
    return
  }

  // entrance / kinetic / exit: replay once from the toolbar. Uncovering and
  // replaying in one tick keeps the finished-on-mount state out of the gif.
  await page.evaluate((id) => {
    document.getElementById(id)?.remove()
    document.querySelector('.k-play-btn')?.click()
  }, MARKER_ID)
  await page.waitForTimeout(oneShotMs)
}

/**
 * Recording starts a few hundred ms after the context does and keeps running
 * a few hundred ms past the last action, both by a margin that varies per
 * run — so no wall-clock offset finds the animation in the file. Instead the
 * page holds a white card over the viewport until the moment it triggers, and
 * the trim point is read back out of the video: negate turns that card black,
 * and the last black interval ends on the first animated frame.
 */
async function findTriggerPoint(file) {
  const { stderr } = await execFileAsync(
    ffmpegPath,
    ['-i', file, '-vf', 'negate,blackdetect=d=0.1:pix_th=0.10', '-f', 'null', '-'],
    { encoding: 'utf8', maxBuffer: 1 << 24 },
  ).catch((e) => e)
  const ends = [...stderr.matchAll(/black_end:([\d.]+)/g)].map((m) => Number(m[1]))
  if (ends.length === 0) throw new Error(`No sync marker found in ${file}`)
  return Math.max(...ends)
}

/**
 * The recording window is sized from duration + stagger × character count,
 * which overshoots whenever an animation staggers by word or line rather than
 * by character — leaving seconds of held end state that read as a frozen gif
 * on loop. mpdecimate drops near-identical frames, so the last frame it keeps
 * is the last frame that actually moved.
 */
async function findMotionEnd(webm, crop, trimStart, clipSeconds) {
  const { stderr } = await execFileAsync(
    ffmpegPath,
    [
      '-ss', String(trimStart),
      '-t', String(clipSeconds),
      '-i', webm,
      '-vf', `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y},mpdecimate=hi=128:lo=64:frac=0.002,showinfo`,
      '-f', 'null', '-',
    ],
    { encoding: 'utf8', maxBuffer: 1 << 24 },
  ).catch((e) => e)
  const times = [...stderr.matchAll(/pts_time:([\d.]+)/g)].map((m) => Number(m[1]))
  return times.length ? Math.max(...times) : clipSeconds
}

async function toGif(webm, out, crop, trimStart, clipSeconds) {
  await mkdir(dirname(out), { recursive: true })
  const palette = join(webmDir, 'palette.png')
  const chain = `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y},fps=${FPS},scale=${GIF_WIDTH}:-2:flags=lanczos`
  const clip = ['-ss', String(trimStart), '-t', String(clipSeconds)]

  await execFileAsync(ffmpegPath, ['-y', ...clip, '-i', webm, '-vf', `${chain},palettegen=stats_mode=diff`, palette])
  await execFileAsync(ffmpegPath, [
    '-y',
    ...clip,
    '-i',
    webm,
    '-i',
    palette,
    '-lavfi',
    `${chain}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
    '-loop',
    '0',
    out,
  ])
  await rm(palette, { force: true })
}

async function main() {
  const catalog = (await readCatalog(animationsDir)).filter((e) => only.length === 0 || only.includes(e.id))
  if (catalog.length === 0) throw new Error(`No animations matched ${only.join(', ')}`)

  await mkdir(gifDir, { recursive: true })
  await mkdir(webmDir, { recursive: true })

  if (flag('from-cache')) {
    console.log(`Re-encoding ${catalog.length} gif(s) from cached webm…`)
    for (const entry of catalog) {
      const meta = JSON.parse(await readFile(join(webmDir, `${entry.id}.json`), 'utf8'))
      const bound = meta.recorded_s ?? meta.clipSeconds
      const motionEnd = await findMotionEnd(meta.webm, meta.crop, meta.trimStart, bound)
      const clipSeconds = Math.min(bound, motionEnd + END_HOLD_S)
      await toGif(meta.webm, join(gifDir, `${entry.id}.gif`), meta.crop, meta.trimStart, clipSeconds)
      console.log(`  ${entry.id.padEnd(24)} ${clipSeconds.toFixed(1)}s`)
    }
    return
  }

  const server = await createServer({ root, logLevel: 'warn' })
  await server.listen()
  const base = server.resolvedUrls.local[0]

  const browser = await chromium.launch({
    headless: !flag('headed'),
    args: [
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
    ],
  })

  console.log(`Recording ${catalog.length} animation(s) from ${base}\n`)
  const written = []

  for (const entry of catalog) {
    const text = sampleFor(entry.role)
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      colorScheme: 'dark',
      reducedMotion: 'no-preference',
      recordVideo: { dir: webmDir, size: VIEWPORT },
    })
    await context.addInitScript(
      ([theme, sample]) => {
        try {
          localStorage.setItem('kinetic-theme', theme)
          sessionStorage.setItem('kinetic-sample-text', sample)
        } catch {
          /* ignore */
        }
      },
      ['dark', text],
    )

    const page = await context.newPage()
    await page.goto(`${base}#/a/${entry.id}`, { waitUntil: 'load' })
    await page.waitForSelector('.stage')
    await page.evaluate(() => document.fonts.ready)
    await assertClockIsHonest(page, entry.id)
    await page.waitForTimeout(SETTLE_MS)

    const box = await page.locator('.stage').first().boundingBox()
    if (!box) throw new Error(`No stage found for ${entry.id}`)

    await raiseMarker(page)
    const triggeredAt = Date.now()
    await trigger(page, entry, text)
    await page.waitForTimeout(TAIL_MS)
    const endedAt = Date.now()

    const video = page.video()
    await context.close()
    const recorded = await video.path()
    const webm = join(webmDir, `${entry.id}.webm`)
    await rm(webm, { force: true })
    await rename(recorded, webm)

    const crop = {
      // Inset by the stage's own 1px border so it doesn't frame the gif.
      x: Math.round(box.x) + 1,
      y: Math.round(box.y) + 1,
      w: Math.round(box.width) - 2,
      h: Math.round(box.height) - 2,
    }
    const recorded_s = (endedAt - triggeredAt) / 1000
    const trimStart = (await findTriggerPoint(webm)) + MARKER_EPSILON_S
    const motionEnd = await findMotionEnd(webm, crop, trimStart, recorded_s)
    const clipSeconds = Math.min(recorded_s, motionEnd + END_HOLD_S)

    const gif = join(gifDir, `${entry.id}.gif`)
    await toGif(webm, gif, crop, trimStart, clipSeconds)
    // Sidecar so --from-cache can re-encode without driving the browser again.
    await writeFile(
      join(webmDir, `${entry.id}.json`),
      JSON.stringify({ webm, crop, trimStart, clipSeconds, recorded_s }),
    )

    const kb = Math.round((await stat(gif)).size / 1024)
    written.push({ id: entry.id, kb })
    console.log(`  ${entry.id.padEnd(24)} ${String(kb).padStart(5)} KB  (${clipSeconds.toFixed(1)}s)`)
  }

  await browser.close()
  await server.close()

  const total = written.reduce((sum, w) => sum + w.kb, 0)
  console.log(`\n${written.length} gifs → docs/gifs/ (${(total / 1024).toFixed(1)} MB total)`)
}

main().catch((err) => {
  console.error(`\n${err.message}`)
  process.exit(1)
})
