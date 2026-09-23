import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Link2, Play, Repeat } from 'lucide-react'
import catalog from '../animations/registry'
import Stage from '../components/Stage'
import ScrollStage from '../components/ScrollStage'
import ControlPanel, { DEFAULT_ALIGN, type Align } from '../components/ControlPanel'
import CodeTabs from '../components/CodeTabs'
import { useAnimation } from '../lib/useAnimation'
import { SITE_NAME, useDocumentMeta } from '../lib/useDocumentMeta'
import { DEFAULT_DEMO, resolveDemo, useDemo } from '../lib/useDemo'
import { usePreviewEngine } from '../lib/usePreviewEngine'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import { className, emitGsap, emitHtml, emitReact, emitVanillaJS } from '../lib/emit'
import { demoById } from '../demos'
import DemoPicker from '../components/DemoPicker'
import type { AnimationOptions } from '../lib/types'

export default function Detail() {
  const { id } = useParams<{ id: string }>()
  const index = catalog.findIndex((e) => e.module.id === id)
  const entry = index >= 0 ? catalog[index] : undefined
  const prev = entry ? catalog[(index - 1 + catalog.length) % catalog.length] : undefined
  const next = entry ? catalog[(index + 1) % catalog.length] : undefined

  if (!entry) {
    return (
      <div className="min-h-screen px-6 py-16 text-center">
        <p>Animation not found.</p>
        <Link to="/" className="text-[var(--accent)]">
          Back to gallery
        </Link>
      </div>
    )
  }

  return <DetailView key={entry.module.id} entry={entry} prev={prev} next={next} />
}

