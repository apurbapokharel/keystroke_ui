import { CONFIG, LETTER_KEYS, HOME_ROW_KEYS, KEY_SETS, categoryOf } from './config'
import type {
  RawFile, NormalizedData, MouseTotals, MouseBucket,
  KeystrokeFile, ManifestEntry, TimeRange, Grain,
  AggregatedStats, KeyStat, TimeBucket, DeviceStat,
} from './types'
import { keyLabel } from './keymap'

// ── Version normalization ───────────────────────────────────────────
// Map either on-disk schema (v1 `count_freq`, or v2
// `keyboard_state`/`mouse_state`/`display_state`) onto one canonical shape.
// Everything downstream reads NormalizedData and never branches on version.
export function normalize(raw: RawFile): NormalizedData {
  // Keyboard: v2 renamed `count_freq` → `keyboard_state`; the inner
  // {hour: {KEY: count}} shape is identical, so this is a pure field alias.
  const keyboard = raw.keyboard_state ?? raw.count_freq ?? {}

  // Mouse & active only exist from v2 on. Absent ⇒ null (not zeroes) so the UI
  // can distinguish "no mouse hardware/old file" from "a real zero".
  const ms = raw.mouse_state
  const mouse: MouseTotals | null = ms
    ? {
        leftClick: ms.left_click ?? 0,
        rightClick: ms.right_click ?? 0,
        middleClick: ms.middle_click ?? 0,
        inches: ms.mouse_inches ?? 0,
        scrolls: ms.mouse_scrolls ?? 0,
      }
    : null
  const active = raw.display_state ?? null

  const version = raw.version ?? (raw.keyboard_state ? 2 : 1)
  return { version, keyboard, mouse, active }
}

export const INCHES_PER_MILE = 63_360

// ── Date helpers (UTC, string-based to dodge timezone drift) ────────
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
export function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
export function addDays(s: string, n: number): string {
  const d = parseDate(s)
  d.setUTCDate(d.getUTCDate() + n)
  return fmtDate(d)
}
function mondayOf(s: string): string {
  const d = parseDate(s)
  const dow = (d.getUTCDay() + 6) % 7 // 0 = Monday
  d.setUTCDate(d.getUTCDate() - dow)
  return fmtDate(d)
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function shortDay(s: string): string {
  const d = parseDate(s)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`
}

// ── Manifest discovery (one recursive tree call, no per-day requests) ─
export interface Manifest {
  entries: ManifestEntry[]
  dates: string[]  // sorted ascending
  hosts: string[]  // sorted
}

export async function fetchManifest(): Promise<Manifest> {
  const res = await fetch(CONFIG.treeUrl, { headers: { Accept: 'application/vnd.github.v3+json' } })
  if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`)
  const json: { tree?: { path: string; type: string }[] } = await res.json()
  const entries: ManifestEntry[] = []
  const re = /^data\/(\d{4}-\d{2}-\d{2})\/([^/]+)\/keystrokes\.json$/
  for (const node of json.tree ?? []) {
    const m = node.path.match(re)
    if (m) entries.push({ date: m[1], host: m[2] })
  }
  const dates = [...new Set(entries.map((e) => e.date))].sort()
  const hosts = [...new Set(entries.map((e) => e.host))].sort()
  return { entries, dates, hosts }
}

// ── File fetch with a small localStorage cache ──────────────────────
async function fetchFile(date: string, host: string): Promise<KeystrokeFile | null> {
  // Cache key bumped to :v2 — entries cached under the old key held the raw v1
  // shape; a fresh namespace avoids feeding stale un-normalized data downstream.
  const cacheKey = `ks:v2:${date}:${host}`
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { t, data } = JSON.parse(cached) as { t: number; data: NormalizedData }
      if (Date.now() - t < CONFIG.cacheTtlMs) return { date, hostname: host, data }
    }
  } catch { /* ignore cache errors */ }

  const url = `${CONFIG.rawBaseUrl}/${date}/${host}/keystrokes.json`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = normalize((await res.json()) as RawFile)
    try { localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), data })) } catch { /* quota */ }
    return { date, hostname: host, data }
  } catch {
    return null
  }
}

// Fetch every (date, host) file whose date falls inside the range.
export async function fetchFiles(manifest: Manifest, range: TimeRange): Promise<KeystrokeFile[]> {
  const wanted = manifest.entries.filter((e) => e.date >= range.start && e.date <= range.end)
  const results = await Promise.all(wanted.map((e) => fetchFile(e.date, e.host)))
  return results.filter((f): f is KeystrokeFile => f !== null)
}

// ── Aggregation ─────────────────────────────────────────────────────
interface Cell { date: string; hour: number; host: string; count: number; keys: Record<string, number> }

