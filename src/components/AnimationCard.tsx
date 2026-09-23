import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Link2, Pause, Play } from 'lucide-react'
import Stage from './Stage'
import ScrollStage from './ScrollStage'
import CodeTabs from './CodeTabs'
import { useAnimation } from '../lib/useAnimation'
import { useInView } from '../lib/useInView'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import { resolveDemo } from '../lib/useDemo'
import { className, emitGsap, emitHtml, emitReact, emitVanillaJS } from '../lib/emit'
import { demoById } from '../demos'
import type { Engine } from '../lib/usePreviewEngine'
import type { CatalogEntry } from '../lib/types'

export default function AnimationCard({
  entry,
  demo: pageDemo,
  engine,
  onEngineChange,
}: {
  entry: CatalogEntry
  demo: string
  engine: Engine
  onEngineChange: (e: Engine) => void
}) {
  const { module, source, vanillaSource, css } = entry
  const [replayKey, setReplayKey] = useState(0)
  const [showCode, setShowCode] = useState(false)
  const [openedOnce, setOpenedOnce] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const isLoop = module.trigger === 'loop'
  const [isPlaying, setIsPlaying] = useState(isLoop)
  const { ref: cardRef, inView } = useInView<HTMLElement>('100% 0px')
  const isHover = module.trigger === 'hover'
  const isScroll = module.trigger === 'scroll'
  const prefersReducedMotion = usePrefersReducedMotion()
  const loopBlocked = prefersReducedMotion && module.reducedMotion === 'skip'
  const active = isLoop ? inView && isPlaying : inView

  const demoId = resolveDemo(module.demos, pageDemo)
  const demo = demoById(demoId)
  const stageKey = `${demoId}::${replayKey}`
  const ref = useAnimation(module, module.defaults, active, stageKey, engine, isLoop ? undefined : setIsPlaying)

  const toggleCode = () => {
    setShowCode((v) => !v)
    setOpenedOnce(true)
  }

  const jsGsap = openedOnce ? emitGsap(module, source, module.defaults, demoId, css) : ''
  const react = openedOnce ? emitReact(module, source, module.defaults, demoId, css) : ''
  const html = openedOnce ? emitHtml(module, demoId, css) : ''
  const js = openedOnce && vanillaSource ? emitVanillaJS(module, vanillaSource, module.defaults, demoId, css) : null

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${location.origin}${import.meta.env.BASE_URL}a/${module.id}`)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const replay = () => {
    if (isPlaying) return
    setReplayKey((k) => k + 1)
  }

  const stage = <Stage key={stageKey} ref={ref} demo={demo} className={className(module)} />

  return (
    <article ref={cardRef} id={module.id} className="k-card">
      <div className="k-card-meta">
        <div className="k-card-header">
          <div className="k-title-group">
            <h3 className="k-card-title">
              <Link to={`/a/${module.id}`}>{module.name}</Link>
            </h3>
            <p className="k-chip">{module.category}</p>
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
          </div>
          <button
            type="button"
            onClick={copyLink}
            aria-label="Copy link to this animation"
            title={linkCopied ? 'Copied' : 'Copy link to this animation'}
            className="k-icon-btn"
          >
            {linkCopied ? <Check size={14} /> : <Link2 size={14} />}
          </button>
        </div>
        <p className="k-blurb">{module.blurb}</p>
        <div className="k-card-actions">
          {isHover ? (
            <span className="k-hint">Hover the shape</span>
          ) : isScroll ? null : isLoop ? (
            <button
              type="button"
              disabled={loopBlocked}
              aria-pressed={isPlaying}
              onClick={() => setIsPlaying((v) => !v)}
              className="k-play-btn"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {loopBlocked ? 'Reduced motion' : isPlaying ? 'Pause' : 'Play'}
            </button>
          ) : (
            <button type="button" disabled={isPlaying || loopBlocked} onClick={replay} className="k-play-btn">
              <Play size={14} />
              {loopBlocked ? 'Reduced motion' : isPlaying ? 'Playing…' : 'Play'}
            </button>
          )}
          <button type="button" aria-expanded={showCode} onClick={toggleCode} className="k-ghost-btn">
            {showCode ? 'Hide code' : 'Show code'}
          </button>
          <Link to={`/a/${module.id}`} className="k-ghost-btn">
            Open ↗
          </Link>
        </div>
      </div>
      {isScroll ? (
        <ScrollStage>{stage}</ScrollStage>
      ) : (
        <div className="stage stage-clickable" onClick={replay}>
          {stage}
        </div>
      )}
      <div className="drawer" data-open={showCode}>
        <div className="drawer-inner">
          {openedOnce && (
            <CodeTabs
              js={js}
              jsGsap={jsGsap}
              react={react}
              html={html}
              source={source}
              vanilla={module.vanilla}
              vanillaNote={module.vanillaNote}
              engine={engine}
              onEngineChange={onEngineChange}
            />
          )}
        </div>
      </div>
    </article>
  )
}