function DetailView({
  entry,
  prev,
  next,
}: {
  entry: (typeof catalog)[number]
  prev?: (typeof catalog)[number]
  next?: (typeof catalog)[number]
}) {
  const { module, source, vanillaSource, css } = entry
  const [demo, setDemo] = useDemo()
  const [engine, setEngine] = usePreviewEngine()
  const [align, setAlign] = useState<Align>(DEFAULT_ALIGN)
  const [options, setOptions] = useState<AnimationOptions>(module.defaults)
  const [previewEase, setPreviewEase] = useState<string | null>(null)
  const [replayKey, setReplayKey] = useState(0)
  const [autoLoop, setAutoLoop] = useState(false)
  const isHover = module.trigger === 'hover'
  const isScroll = module.trigger === 'scroll'
  const [isPlaying, setIsPlaying] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const scrollTrackRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const loopBlocked = prefersReducedMotion && module.reducedMotion === 'skip'

  useDocumentMeta({
    title: `${module.name} — ${SITE_NAME}`,
    description: `${module.blurb} A copy-paste ${module.category} SVG animation — markup, CSS and JS, with or without GSAP.`,
    path: `a/${module.id}/`,
  })

  const handleTrackScroll = (el: HTMLDivElement) => {
    const max = el.scrollHeight - el.clientHeight
    setScrollProgress(max > 0 ? (el.scrollTop / max) * 100 : 0)
  }

  const handleScrub = (percent: number) => {
    setScrollProgress(percent)
    const el = scrollTrackRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    el.scrollTop = (percent / 100) * max
  }

  useEffect(() => {
    if (!autoLoop) return
    const id = setInterval(() => setReplayKey((k) => k + 1), 1200)
    return () => clearInterval(id)
  }, [autoLoop])

  const effectiveOptions: AnimationOptions = { ...options, ease: previewEase ?? options.ease }
  const demoId = resolveDemo(module.demos, demo)
  const stageKey = `${demoId}::${JSON.stringify(effectiveOptions)}::${replayKey}`
  const ref = useAnimation(module, effectiveOptions, true, stageKey, engine, setIsPlaying)

  const jsGsap = emitGsap(module, source, options, demoId, css)
  const react = emitReact(module, source, options, demoId, css)
  const html = emitHtml(module, demoId, css)
  const js = vanillaSource ? emitVanillaJS(module, vanillaSource, options, demoId, css) : null

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${location.origin}${import.meta.env.BASE_URL}a/${module.id}`)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const resetAll = () => {
    setDemo(DEFAULT_DEMO)
    setAlign(DEFAULT_ALIGN)
    setOptions(module.defaults)
    setPreviewEase(null)
  }

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-[1100px]">
        <div className="detail-topbar">
          <Link to="/" className="k-ghost-btn">
            <ArrowLeft size={13} />
            Back to gallery
          </Link>
          <button type="button" onClick={copyLink} className="k-ghost-btn">
            {linkCopied ? <Check size={13} /> : <Link2 size={13} />}
            {linkCopied ? 'Copied' : 'Copy link'}
          </button>
        </div>

        <div className="detail-title-row">
          <div className="detail-title-group">
            <h1 className="detail-title">{module.name}</h1>
            <span className="k-chip">{module.category}</span>
            {module.vanilla === 'partial' && (
              <span className="k-deps-badge k-deps-badge-partial" title={module.vanillaNote}>
                Partial
              </span>
            )}
            {module.vanilla === 'none' && (
              <span className="k-deps-badge k-deps-badge-none" title={module.vanillaNote ?? 'Needs GSAP'}>
                GSAP
              </span>
            )}
            {engine === 'gsap' &&
              module.plugins.map((p) => (
                <span key={p} className="plugin-badge" title="Included free in GSAP 3.13+">
                  {p}
                </span>
              ))}
          </div>
        </div>
        <p className="detail-blurb">{module.blurb}</p>
        {module.vanilla === 'none' && (
          <p className="needs-gsap-note">{module.vanillaNote ?? 'Needs GSAP — no zero-dependency equivalent for this animation.'}</p>
        )}

        {isScroll ? (
          <ScrollStage className="detail-stage" ref={scrollTrackRef} onTrackScroll={handleTrackScroll}>
            <Stage key={stageKey} ref={ref} demo={demoById(demoId)} className={className(module)} />
          </ScrollStage>
        ) : (
          <div className="stage detail-stage" style={{ justifyItems: align === 'left' ? 'start' : align === 'right' ? 'end' : 'center', textAlign: align }}>
            <Stage key={stageKey} ref={ref} demo={demoById(demoId)} className={className(module)} />
          </div>
        )}
        <div className="stage-toolbar">
          {isHover ? (
            <span className="k-hint">Hover the text</span>
          ) : isScroll ? (
            <div className="scroll-scrub">
              <span className="slider-bound">0%</span>
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={scrollProgress}
                onChange={(e) => handleScrub(Number(e.target.value))}
                className="control-range"
                aria-label="Scroll progress"
              />
              <span className="slider-bound">100%</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={isPlaying || loopBlocked}
                aria-label={loopBlocked ? 'Replay disabled — reduced motion is on' : `Play ${module.name} animation`}
                title={loopBlocked ? 'This loops forever, so replay stays off while reduced motion is on' : undefined}
                onClick={() => setReplayKey((k) => k + 1)}
                className="k-play-btn"
              >
                <Play size={14} />
                {loopBlocked ? 'Reduced motion' : isPlaying ? 'Playing…' : 'Play'}
              </button>
              <button
                type="button"
                disabled={loopBlocked}
                aria-pressed={autoLoop}
                aria-label={loopBlocked ? 'Loop playback disabled — reduced motion is on' : 'Loop playback every 1.2s'}
                title={loopBlocked ? 'Reduced motion is on' : 'Loop playback every 1.2s'}
                onClick={() => setAutoLoop((v) => !v)}
                className="k-play-btn"
              >
                <Repeat size={14} />
                Loop
              </button>
            </>
          )}
        </div>

        <DemoPicker value={demoId} onChange={setDemo} supported={module.demos} />

        <ControlPanel
          align={align}
          onAlignChange={setAlign}
          options={options}
          defaults={module.defaults}
          onChange={setOptions}
          onResetAll={resetAll}
          onPreviewEase={setPreviewEase}
          hideMotionSliders={isScroll}
        />

        <CodeTabs
          js={js}
          jsGsap={jsGsap}
          react={react}
          html={html}
          source={source}
          vanilla={module.vanilla}
          vanillaNote={module.vanillaNote}
          engine={engine}
          onEngineChange={setEngine}
        />

        <nav className="detail-nav">
          {prev && (
            <Link to={`/a/${prev.module.id}`} className="k-ghost-btn">
              ← {prev.module.name}
            </Link>
          )}
          {next && (
            <Link to={`/a/${next.module.id}`} className="k-ghost-btn">
              {next.module.name} →
            </Link>
          )}
        </nav>
      </div>
    </div>
  )
}
