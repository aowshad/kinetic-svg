import type { AnimationModule, AnimationOptions } from './types'
import { LINEAR_EASE_MAP, EASE_POINTS } from './linearEases'
import { EASE_AT_SOURCE, PATHS_SOURCE } from './inlineHelpers'
import { demoById, demoSvg, type Demo } from '../demos'

/**
 * For text, the visitor supplies the content, so a snippet could be JS alone
 * and still work when pasted. Here they don't: the animation references
 * paths, groups and rects that exist only in artwork the reader hasn't got.
 * So every snippet emits three blocks as one copyable unit — markup, then
 * the CSS it needs, then the JS — and the markup is serialised from the
 * module's current demo, the same way the text library baked the current
 * sample text into its output.
 */
function toCamel(id: string) {
  return id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

export function className(module: AnimationModule): string {
  return `k-${module.id}`
}

function extractBody(source: string): string {
  const m = source.match(/\/\/ #region body\n([\s\S]*?)\n\s*\/\/ #endregion body/)
  return m ? m[1] : source
}

function dedent(body: string): string {
  return body
    .split('\n')
    .map((l) => (l.startsWith('  ') ? l.slice(2) : l))
    .join('\n')
}

function indent(body: string, spaces: number): string {
  const pad = ' '.repeat(spaces)
  return body
    .split('\n')
    .map((l) => (l ? pad + l : l))
    .join('\n')
}

function transformBody(rawBody: string, o: AnimationOptions, reducedMotionVars: boolean): string {
  return dedent(rawBody)
    .split('\n')
    .filter((line) => !/\/\/\s*@internal\s*$/.test(line))
    .map((line) => {
      const emit = line.match(/^(\s*).*?\s*\/\/\s*@emit:\s*(.+)$/)
      return emit ? `${emit[1]}${emit[2]}` : line
    })
    .join('\n')
    .replace(/\bo\.duration\b/g, reducedMotionVars ? '_duration' : String(o.duration))
    .replace(/\bo\.stagger\b/g, reducedMotionVars ? '_stagger' : String(o.stagger))
    .replace(/\bo\.delay\b/g, reducedMotionVars ? '_delay' : String(o.delay))
    .replace(/\bo\.ease\b/g, `'${o.ease}'`)
    .replace(/\s+as const\b/g, '')
    // An @internal line leaves its blank neighbours behind; collapse them so
    // the snippet doesn't read as though something is missing.
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function reducedMotionPreamble(o: AnimationOptions, body: string, pad: string): string {
  const lines = [`${pad}const _reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches`]
  if (body.includes('_duration')) lines.push(`${pad}const _duration = _reducedMotion ? 0.01 : ${o.duration}`)
  if (body.includes('_stagger')) lines.push(`${pad}const _stagger = _reducedMotion ? 0 : ${o.stagger}`)
  if (body.includes('_delay')) lines.push(`${pad}const _delay = _reducedMotion ? 0 : ${o.delay}`)
  return `${lines.join('\n')}\n\n`
}

function skipGuard(pad: string, returnValue: string): string {
  return `${pad}if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return${returnValue}\n\n`
}

function importLines(plugins: string[], extra: string[] = []): string[] {
  return [...extra, "import gsap from 'gsap'", ...plugins.map((p) => `import { ${p} } from 'gsap/${p}'`)]
}

function registerLine(plugins: string[]): string {
  return plugins.length ? `\ngsap.registerPlugin(${plugins.join(', ')})\n` : ''
}

export function markupBlock(module: AnimationModule, demo: Demo): string {
  return demoSvg(demo, className(module))
}

/**
 * The three blocks, headed by comments in each block's own language so the
 * whole thing survives being pasted into one file and still reads as three
 * parts. The JS ends with the call that runs it — without that the snippet
 * defines a function nobody invokes, which is the difference between "this
 * runs when pasted" and "this compiles when pasted".
 */
function assemble(module: AnimationModule, demo: Demo, js: string, css?: string): string {
  const blocks = [`<!-- 1. Markup -->\n${markupBlock(module, demo)}`]
  if (css?.trim()) blocks.push(`/* 2. CSS */\n${css.trim()}`)
  blocks.push(`${css?.trim() ? '// 3. JS' : '// 2. JS'}\n${js.trim()}`)
  return `${blocks.join('\n\n')}\n`
}

function runner(module: AnimationModule): string {
  return `\n\n${toCamel(module.id)}(document.querySelector('.${className(module)}'))`
}

/** Inlines whichever shared helpers the body actually calls. */
function helpersFor(source: string): string {
  const helpers = []
  if (source.includes('paths(')) helpers.push(PATHS_SOURCE)
  if (source.includes('easeAt(')) helpers.push(EASE_AT_SOURCE)
  return helpers.map((h) => `\n\n${h}`).join('')
}

/** GSAP snippet: markup + CSS + a module that imports gsap. */
export function emitGsap(module: AnimationModule, source: string, o: AnimationOptions, demoId: string, css?: string) {
  const skip = module.reducedMotion === 'skip'
  const body = indent(transformBody(extractBody(source), o, !skip), 2)
  const fnName = toCamel(module.id)
  const reducedMotionCode = skip ? skipGuard('  ', ' () => {}') : reducedMotionPreamble(o, body, '  ')
  const js = `${importLines(module.plugins).join('\n')}\n${registerLine(module.plugins)}
function ${fnName}(svg) {
${reducedMotionCode}${body}
}${helpersFor(source)}
${runner(module)}`
  return assemble(module, demoById(demoId), js, css)
}

/**
 * Zero-dependency snippet. Same sentinel pipeline as the GSAP path, plus the
 * ease substitution: LINEAR_EASE_MAP/EASE_POINTS lookups become the literal
 * linear() string or points array for the current ease, resolved here at emit
 * time so the snippet carries no import and no curve maths.
 */
export function emitVanillaJS(
  module: AnimationModule,
  vanillaSource: string,
  o: AnimationOptions,
  demoId: string,
  css?: string,
) {
  const skip = module.reducedMotion === 'skip'
  let body = transformBody(extractBody(vanillaSource), o, !skip)
  body = body
    .replace(/LINEAR_EASE_MAP\['([^']+)'\]\s*\?\?\s*'linear'/g, (_, ease: string) => `'${LINEAR_EASE_MAP[ease] ?? 'linear'}'`)
    .replace(
      /EASE_POINTS\['([^']+)'\]\s*\?\?\s*\[0,\s*1\]/g,
      (_, ease: string) => `[${(EASE_POINTS[ease] ?? [0, 1]).join(', ')}]`,
    )
  body = indent(body, 2)

  const fnName = toCamel(module.id)
  const reducedMotionCode = skip ? skipGuard('  ', ' () => {}') : reducedMotionPreamble(o, body, '  ')
  const js = `function ${fnName}(svg) {
${reducedMotionCode}${body}
}${helpersFor(vanillaSource)}
${runner(module)}`
  return assemble(module, demoById(demoId), js, css)
}

/** Markup only, for a reader who already has the behaviour wired up. */
export function emitHtml(module: AnimationModule, demoId: string, css?: string): string {
  const markup = markupBlock(module, demoById(demoId))
  return css?.trim() ? `${markup}\n\n<style>\n${indent(css.trim(), 2)}\n</style>\n` : `${markup}\n`
}

/** SVG attributes are kebab-case in markup and camelCase in JSX. */
function toJsx(markup: string): string {
  return markup
    .replace(/\bclass=/g, 'className=')
    .replace(/\b([a-z]+)-([a-z])([a-z-]*)=/g, (_, a: string, b: string, rest: string) =>
      `${a}${b.toUpperCase()}${rest.replace(/-([a-z])/g, (__, c: string) => c.toUpperCase())}=`,
    )
}

export function emitReact(module: AnimationModule, source: string, o: AnimationOptions, demoId: string, css?: string) {
  const demo = demoById(demoId)
  const skip = module.reducedMotion === 'skip'
  const body = indent(transformBody(extractBody(source), o, !skip), 6)
  const fnName = toCamel(module.id)
  const componentName = fnName[0].toUpperCase() + fnName.slice(1)
  const reducedMotionCode = skip ? skipGuard('    ', '') : reducedMotionPreamble(o, body, '    ')
  const a11y = demo.title ? `role="img"` : `aria-hidden="true"`
  const jsx = indent(toJsx(demo.markup), 4)
  const code = `${importLines(module.plugins, ["import { useEffect, useRef } from 'react'"]).join('\n')}\n${registerLine(module.plugins)}
export default function ${componentName}() {
  const ref = useRef(null)

  useEffect(() => {
    const svg = ref.current
    if (!svg) return
${reducedMotionCode}    const ctx = gsap.context(() => {
${body}
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <svg ref={ref} viewBox="${demo.viewBox}" className="${className(module)}" ${a11y}>
${jsx}
    </svg>
  )
}
`
  return css?.trim() ? `${code}\n/* CSS */\n${css.trim()}\n` : code
}
