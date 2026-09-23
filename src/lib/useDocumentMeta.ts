import { useEffect } from 'react'

export const SITE_URL = 'https://aowshad.github.io/kinetic-svg/'
export const SITE_NAME = 'Kinetic SVG'
export const SITE_TITLE = 'Kinetic SVG — SVG animations, with or without GSAP'
export const SITE_DESCRIPTION =
  'Copy-paste SVG animations with live previews. Each one emits markup, CSS and JS together, and says plainly whether it needs GSAP.'

function setTag(selector: string, attr: 'content' | 'href', value: string) {
  const el = document.head.querySelector(selector)
  if (el) el.setAttribute(attr, value)
}

/**
 * Keeps the document head in step with the route. The prerender pass reads
 * the head straight off the rendered page, so whatever this writes is what
 * ends up in each route's static HTML — and therefore what a crawler that
 * never runs the bundle sees.
 */
export function useDocumentMeta({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}) {
  useEffect(() => {
    const url = new URL(path, SITE_URL).href
    document.title = title
    setTag('meta[name="description"]', 'content', description)
    setTag('link[rel="canonical"]', 'href', url)
    setTag('meta[property="og:title"]', 'content', title)
    setTag('meta[property="og:description"]', 'content', description)
    setTag('meta[property="og:url"]', 'content', url)
    setTag('meta[name="twitter:title"]', 'content', title)
    setTag('meta[name="twitter:description"]', 'content', description)
  }, [title, description, path])
}
