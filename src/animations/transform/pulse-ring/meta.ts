import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const pulseRing: AnimationModule = {
  id: 'pulse-ring',
  name: 'Pulse Ring',
  category: 'transform',
  trigger: 'loop',
  demos: ['mark', 'play', 'check', 'blob'],
  tags: ['transform', 'scale', 'loop'],
  blurb:
    'Copies of the first part swell outward and fade, half a beat apart, forever. The copies sit behind the original, which never moves.',
  defaults: { duration: 1.6, stagger: 0, delay: 0, ease: 'power1.out' },
  plugins: [],
  reducedMotion: 'skip',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default pulseRing
