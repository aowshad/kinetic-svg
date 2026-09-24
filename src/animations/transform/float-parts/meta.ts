import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const floatParts: AnimationModule = {
  id: 'float-parts',
  name: 'Float Parts',
  category: 'transform',
  trigger: 'loop',
  demos: ['mark', 'menu', 'wave', 'signature', 'chart', 'blob', 'check', 'play'],
  tags: ['transform', 'drift', 'loop'],
  blurb:
    'Each part drifts back and forth on its own slow period, forever, so the drawing breathes without any two parts moving together.',
  defaults: { duration: 2.4, stagger: 0, delay: 0, ease: 'sine.inOut' },
  plugins: [],
  reducedMotion: 'skip',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default floatParts
