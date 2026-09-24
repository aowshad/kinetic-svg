import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const staggerDrop: AnimationModule = {
  id: 'stagger-drop',
  name: 'Stagger Drop',
  category: 'transform',
  trigger: 'play',
  demos: ['mark', 'menu', 'wave', 'signature', 'chart', 'blob', 'check', 'play'],
  tags: ['transform', 'bounce', 'stagger'],
  blurb:
    'Parts drop in from above one after another and bounce as they land. Position and fade are separate animations, since they want different eases.',
  defaults: { duration: 0.9, stagger: 0.09, delay: 0, ease: 'bounce.out' },
  plugins: [],
  reducedMotion: 'settle',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default staggerDrop
