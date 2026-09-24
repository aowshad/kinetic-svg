import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const rotateAssemble: AnimationModule = {
  id: 'rotate-assemble',
  name: 'Rotate Assemble',
  category: 'transform',
  trigger: 'play',
  demos: ['mark', 'menu', 'wave', 'signature', 'chart', 'blob', 'check', 'play'],
  tags: ['transform', 'rotate', 'stagger'],
  blurb:
    'Parts fly in from a scattered start, each turning about its own centre as it slots into place.',
  defaults: { duration: 0.9, stagger: 0.06, delay: 0, ease: 'power3.out' },
  plugins: [],
  reducedMotion: 'settle',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default rotateAssemble
