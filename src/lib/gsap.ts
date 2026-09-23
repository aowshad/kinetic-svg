import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(SplitText, ScrambleTextPlugin, ScrollTrigger, TextPlugin, CustomEase)

export { gsap, SplitText, ScrambleTextPlugin, ScrollTrigger, TextPlugin, CustomEase }
