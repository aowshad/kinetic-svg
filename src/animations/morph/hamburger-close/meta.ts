import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const hamburgerClose: AnimationModule = {
  id: 'hamburger-close',
  name: 'Hamburger → Close',
  category: 'morph',
  trigger: 'play',
  demos: ['menu'],
  tags: ['icon', 'transform'],
  blurb:
    'Menu bars fold into a cross. Despite living in the morph section this is not a morph at all — three rects translate and rotate, and no path data changes, which is true of most icon "morphs" people reach for MorphSVG to do.',
  defaults: { duration: 0.6, stagger: 0, delay: 0, ease: 'power3.inOut' },
  plugins: [],
  reducedMotion: 'settle',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default hamburgerClose