function bucketKeyAndLabel(date: string, hour: number, grain: Grain, singleDay: boolean): [string, string] {
  switch (grain) {
    case 'hour': {
      const hh = `${String(hour).padStart(2, '0')}:00`
      const key = `${date} ${String(hour).padStart(2, '0')}` // padded so string sort is chronological
      return singleDay ? [key, hh] : [key, `${shortDay(date)} ${hh}`]
    }
    case 'day':
      return [date, shortDay(date)]
    case 'week': {
      const wk = mondayOf(date)
      return [wk, `Wk ${shortDay(wk)}`]
    }
    case 'month': {
      const ym = date.slice(0, 7)
      const d = parseDate(date)
      return [ym, `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`]
    }
  }
}

// Mouse totals are per-file (per day), with no hour dimension. Bucket them by
// date at the range's grain — at 'hour' grain that collapses to one bar/day.
function mouseBucketKeyAndLabel(date: string, grain: Grain): [string, string] {
  switch (grain) {
    case 'hour':
    case 'day':
      return [date, shortDay(date)]
    case 'week': {
      const wk = mondayOf(date)
      return [wk, `Wk ${shortDay(wk)}`]
    }
    case 'month': {
      const ym = date.slice(0, 7)
      const d = parseDate(date)
      return [ym, `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`]
    }
  }
}

function ratioStat(code: string, count: number, total: number): KeyStat {
  return { code, label: keyLabel(code), count, percentage: total > 0 ? (count / total) * 100 : 0 }
}

