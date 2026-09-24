import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Every animation's style.css ships inside its snippet, so the page that
 * previews the animation has to be running those rules as well. For a while
 * the SVG section only ever read them as text for the emitter and never
 * applied them, and nothing noticed: hamburger-close rendered two stray
 * strokes on the site while its pasted snippet, which does carry the CSS,
 * rendered a clean ×. The bug stays invisible until a snippet happens to
 * need CSS the site doesn't have, so this checks for it directly.
 *
 * Both sides are parsed by the browser, so selectors are compared after the
 * same normalisation, and selector lists are split into single selectors so
 * a rule written as `.a, .b` in one place and as two rules in another still
 * matches. Keyframes are compared by name. Only presence is checked, not
 * that the declarations inside are identical.
 *
 * Kept identical in both sections' scripts/lib.
 */
function installRuleKeys() {
  window.__ruleKeys = (rules) => {
    const keys = new Set()
    const split = (selector) => {
      const out = []
      let depth = 0
      let current = ''
      for (const ch of selector) {
        if (ch === '(') depth++
        if (ch === ')') depth--
        if (ch === ',' && depth === 0) {
          out.push(current.trim())
          current = ''
        } else current += ch
      }
      out.push(current.trim())
      return out
    }
    const walk = (list) => {
      for (const rule of list) {
        if (rule.type === CSSRule.KEYFRAMES_RULE) {
          keys.add(`@keyframes ${rule.name}`)
          continue
        }
        if (rule.selectorText) split(rule.selectorText).forEach((s) => keys.add(s))
        if (rule.cssRules) walk(rule.cssRules)
      }
    }
    walk(rules)
    return [...keys]
  }
}

async function styleFiles(animationsDir, ids) {
  const files = []
  for (const category of await readdir(animationsDir, { withFileTypes: true })) {
    if (!category.isDirectory()) continue
    for (const id of await readdir(join(animationsDir, category.name))) {
      const file = join(animationsDir, category.name, id, 'style.css')
      if (ids.has(id) && existsSync(file)) files.push({ id, file })
    }
  }
  return files
}

/**
 * Returns one entry per style.css, listing whichever of its selectors and
 * keyframes the live page is missing. An empty `missing` means it's covered.
 */
export async function checkStylesheets(browser, pageUrl, animationsDir, ids) {
  const files = await styleFiles(animationsDir, new Set(ids))
  const context = await browser.newContext()
  await context.addInitScript(installRuleKeys)
  const page = await context.newPage()
  await page.goto(pageUrl, { waitUntil: 'load' })

  const live = new Set(
    await page.evaluate(() => {
      const all = []
      for (const sheet of document.styleSheets) {
        try {
          all.push(...window.__ruleKeys(sheet.cssRules))
        } catch {
          // a cross-origin sheet can't be read, and none of ours is one
        }
      }
      return all
    }),
  )

  const results = []
  for (const { id, file } of files) {
    const keys = await page.evaluate((text) => {
      const sheet = new CSSStyleSheet()
      sheet.replaceSync(text)
      return window.__ruleKeys(sheet.cssRules)
    }, await readFile(file, 'utf8'))
    results.push({ id, rules: keys.length, missing: keys.filter((k) => !live.has(k)) })
  }
  await context.close()
  return results
}
