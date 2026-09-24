/**
 * Collects the drawable geometry inside an <svg>.
 *
 * Replaces the text library's splitChars: same job — turn one element into
 * the list of things an animation actually moves — but the unit here is a
 * shape rather than a character.
 *
 * Only elements implementing SVGGeometryElement have getTotalLength(), which
 * is every drawable shape except <text>. Anything inside <defs>, a clipPath
 * or a mask is machinery for another element rather than art to be drawn, so
 * it is left out.
 *
 * Kept in sync by hand with PATHS_SOURCE / STROKE_LENGTH_SOURCE in
 * inlineHelpers.ts.
 */
const GEOMETRY = 'path, line, polyline, polygon, circle, ellipse, rect'

export function paths(svg: SVGSVGElement): SVGGeometryElement[] {
  return [...svg.querySelectorAll<SVGGeometryElement>(GEOMETRY)].filter((el) => !el.closest('defs, clipPath, mask'))
}

/**
 * The shape's length in the units its dash pattern is measured in. Under
 * vector-effect: non-scaling-stroke that is screen pixels, not the path's own
 * user units, so getTotalLength() alone gives a dash that covers only part of
 * the path. Every stroked demo is non-scaling, so every draw animation needs
 * this rather than the raw length.
 */
export function strokeLength(el: SVGGeometryElement): number {
  const m = el.getScreenCTM()
  const nonScaling = getComputedStyle(el).vectorEffect === 'non-scaling-stroke'
  return el.getTotalLength() * (nonScaling && m ? Math.hypot(m.a, m.b) : 1)
}

/**
 * The slack a hidden dash needs at each end of the path. A round or square
 * cap reaches half the stroke's width past its dash, and a dash that ends at
 * the path's start — or the next one in the pattern, starting at its end —
 * still draws that cap as a dot, even at near-zero length. So the offset
 * carries one pad and the gap two, which keeps both neighbours' caps off the
 * path. A butt cap has no overhang and needs none.
 */
export function capPad(el: SVGGeometryElement): number {
  const s = getComputedStyle(el)
  return s.strokeLinecap === 'butt' ? 0 : (parseFloat(s.strokeWidth) || 0) / 2 + 1
}
