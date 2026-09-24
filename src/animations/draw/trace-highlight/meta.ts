import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const traceHighlight: AnimationModule = {
  id: 'trace-highlight',
  name: 'Trace Highlight',
  category: 'draw',
  trigger: 'play',
  demos: ['mark', 'wave', 'signature', 'check', 'chart'],
  tags: ['stroke', 'dash', 'highlight'],
  blurb:
    'A short bright dash runs the length of each stroke over a dimmed copy of the drawing, which comes back to full strength once the dash has passed. The dash is a fixed slice of the path, not a draw.',
  defaults: { duration: 1.6, stagger: 0.12, delay: 0, ease: 'power1.inOut' },
  plugins: [],
  reducedMotion: 'settle',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default traceHighlight
