/**
 * The full set of eases offered in the picker. Canonical list — the picker
 * UI and the build-time linear() ease map both read from here, so there's
 * never a mismatch between what a user can pick and what has a
 * precomputed zero-dependency equivalent.
 */
export const EASE_GROUPS: { label: string; eases: string[] }[] = [
  { label: 'Standard', eases: ['none', 'power1.out', 'power1.inOut', 'power2.out', 'power2.inOut', 'power3.out', 'power3.inOut', 'power4.out'] },
  { label: 'Expressive', eases: ['expo.out', 'circ.out', 'sine.inOut'] },
  { label: 'Overshoot', eases: ['back.out(1.7)', 'elastic.out(1, 0.3)', 'bounce.out'] },
]

export const ALL_EASES: string[] = EASE_GROUPS.flatMap((g) => g.eases)

/** Eases whose curve overshoots or oscillates need more linear() samples to stay smooth. */
export const OVERSHOOT_EASES: Set<string> = new Set(EASE_GROUPS.find((g) => g.label === 'Overshoot')!.eases)
