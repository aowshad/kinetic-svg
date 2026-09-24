import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const spinIn: AnimationModule = {
  id: 'spin-in',
  name: 'Spin In',
  category: 'transform',
  trigger: 'play',
  demos: ['mark', 'menu', 'wave', 'signature', 'chart', 'blob', 'check', 'play'],
  tags: ['transform', 'rotate', 'scale'],
  blurb:
    'The whole drawing spins in from a half-turn back while it grows, overshooting slightly before it settles.',
  defaults: { duration: 0.8, stagger: 0, delay: 0, ease: 'back.out(1.4)' },
  plugins: [],
  reducedMotion: 'settle',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default spinIn
