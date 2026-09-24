import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const drawSequence: AnimationModule = {
  id: 'draw-sequence',
  name: 'Draw Sequence',
  category: 'draw',
  trigger: 'play',
  demos: ['mark', 'wave', 'signature', 'check', 'chart'],
  tags: ['stroke', 'dash', 'sequence'],
  blurb:
    'One pen through every stroke in document order: each starts where the last one finished, and its share of the time matches its length, so the pen keeps one speed across the whole drawing.',
  defaults: { duration: 1.6, stagger: 0.06, delay: 0, ease: 'none' },
  plugins: [],
  reducedMotion: 'settle',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default drawSequence
