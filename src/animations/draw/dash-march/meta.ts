import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const dashMarch: AnimationModule = {
  id: 'dash-march',
  name: 'Dash March',
  category: 'draw',
  trigger: 'loop',
  demos: ['mark', 'wave', 'signature', 'check', 'chart'],
  tags: ['stroke', 'dash', 'loop'],
  blurb:
    'Marching ants: a fixed dash pattern crawls along every stroke, forever. Under a non-scaling stroke the pattern is in screen pixels, so the dashes keep their size at any scale.',
  defaults: { duration: 0.8, stagger: 0, delay: 0, ease: 'none' },
  plugins: [],
  reducedMotion: 'skip',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default dashMarch
