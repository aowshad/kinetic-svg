import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const flipReveal: AnimationModule = {
  id: 'flip-reveal',
  name: 'Flip Reveal',
  category: 'transform',
  trigger: 'play',
  demos: ['mark', 'menu', 'wave', 'signature', 'chart', 'blob', 'check', 'play'],
  tags: ['transform', '3d', 'perspective'],
  blurb:
    'The drawing swings round from edge-on, in perspective. It is the <svg> that turns, not a group inside it: the outer <svg> is an ordinary CSS box that takes a real 3D transform.',
  defaults: { duration: 0.8, stagger: 0, delay: 0, ease: 'power3.out' },
  plugins: [],
  reducedMotion: 'settle',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default flipReveal
