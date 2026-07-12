// All-time summary for Trends & Records.
//
// We deliberately DO NOT cache raw history in localStorage — at ~4KB/day/machine
// that would blow past the ~5MB quota within a couple of years. Instead we keep a
// compact per-day summary (a few hundred bytes/day) and DERIVE streaks/records
// from it. The map is keyed by date, so re-folding a date just overwrites it —
// idempotent, which lets us safely re-fetch "today" (still accumulating) on every
// load while older days are fetched once and never again.

import { CONFIG } from './config'
import type { KeystrokeData } from './types'
import type { Manifest } from './api'

const CACHE_KEY = 'ks:alltime:v1'

// Compact per-day record. h = 24 hour-of-day totals, tk = [topKeyCode, count],
// c = corrections (backspace+delete), t = grand total for the day.
export interface DayStat {
  t: number
  h: number[]
  tk: [string, number] | null
  c: number
}
export type DailyMap = Record<string, DayStat>

interface Cached {
  daily: DailyMap
}

function loadCache(): DailyMap {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Cached
    return parsed.daily ?? {}
  } catch {
    return {}
  }
}

function saveCache(daily: DailyMap): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ daily }))
  } catch {
    /* quota — a compact summary should never hit it, but never throw on cache */
  }
}

async function fetchRaw(date: string, host: string): Promise<KeystrokeData | null> {
  const url = `${CONFIG.rawBaseUrl}/${date}/${host}/keystrokes.json`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return (await res.json()) as KeystrokeData
  } catch {
    return null
  }
}

// Fold every host file for one date into a single compact DayStat.
async function foldDate(date: string, hosts: string[]): Promise<DayStat> {
  const files = await Promise.all(hosts.map((h) => fetchRaw(date, h)))
  const h = new Array(24).fill(0)
  const perKey: Record<string, number> = {}
  let t = 0
  let c = 0
  for (const data of files) {
    if (!data) continue
    for (const [hourStr, keys] of Object.entries(data.count_freq)) {
      const hour = Number(hourStr)
      for (const [code, count] of Object.entries(keys)) {
        h[hour] += count
        t += count
        perKey[code] = (perKey[code] || 0) + count
        if (code === 'KEY_BACKSPACE' || code === 'KEY_DELETE') c += count
      }
    }
  }
  let tk: [string, number] | null = null
  for (const [code, count] of Object.entries(perKey)) {
    if (!tk || count > tk[1]) tk = [code, count]
  }
  return { t, h, tk, c }
}

// Module-level promise so Trends + Records mounting together share one load.
let _inflight: Promise<DailyMap> | null = null

export function loadAllTime(manifest: Manifest): Promise<DailyMap> {
  if (_inflight) return _inflight
  _inflight = (async () => {
    const daily = loadCache()
    const latest = manifest.dates[manifest.dates.length - 1]

    // Hosts present for each date, from the manifest (no extra requests).
    const hostsByDate = new Map<string, string[]>()
    for (const e of manifest.entries) {
      const arr = hostsByDate.get(e.date) ?? []
      if (!arr.includes(e.host)) arr.push(e.host)
      hostsByDate.set(e.date, arr)
    }

    // Fetch any date we haven't folded yet, plus always re-fold the latest date
    // (it may still be accumulating today).
    const toFetch = manifest.dates.filter((d) => !(d in daily) || d === latest)
    const folded = await Promise.all(
      toFetch.map(async (d) => [d, await foldDate(d, hostsByDate.get(d) ?? [])] as const),
    )
    for (const [d, stat] of folded) daily[d] = stat

    // Drop any cached date no longer in the manifest (repo history rewritten).
    const known = new Set(manifest.dates)
    for (const d of Object.keys(daily)) if (!known.has(d)) delete daily[d]

    saveCache(daily)
    return daily
  })()
  return _inflight
}

// Force a rebuild (used if the caller wants to bypass cache); mainly for dev.
export function clearAllTimeCache(): void {
  _inflight = null
  try { localStorage.removeItem(CACHE_KEY) } catch { /* ignore */ }
}

// ── Derivations over the daily map ───────────────────────────────────
export interface Streaks {
  current: number
  longest: number
  currentEnd: string | null
}

