import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import type { VanillaTier } from '../lib/types'
import type { Engine } from '../lib/usePreviewEngine'

type Tab = 'js' | 'jsGsap' | 'react' | 'html' | 'source'

const LABELS: Record<Tab, string> = { js: 'JS', jsGsap: 'JS + GSAP', react: 'React', html: 'HTML', source: 'Source' }

export default function CodeTabs({
  js,
  jsGsap,
  react,
  html,
  source,
  vanilla,
  vanillaNote,
  engine,
  onEngineChange,
}: {
  js: string | null
  jsGsap: string
  react: string
  html: string
  source: string
  vanilla: VanillaTier
  vanillaNote?: string
  engine: Engine
  onEngineChange: (e: Engine) => void
}) {
  const tabs: Tab[] = js !== null ? ['js', 'jsGsap', 'react', 'html', 'source'] : ['jsGsap', 'react', 'html', 'source']
  const [tab, setTab] = useState<Tab>(js !== null && engine === 'vanilla' ? 'js' : 'jsGsap')
  const [copied, setCopied] = useState(false)
  const code =
    tab === 'js' ? (js ?? '') : tab === 'jsGsap' ? jsGsap : tab === 'react' ? react : tab === 'html' ? html : source

  // Engine changed elsewhere (e.g. the control-bar toggle) while a JS/JS+GSAP
  // tab was open — follow it so the tab and the running preview never disagree.
  useEffect(() => {
    if (tab === 'js' && engine === 'gsap') setTab('jsGsap')
    else if (tab === 'jsGsap' && engine === 'vanilla' && js !== null) setTab('js')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine])

  const selectTab = (t: Tab) => {
    setTab(t)
    if (t === 'js') onEngineChange('vanilla')
    if (t === 'jsGsap') onEngineChange('gsap')
  }

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="detail-code">
      <div className="detail-code-bar">
        <div role="tablist" className="detail-tabs">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => selectTab(t)}
              className="detail-tab-btn"
            >
              {LABELS[t]}
            </button>
          ))}
        </div>
        <button type="button" onClick={copy} className="code-copy-btn">
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      {tab === 'js' && vanilla === 'partial' && vanillaNote && <p className="vanilla-note">{vanillaNote}</p>}
      {tab === 'source' && <p className="source-label">Internal source — for contributors</p>}
      <pre className="code-pre">
        <code>{code}</code>
      </pre>
    </div>
  )
}
