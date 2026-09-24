# CLAUDE.md

## Verifying animation timing

Before trusting ANY timing measurement in the browser, sanity-check the clock:
run setTimeout(200) and measure actual elapsed time. If it is more than ~1.5x
the requested delay, the environment is throttling and NO timing observation is
valid. Stop, front the tab, or use the manual ticker technique — do not collect
readings and report them as findings.

setTimeout being honest is NOT sufficient for animation work. The timer clock
and the animation clock can fail independently: in this project's own preview
pane, setTimeout measured 202ms for 200ms while a WAAPI animation sat at
playState "running" with currentTime pinned at 0 for a full second. Before
trusting any observation of animation progress, check the animation clock too
— hold one Animation reference and confirm its currentTime advances across a
real wait. If it does not, the only valid reading is a deterministic one: pause
the animation, set currentTime yourself, and assert the computed style at each
point. Scrub every animation on the element together — stacked fill:'both'
animations overwrite each other, so moving one alone shows a frozen value and
looks exactly like a bug in the code.

Never assert on textContent to verify a visual animation. Assert on computed
visual state: opacity, filter, clipPath, transform, visibility.

When asserting that an animation ran, pick a property whose "never ran" value
is impossible, not merely different from its final value. strokeDashoffset: 0
is both "finished" and "never started"; strokeDasharray: none is only "never
started". This is the same failure mode as the textContent assertion: a check
that the animation can satisfy without doing anything. "The rendered state
changed" fails the same way — splitting text into spans or appending clones
changes the DOM whether or not the animation that follows works, which is how
the text section's scroll-color-sweep GSAP tab once passed with its colour
never moving. Setup is not motion. Where no single property qualifies, measure
the never-ran baseline rather than guess it: run the same page with the
animation's JS removed, and require the real run to beat it.

If a verification approach cannot cover some subset, say so explicitly in the
report. Never silently exclude and never downgrade "untestable here" to "fine".

## SVG transforms and strokes

Transform origins are the trap in this section, and the two engines need
opposite things, so a rule that fixes one breaks the other:

- WAAPI: set `transform-box: fill-box` and `transform-origin` inline, in the
  JS, on every element it animates. Without fill-box an SVG origin resolves
  against the canvas, and a bar meant to rotate about its own centre swings
  around the SVG's top-left corner.
- GSAP: use `transformOrigin: '50% 50%'` and never add `transform-box`. GSAP
  resolves the origin against the element's own bounding box and bakes it
  into the matrix it writes; fill-box on top moves what that matrix is
  relative to, and the element lands off target.
- So never put `transform-box` in a style.css the two engines share.

WAAPI animations stacked on the same property of the same element overwrite
each other, and a delayed one's backwards fill does so from the first frame.
Sequence a multi-phase transform as one animation with keyframe offsets and a
per-keyframe easing, not as several animations.

Under `vector-effect: non-scaling-stroke` the dash pattern is measured in
screen pixels, not user units, so a dash of `getTotalLength()` covers only
part of the path. `pathLength` does not rescue it. Scale the length by the
element's screen CTM, and clear the dash once drawn so a resize can't reopen
a gap. Verified in Chromium only — Firefox and WebKit were not available when
this was checked.

Every animation's style.css is applied to the site as well as emitted, so a
preview runs under the same CSS its snippet ships with. When they differed,
the site looked right while the pasted snippet was broken.

Check these by eye — screenshot the settled end state and a mid-point — not
only by assertion. A paste test that measures motion passes a hamburger that
ends as two disconnected strokes.