function sortedDates(daily: DailyMap): string[] {
  return Object.keys(daily).filter((d) => daily[d].t > 0).sort()
}

function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
}

export function streaks(daily: DailyMap): Streaks {
  const dates = sortedDates(daily)
  if (dates.length === 0) return { current: 0, longest: 0, currentEnd: null }
  let longest = 1
  let run = 1
  for (let i = 1; i < dates.length; i++) {
    run = dayDiff(dates[i - 1], dates[i]) === 1 ? run + 1 : 1
    if (run > longest) longest = run
  }
  // Current streak = consecutive run ending at the last active day.
  let current = 1
  for (let i = dates.length - 1; i > 0; i--) {
    if (dayDiff(dates[i - 1], dates[i]) === 1) current++
    else break
  }
  return { current, longest, currentEnd: dates[dates.length - 1] }
}

export interface AllTimeRecords {
  totalPresses: number
  activeDays: number
  busiestDay: { date: string; count: number } | null
  quietestDay: { date: string; count: number } | null
  dailyAverage: number
  peakHour: number | null                 // hour-of-day summed across all days
  hourly: number[]                        // 24-length all-time hour-of-day totals
  recordKeyDay: { date: string; code: string; count: number } | null
  bestCorrectionDay: { date: string; rate: number } | null // lowest correction %
  streaks: Streaks
  daily: { date: string; count: number }[] // ascending, for the trend line
}

export function deriveRecords(daily: DailyMap): AllTimeRecords {
  const entries = Object.entries(daily).filter(([, s]) => s.t > 0)
  const dailySeries = entries.map(([date, s]) => ({ date, count: s.t })).sort((a, b) => (a.date < b.date ? -1 : 1))

  let total = 0
  let busiest: { date: string; count: number } | null = null
  let quietest: { date: string; count: number } | null = null
  let recordKey: { date: string; code: string; count: number } | null = null
  let bestCorr: { date: string; rate: number } | null = null
  const hourly = new Array(24).fill(0)

  for (const [date, s] of entries) {
    total += s.t
    if (!busiest || s.t > busiest.count) busiest = { date, count: s.t }
    if (!quietest || s.t < quietest.count) quietest = { date, count: s.t }
    if (s.tk && (!recordKey || s.tk[1] > recordKey.count)) recordKey = { date, code: s.tk[0], count: s.tk[1] }
    // Only rate days with meaningful volume, so a 3-keystroke day can't "win".
    if (s.t >= 500) {
      const rate = (s.c / s.t) * 100
      if (!bestCorr || rate < bestCorr.rate) bestCorr = { date, rate }
    }
    for (let i = 0; i < 24; i++) hourly[i] += s.h[i] || 0
  }

  const activeDays = entries.length
  const peakHour = hourly.some((v) => v > 0) ? hourly.indexOf(Math.max(...hourly)) : null

  return {
    totalPresses: total,
    activeDays,
    busiestDay: busiest,
    quietestDay: quietest,
    dailyAverage: activeDays > 0 ? Math.round(total / activeDays) : 0,
    peakHour,
    hourly,
    recordKeyDay: recordKey,
    bestCorrectionDay: bestCorr,
    streaks: streaks(daily),
    daily: dailySeries,
  }
}

// Week-over-week: last 7 active-calendar days vs the 7 before, by date window
// anchored on the latest active day.
export function weekOverWeek(daily: DailyMap): { thisWeek: number; lastWeek: number; deltaPct: number } {
  const dates = sortedDates(daily)
  if (dates.length === 0) return { thisWeek: 0, lastWeek: 0, deltaPct: 0 }
  const end = dates[dates.length - 1]
  const sum = (fromExclusive: number, toInclusive: number): number => {
    let acc = 0
    for (const d of dates) {
      const off = dayDiff(d, end) // 0 = latest day
      if (off >= fromExclusive && off < toInclusive) acc += daily[d].t
    }
    return acc
  }
  const thisWeek = sum(0, 7)
  const lastWeek = sum(7, 14)
  const deltaPct = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0
  return { thisWeek, lastWeek, deltaPct }
}