export function aggregate(files: KeystrokeFile[], selectedHosts: Set<string>, range: TimeRange): AggregatedStats {
  const active = files.filter((f) => selectedHosts.size === 0 || selectedHosts.has(f.hostname))

  const perKey: Record<string, number> = {}
  const perHostTotal: Record<string, number> = {}
  const perHostKeys: Record<string, Record<string, number>> = {}
  const hourly = new Array(24).fill(0)
  const cells: Cell[] = []
  const activeDates = new Set<string>()

  // Active screen-time (display_state) and mouse (mouse_state) accumulators.
  const activeHourly = new Array(24).fill(0)
  const activeCells: { date: string; hour: number; seconds: number }[] = []
  let hasActiveData = false
  const mouse: MouseTotals = { leftClick: 0, rightClick: 0, middleClick: 0, inches: 0, scrolls: 0 }
  let hasMouseData = false
  const mouseByBucket = new Map<string, MouseBucket & { key: string }>()

  for (const file of active) {
    activeDates.add(file.date)
    for (const [hourStr, keys] of Object.entries(file.data.keyboard)) {
      const hour = Number(hourStr)
      let cellTotal = 0
      for (const [code, count] of Object.entries(keys)) {
        perKey[code] = (perKey[code] || 0) + count
        perHostTotal[file.hostname] = (perHostTotal[file.hostname] || 0) + count
        ;(perHostKeys[file.hostname] ??= {})[code] = (perHostKeys[file.hostname]?.[code] || 0) + count
        hourly[hour] += count
        cellTotal += count
      }
      cells.push({ date: file.date, hour, host: file.hostname, count: cellTotal, keys })
    }

    // Active screen-time: hour -> seconds. Collected as cells so it shares the
    // exact same bucket keys/labels as keystrokes (resolved after the loop).
    if (file.data.active) {
      for (const [hourStr, secs] of Object.entries(file.data.active)) {
        if (!secs) continue
        hasActiveData = true
        const hour = Number(hourStr)
        activeHourly[hour] += secs
        activeCells.push({ date: file.date, hour, seconds: secs })
      }
    }

    // Mouse: one flat total per file, bucketed by date (no hour resolution).
    if (file.data.mouse) {
      hasMouseData = true
      const m = file.data.mouse
      mouse.leftClick += m.leftClick
      mouse.rightClick += m.rightClick
      mouse.middleClick += m.middleClick
      mouse.inches += m.inches
      mouse.scrolls += m.scrolls
      const [key, label] = mouseBucketKeyAndLabel(file.date, range.grain)
      let mb = mouseByBucket.get(key)
      if (!mb) { mb = { key, label, leftClick: 0, rightClick: 0, middleClick: 0, clicks: 0, inches: 0, scrolls: 0 }; mouseByBucket.set(key, mb) }
      mb.leftClick += m.leftClick
      mb.rightClick += m.rightClick
      mb.middleClick += m.middleClick
      mb.clicks += m.leftClick + m.rightClick + m.middleClick
      mb.inches += m.inches
      mb.scrolls += m.scrolls
    }
  }

  const totalPresses = Object.values(perKey).reduce((a, b) => a + b, 0)

  // Time-series buckets (per grain), retaining per-host breakdown.
  const singleDay = activeDates.size <= 1
  const bucketMap = new Map<string, TimeBucket>()
  const ensureBucket = (key: string, label: string): TimeBucket => {
    let b = bucketMap.get(key)
    if (!b) { b = { label, total: 0, byHost: {}, activeSeconds: 0 }; bucketMap.set(key, b) }
    return b
  }
  for (const c of cells) {
    const [key, label] = bucketKeyAndLabel(c.date, c.hour, range.grain, singleDay)
    const b = ensureBucket(key, label)
    b.total += c.count
    b.byHost[c.host] = (b.byHost[c.host] || 0) + c.count
  }
  // Fold active screen-time into the same buckets. An hour with active time but
  // no keystrokes still gets its bucket here, so the "Active" view isn't gappy.
  for (const c of activeCells) {
    const [key, label] = bucketKeyAndLabel(c.date, c.hour, range.grain, singleDay)
    ensureBucket(key, label).activeSeconds += c.seconds
  }
  const timeSeries: TimeBucket[] = [...bucketMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([, v]) => v)

  // Mouse series: ascending by bucket key (date/week/month).
  const mouseSeries: MouseBucket[] = [...mouseByBucket.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([, v]) => ({
      label: v.label, leftClick: v.leftClick, rightClick: v.rightClick,
      middleClick: v.middleClick, clicks: v.clicks, inches: v.inches, scrolls: v.scrolls,
    }))
  const totalActiveSeconds = activeHourly.reduce((a, b) => a + b, 0)

  // Ranked keys.
  const sorted = Object.entries(perKey).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1])
  const topKeys = sorted.slice(0, CONFIG.topN).map(([code, count]) => ratioStat(code, count, totalPresses))
  const letterSorted = sorted.filter(([code]) => LETTER_KEYS.has(code))
  const bottomKeys = letterSorted.slice(-CONFIG.topN).map(([code, count]) => ratioStat(code, count, totalPresses)).reverse()

  // Derived metrics.
  const sumOf = (pred: (code: string) => boolean) =>
    Object.entries(perKey).reduce((a, [k, c]) => a + (pred(k) ? c : 0), 0)
  const totalLetters = sumOf((k) => LETTER_KEYS.has(k))
  const homeRowCount = sumOf((k) => HOME_ROW_KEYS.has(k))
  const corrections = (perKey['KEY_BACKSPACE'] || 0) + (perKey['KEY_DELETE'] || 0)
  const modifiers = sumOf((k) => KEY_SETS.modifiers.has(k))
  const leftHand = sumOf((k) => KEY_SETS.leftHand.has(k))
  const rightHand = sumOf((k) => KEY_SETS.rightHand.has(k))
  const handTotal = leftHand + rightHand

  const peakHour = hourly.some((v) => v > 0) ? hourly.indexOf(Math.max(...hourly)) : null

  // Per-device breakdown with each device's own top key.
  const devices: DeviceStat[] = Object.entries(perHostTotal)
    .sort((a, b) => b[1] - a[1])
    .map(([host, total]) => {
      const kv = Object.entries(perHostKeys[host] || {}).sort((a, b) => b[1] - a[1])[0]
      return {
        host,
        total,
        percentage: totalPresses > 0 ? (total / totalPresses) * 100 : 0,
        topKey: kv ? ratioStat(kv[0], kv[1], total) : null,
      }
    })

  // Category composition.
  const catMap: Record<string, number> = {}
  for (const [code, count] of Object.entries(perKey)) {
    const cat = categoryOf(code)
    catMap[cat] = (catMap[cat] || 0) + count
  }
  const categories = Object.entries(catMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalPresses,
    mostUsed: topKeys[0] || null,
    leastUsed: bottomKeys[bottomKeys.length - 1] || null,
    uniqueKeys: Object.keys(perKey).length,
    homeRowPercent: totalLetters > 0 ? (homeRowCount / totalLetters) * 100 : 0,
    correctionRate: totalPresses > 0 ? (corrections / totalPresses) * 100 : 0,
    modifierPercent: totalPresses > 0 ? (modifiers / totalPresses) * 100 : 0,
    leftHandPercent: handTotal > 0 ? (leftHand / handTotal) * 100 : 0,
    estWords: Math.round(totalLetters / 5),
    peakHour,
    activeDays: activeDates.size,
    topKeys,
    bottomKeys,
    keyCounts: perKey,
    timeSeries,
    hourly,
    devices,
    categories,
    hasActiveData,
    totalActiveSeconds,
    activeHourly,
    hasMouseData,
    mouse,
    mouseSeries,
  }
}
