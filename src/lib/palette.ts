// Design tokens from the validated data-viz reference palette.
// Light/dark values live in CSS custom props (see app.css); JS mirrors the
// hexes it needs for canvas/SVG fills that can't read CSS vars cheaply.

export type Mode = 'light' | 'dark'

// Categorical slots — fixed order, assigned in sequence, never cycled.
// Used to color devices/machines consistently across every chart.
export const CATEGORICAL: Record<Mode, string[]> = {
  light: ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'],
  dark: ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767', '#d55181', '#d95926'],
}

// Single-hue sequential ramp (blue), light→dark, for the keyboard heatmap.
const SEQ_LIGHT = [
  '#eef5fe', '#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5',
  '#256abf', '#184f95', '#104281', '#0d366b',
]
const SEQ_DARK = [
  '#12233b', '#104281', '#184f95', '#1c5cab', '#2a78d6',
  '#3987e5', '#5598e7', '#86b6ef', '#b7d3f6',
]

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Interpolate a sequential ramp at t∈[0,1].
export function sequential(t: number, mode: Mode): string {
  const ramp = mode === 'dark' ? SEQ_DARK : SEQ_LIGHT
  const clamped = Math.max(0, Math.min(1, t))
  const pos = clamped * (ramp.length - 1)
  const i = Math.floor(pos)
  const f = pos - i
  if (i >= ramp.length - 1) return ramp[ramp.length - 1]
  const [r1, g1, b1] = hexToRgb(ramp[i])
  const [r2, g2, b2] = hexToRgb(ramp[i + 1])
  const r = Math.round(r1 + (r2 - r1) * f)
  const g = Math.round(g1 + (g2 - g1) * f)
  const b = Math.round(b1 + (b2 - b1) * f)
  return `rgb(${r}, ${g}, ${b})`
}

// A stable color for a device name (index into the categorical order).
export function deviceColor(index: number, mode: Mode): string {
  const slots = CATEGORICAL[mode]
  return slots[index % slots.length]
}
