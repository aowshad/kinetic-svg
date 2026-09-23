import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const lineDraw: AnimationModule = {
  id: 'line-draw',
  name: 'Line Draw',
  category: 'draw',
  trigger: 'play',
  demos: ['check', 'wave', 'signature', 'mark', 'chart'],
  tags: ['stroke', 'dash'],
  blurb: 'The stroke draws itself on, as if being written. Measures each path and animates its dash offset to zero.',
  defaults: { duration: 1, stagger: 0.15, delay: 0, ease: 'power2.inOut' },
  plugins: [],
  reducedMotion: 'settle',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default lineDraw
