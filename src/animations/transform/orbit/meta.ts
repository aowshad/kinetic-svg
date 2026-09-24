import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const orbit: AnimationModule = {
  id: 'orbit',
  name: 'Orbit',
  category: 'transform',
  trigger: 'loop',
  demos: ['mark'],
  tags: ['transform', 'rotate', 'loop'],
  blurb:
    'Everything after the first part circles the centre of the canvas, forever. One shared pivot, so here the canvas is the right reference box, unlike a part turning about itself.',
  defaults: { duration: 6, stagger: 0, delay: 0, ease: 'none' },
  plugins: [],
  reducedMotion: 'skip',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default orbit
