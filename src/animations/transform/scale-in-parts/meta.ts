import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const scaleInParts: AnimationModule = {
  id: 'scale-in-parts',
  name: 'Scale In Parts',
  category: 'transform',
  trigger: 'play',
  demos: ['mark', 'menu', 'wave', 'signature', 'chart', 'blob', 'check', 'play'],
  tags: ['transform', 'scale', 'stagger'],
  blurb:
    'Each part grows from nothing out of its own centre, one after another, with a small overshoot as it settles.',
  defaults: { duration: 0.6, stagger: 0.08, delay: 0, ease: 'back.out(1.7)' },
  plugins: [],
  reducedMotion: 'settle',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default scaleInParts
