// Small display-formatting helpers shared across components.
import { INCHES_PER_MILE } from './api'

// Compact human duration from seconds, e.g. 3h 5m, 42m, 18s.
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds)
  if (s <= 0) return '0m'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  if (m > 0) return `${m}m`
  return `${s}s`
}

// Hours as a decimal (for chart axes / per-day averages).
export function toHours(seconds: number): number {
  return seconds / 3600
}

export function toMinutes(seconds: number): number {
  return seconds / 60
}

// Mouse travel: show miles once it's meaningful, otherwise inches/feet.
export function formatDistance(inches: number): string {
  if (inches >= INCHES_PER_MILE) return `${(inches / INCHES_PER_MILE).toFixed(2)} mi`
  if (inches >= 12) return `${(inches / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} ft`
  return `${inches.toFixed(1)} in`
}

export function toMiles(inches: number): number {
  return inches / INCHES_PER_MILE
}
