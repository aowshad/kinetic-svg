import type { AnimationModule } from '../../../lib/types'
import { run } from './gsap'
import { run as vanillaRun } from './vanilla'

const signatureWrite: AnimationModule = {
  id: 'signature-write',
  name: 'Signature Write',
  category: 'draw',
  trigger: 'play',
  demos: ['signature', 'wave', 'check'],
  tags: ['stroke', 'dash', 'handwriting'],
  blurb:
    'One long stroke written at the pace of a real signature: slower than it feels it should be, and eased in and out the way a hand gathers speed mid-stroke.',
  defaults: { duration: 2.4, stagger: 0, delay: 0, ease: 'power1.inOut' },
  plugins: [],
  reducedMotion: 'settle',
  vanilla: 'full',
  impl: { gsap: run, vanilla: vanillaRun },
}

export default signatureWrite
