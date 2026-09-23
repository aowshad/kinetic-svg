import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const clipWipe: AnimationModule = {
  id: 'clip-wipe',
  name: 'Clip Wipe',
  category: 'reveal',
  trigger: 'play',
  demos: ['mark', 'check', 'menu'],
  tags: ['clip', 'reveal'],
  blurb: 'A clip rectangle sweeps across, uncovering the artwork left to right. The clip is built in JS, so the markup stays plain art.',
  defaults: { duration: 0.8, stagger: 0, delay: 0, ease: 'power2.out' },
  plugins: [],
  reducedMotion: 'settle',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default clipWipe
