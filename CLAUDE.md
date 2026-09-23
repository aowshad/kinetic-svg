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

If a verification approach cannot cover some subset, say so explicitly in the
report. Never silently exclude and never downgrade "untestable here" to "fine".
