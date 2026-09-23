import { sampleEase } from './sampleEase'

export function easeCurvePath(name: string, samples = 32): string {
  const values = sampleEase(name, samples + 1)
  let d = ''
  values.forEach((v, i) => {
    const t = i / samples
    d += `${i === 0 ? 'M' : 'L'} ${t.toFixed(3)} ${(1 - v).toFixed(3)} `
  })
  return d.trim()
}

export const EASE_DIAGONAL = 'M 0 1 L 1 0'
