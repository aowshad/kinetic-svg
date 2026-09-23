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
 * Kept in sync by hand with PATHS_SOURCE in inlineHelpers.ts.
 */
const GEOMETRY = 'path, line, polyline, polygon, circle, ellipse, rect'

export function paths(svg: SVGSVGElement): SVGGeometryElement[] {
  return [...svg.querySelectorAll<SVGGeometryElement>(GEOMETRY)].filter((el) => !el.closest('defs, clipPath, mask'))
}
