import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const drawErase: AnimationModule = {
  id: 'draw-erase',
  name: 'Draw & Erase',
  category: 'draw',
  trigger: 'play',
  demos: ['signature', 'wave', 'check', 'chart'],
  tags: ['stroke', 'dash', 'exit'],
  blurb:
    'Draws on, holds, then the tail chases the head off the far end. The dash offset runs on past zero to minus the path length, so the line leaves in the direction it was drawn.',
  defaults: { duration: 1.8, stagger: 0.1, delay: 0, ease: 'power2.inOut' },
  plugins: [],
  reducedMotion: 'settle',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default drawErase
